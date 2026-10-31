export default async function handler(req, res) {
  try {
    const query = String(req.query?.q || '').trim();
    if (!query) {
      res.status(400).json({ error: 'Missing query' });
      return;
    }

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
        ? imdbRes.value.d.filter(
            (item) => item.qid === 'movie' || item.q === 'feature'
          )
        : [];

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
            // ignore
          }
        }
      } catch {
        // ignore
      }
    }

    const candidates = [];

    brResults.forEach((item) => {
      const rawArt = String(item.artworkUrl100 || '');
      const highResPoster = rawArt ? rawArt.replace('100x100bb', '600x900bb') : '';
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
        synopsis: String(item.longDescription || item.shortDescription || fetchedImdbPlot || ''),
        posterUrl: highResPoster,
        director: String(item.artistName || ''),
        genre: String(item.primaryGenreName || 'Terror'),
        source: 'Apple TV / IMDb',
      });
    });

    usResults.forEach((item) => {
      const rawArt = String(item.artworkUrl100 || '');
      const highResPoster = rawArt ? rawArt.replace('100x100bb', '600x900bb') : '';
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
        synopsis: String(item.longDescription || item.shortDescription || fetchedImdbPlot || ''),
        posterUrl: highResPoster,
        director: String(item.artistName || ''),
        genre: String(item.primaryGenreName || 'Horror'),
        source: 'iTunes + IMDb',
      });
    });

    imdbResults.slice(0, 4).forEach((item, idx) => {
      const rawImg = String(item.i?.imageUrl || '');
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

    res.status(200).json({ candidates });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
