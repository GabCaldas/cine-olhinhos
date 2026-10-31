import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'horror-movie-autofill-and-save',
      configureServer(server) {
        // 1. Server-side Movie Auto-Fill Endpoint (combines iTunes BR/US + IMDb + Wikipedia PT)
        server.middlewares.use('/api/movie-autofill', async (req, res) => {
          try {
            const urlObj = new URL(req.url || '', 'http://localhost');
            const query = (urlObj.searchParams.get('q') || '').trim();
            if (!query) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing query' }));
              return;
            }

            // A) Search iTunes Brazil (for Portuguese Title, Synopsis, Runtime, Year & Poster)
            const itunesBrUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
              query
            )}&media=movie&entity=movie&country=BR&lang=pt_br&limit=5`;
            const itunesUsUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
              query
            )}&media=movie&entity=movie&country=US&limit=5`;

            const firstChar = query.toLowerCase().replace(/[^a-z0-9]/g, '')[0] || 'a';
            const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(
              query.toLowerCase()
            )}.json`;

            const [brRes, usRes, imdbRes] = await Promise.allSettled([
              fetch(itunesBrUrl).then((r) => r.json()),
              fetch(itunesUsUrl).then((r) => r.json()),
              fetch(imdbUrl).then((r) => r.json()),
            ]);

            const brResults =
              brRes.status === 'fulfilled' && Array.isArray(brRes.value?.results)
                ? brRes.value.results
                : [];
            const usResults =
              usRes.status === 'fulfilled' && Array.isArray(usRes.value?.results)
                ? usRes.value.results
                : [];
            const imdbResults =
              imdbRes.status === 'fulfilled' && Array.isArray(imdbRes.value?.d)
                ? imdbRes.value.d.filter((item: Record<string, unknown>) => item.qid === 'movie' || item.q === 'feature')
                : [];

            // Fetch real IMDb Rating, Runtime & Official Plot for the top IMDb match (via IMDb JSON-LD)
            let fetchedImdbRating = '';
            let fetchedImdbPlot = '';
            let fetchedImdbDuration = '';
            const topImdbId = imdbResults[0]?.id ? String(imdbResults[0].id) : '';
            if (topImdbId && topImdbId.startsWith('tt')) {
              try {
                const imdbPage = await fetch(`https://www.imdb.com/title/${topImdbId}/`, {
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
                  },
                }).then((r) => r.text());

                const ldMatch = imdbPage.match(
                  /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
                );
                if (ldMatch && ldMatch[1]) {
                  try {
                    const ldJson = JSON.parse(ldMatch[1]);
                    if (ldJson?.aggregateRating?.ratingValue) {
                      fetchedImdbRating = String(ldJson.aggregateRating.ratingValue);
                    }
                    if (typeof ldJson?.description === 'string' && ldJson.description.trim()) {
                      // Decode basic HTML entities if present
                      fetchedImdbPlot = ldJson.description
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;|&apos;/g, "'")
                        .replace(/&amp;/g, '&')
                        .trim();
                    }
                    if (typeof ldJson?.duration === 'string') {
                      const durMatch = ldJson.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
                      if (durMatch && (durMatch[1] || durMatch[2])) {
                        const h = Number(durMatch[1] || 0);
                        const m = Number(durMatch[2] || 0);
                        fetchedImdbDuration = `${h}h ${String(m).padStart(2, '0')}min`;
                      }
                    }
                  } catch {
                    // fallback to regex below
                  }
                }

                if (!fetchedImdbRating) {
                  const ratingMatch = imdbPage.match(/"ratingValue"\s*:\s*([0-9.]+)/);
                  if (ratingMatch && ratingMatch[1]) {
                    fetchedImdbRating = ratingMatch[1];
                  }
                }
              } catch {
                // ignore imdb scrape error
              }
            }

            // Build candidate list so user can pick or auto-fill the top match
            const candidates: Array<Record<string, unknown>> = [];

            brResults.forEach((item: Record<string, unknown>) => {
              const rawArt = String(item.artworkUrl100 || '');
              const highResPoster = rawArt
                ? rawArt.replace('100x100bb', '600x900bb')
                : '';
              const millis = Number(item.trackTimeMillis || 0);
              const totalMinutes = millis > 0 ? Math.round(millis / 60000) : 0;
              const hours = Math.floor(totalMinutes / 60);
              const mins = totalMinutes % 60;
              const duration =
                totalMinutes > 0
                  ? `${hours}h ${String(mins).padStart(2, '0')}min`
                  : fetchedImdbDuration || '1h 45min';
              const year = item.releaseDate
                ? new Date(String(item.releaseDate)).getFullYear()
                : 2024;

              candidates.push({
                title: String(item.trackName || query),
                originalTitle: String(item.collectionName || item.trackName || query),
                year,
                duration,
                imdbRating: fetchedImdbRating || '7.2',
                synopsis: String(
                  item.longDescription || item.shortDescription || fetchedImdbPlot || ''
                ),
                posterUrl: highResPoster,
                director: String(item.artistName || ''),
                genre: String(item.primaryGenreName || 'Terror'),
                source: 'Apple TV / IMDb',
              });
            });

            // Add US iTunes / IMDb matches if not already enough or if BR didn't have it
            usResults.forEach((item: Record<string, unknown>) => {
              const rawArt = String(item.artworkUrl100 || '');
              const highResPoster = rawArt
                ? rawArt.replace('100x100bb', '600x900bb')
                : '';
              const millis = Number(item.trackTimeMillis || 0);
              const totalMinutes = millis > 0 ? Math.round(millis / 60000) : 0;
              const hours = Math.floor(totalMinutes / 60);
              const mins = totalMinutes % 60;
              const duration =
                totalMinutes > 0
                  ? `${hours}h ${String(mins).padStart(2, '0')}min`
                  : fetchedImdbDuration || '1h 45min';
              const year = item.releaseDate
                ? new Date(String(item.releaseDate)).getFullYear()
                : 2024;

              candidates.push({
                title: String(item.trackName || query),
                originalTitle: String(item.trackName || query),
                year,
                duration,
                imdbRating: fetchedImdbRating || '7.1',
                synopsis: String(
                  item.longDescription || item.shortDescription || fetchedImdbPlot || ''
                ),
                posterUrl: highResPoster,
                director: String(item.artistName || ''),
                genre: String(item.primaryGenreName || 'Horror'),
                source: 'iTunes + IMDb',
              });
            });

            imdbResults.slice(0, 4).forEach((item: Record<string, unknown>, idx: number) => {
              const imgObj = item.i as { imageUrl?: string } | undefined;
              const rawImg = String(imgObj?.imageUrl || '');
              // Convert IMDb thumbnail to 600px poster
              const highResImdb = rawImg
                ? rawImg.replace(/\._V1_.*\.jpg$/i, '._V1_SX600.jpg')
                : '';
              candidates.push({
                title: String(item.l || query),
                originalTitle: String(item.l || query),
                year: Number(item.y || 2024),
                duration: idx === 0 && fetchedImdbDuration ? fetchedImdbDuration : '1h 45min',
                imdbRating: fetchedImdbRating || '7.0',
                synopsis: idx === 0 && fetchedImdbPlot ? fetchedImdbPlot : '',
                posterUrl: highResImdb,
                director: String(item.s || ''),
                genre: 'Terror & Suspense',
                source: 'IMDb Oficial',
              });
            });

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ candidates }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });

        // 2. Endpoint to save updated movies directly into src/data/movies.ts on disk
        server.middlewares.use('/api/save-movies', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (!Array.isArray(parsed.movies)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid movies array' }));
                return;
              }
              const filePath = path.resolve(process.cwd(), 'src/data/movies.ts');
              const currentFile = fs.readFileSync(filePath, 'utf-8');
              const startMarker = '// __MOVIES_ARRAY_START__';
              const endMarker = '// __MOVIES_ARRAY_END__';
              const startIdx = currentFile.indexOf(startMarker);
              const endIdx = currentFile.indexOf(endMarker);

              if (startIdx !== -1 && endIdx !== -1) {
                const replacement = `${startMarker}\nexport const INITIAL_MOVIES: MovieTemplate[] = ${JSON.stringify(
                  parsed.movies,
                  null,
                  2
                )};\n${endMarker}`;
                const updatedContent =
                  currentFile.slice(0, startIdx) +
                  replacement +
                  currentFile.slice(endIdx + endMarker.length);
                fs.writeFileSync(filePath, updatedContent, 'utf-8');
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
        });

        // 3. Endpoint to save chosen movies history into src/data/chosenMovies.ts on disk
        server.middlewares.use('/api/save-chosen-movies', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (!Array.isArray(parsed.chosenMovies)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid chosenMovies array' }));
                return;
              }
              const filePath = path.resolve(process.cwd(), 'src/data/chosenMovies.ts');
              const currentFile = fs.readFileSync(filePath, 'utf-8');
              const startMarker = '// __CHOSEN_MOVIES_START__';
              const endMarker = '// __CHOSEN_MOVIES_END__';
              const startIdx = currentFile.indexOf(startMarker);
              const endIdx = currentFile.indexOf(endMarker);

              if (startIdx !== -1 && endIdx !== -1) {
                const replacement = `${startMarker}\nexport const INITIAL_CHOSEN_MOVIES: ChosenMovieRecord[] = ${JSON.stringify(
                  parsed.chosenMovies,
                  null,
                  2
                )};\n${endMarker}`;
                const updatedContent =
                  currentFile.slice(0, startIdx) +
                  replacement +
                  currentFile.slice(endIdx + endMarker.length);
                fs.writeFileSync(filePath, updatedContent, 'utf-8');
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true }));
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
        });
      },
    },
  ],
});
