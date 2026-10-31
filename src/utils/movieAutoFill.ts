import { HorrorAIBreakdown, HorrorTag, MovieTemplate } from '../types/horror';
import { analyzeMovieHorrorAI } from './horrorAiAnalyzer';
import { getStoredAgentApiKey } from './cloudSync';

export interface AutoFillMovieResult {
  title: string;
  originalTitle: string;
  year: number;
  duration: string;
  imdbRating: string;
  subgenre: string;
  fearLevel: 1 | 2 | 3 | 4 | 5;
  bpm: number;
  aiVerdict: string;
  aiBreakdown: HorrorAIBreakdown;
  tags: HorrorTag[];
  synopsis: string;
  posterUrl: string;
  curseWhisper: string;
  source: string;
}

const CURATED_HORROR_DB: Array<{
  keywords: string[];
  title: string;
  originalTitle: string;
  year: number;
  duration: string;
  imdbRating: string;
  synopsis: string;
  posterUrl: string;
  director: string;
}> = [
  {
    keywords: ['frailty', 'a mao do diabo', 'mao do diabo'],
    title: 'Frailty',
    originalTitle: 'Frailty',
    year: 2001,
    duration: '1h 40min',
    imdbRating: '7.2',
    director: 'Bill Paxton',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BM2MyMWVjNGYtZmRkOC00ZWI4LWI2OWEtYzY3YjNiZjgwNGFkXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Um homem entra na sede do FBI no Texas afirmando saber a verdadeira identidade do assassino em série conhecido como "Mão de Deus". Ele revela sua infância sombria ao lado do pai viúvo e fanático, que após receber uma visão acreditava que a família fora escolhida para destruir demônios disfarçados de pessoas comuns.',
  },
  {
    keywords: ['the dark and the wicked', 'o sombrio e o perverso'],
    title: 'The Dark and the Wicked',
    originalTitle: 'The Dark and the Wicked',
    year: 2020,
    duration: '1h 35min',
    imdbRating: '6.1',
    director: 'Bryan Bertino',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMDllNzZjY2MtNWVjNC00YjlhLWI2MzItNjJjMmY4M2JlMTI0XkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Em uma fazenda isolada no interior do Texas, dois irmãos voltam para casa quando o pai adoece gravemente. A mãe, perturbada, implora para que eles não fiquem antes de tirar a própria vida, deixando os filhos cercados por uma entidade maligna e implacável que se alimenta do luto e da dor da família.',
  },
  {
    keywords: ['saccharine'],
    title: 'Saccharine',
    originalTitle: 'Saccharine',
    year: 2026,
    duration: '1h 38min',
    imdbRating: '6.4',
    director: 'Natalie Erika James',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMWNhNjFjZjYtNmViNi00MDRmLTk3ZTMtYmRiMDBhMTlkMjY1XkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Uma estudante de medicina obcecada pelo próprio corpo adquire no mercado clandestino uma pílula milagrosa de emagrecimento feita a partir de cinzas humanas cremadas. O efeito inicial parece perfeito, mas logo ela passa a ser assombrada de forma visceral e faminta pelo espírito da pessoa cujos restos mortais está ingerindo.',
  },
  {
    keywords: ['frewaka', 'fréwaka'],
    title: 'Frewaka',
    originalTitle: 'Fréwaka',
    year: 2024,
    duration: '1h 43min',
    imdbRating: '6.6',
    director: 'Aislinn Clarke',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BM2IyNTI0MzQtNDJkOC00N2QzLTlmZGMtNTUxYWYyZDg3NzdlXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Uma cuidadora marcada por um luto recente é enviada a um vilarejo remoto na Irlanda para cuidar de Peig, uma idosa reclusa e aterrorizada que acredita ter sido raptada por entidades pagãs do folclore celta na juventude. Quando batidas sinistras ecoam à porta durante a noite, traumas ocultos e forças ancestrais despertam.',
  },
  {
    keywords: ['jacobs ladder', "jacob's ladder", 'alucinacoes do passado'],
    title: "Jacob's Ladder",
    originalTitle: "Jacob's Ladder",
    year: 1990,
    duration: '1h 53min',
    imdbRating: '7.4',
    director: 'Adrian Lyne',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BNjUwMTU2ODgxOF5BMl5BanBnXkFtZTgwMjU1NTk4NjE@._V1_SX600.jpg',
    synopsis:
      'Assombrado pela morte de seu filho pequeno e pelas memórias brutais da Guerra do Vietnã, o veterano Jacob Singer tenta manter a sanidade em Nova York. Porém, à medida que alucinações grotescas e figuras sem rosto passam a persegui-lo acordado, a fronteira entre a realidade, a loucura e o próprio inferno começa a desmoronar.',
  },
  {
    keywords: ['heresy', 'witte wieven'],
    title: 'Heresy',
    originalTitle: 'Witte Wieven',
    year: 2024,
    duration: '1h 01min',
    imdbRating: '6.3',
    director: 'Didier Konings',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMzZlYzk4OWMtY2JhYi00YWM0LTkyMGMtMDc5NGU4MzZiNmNkXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Em um vilarejo medieval isolado e fanático devastado pela fome, uma mulher desesperada para curar sua infertilidade adentra a floresta proibida, onde habitam espíritos ancestrais da névoa conhecidos como Witte Wieven. O que ela encontra nas trevas desperta a fúria da comunidade e desafia sua própria fé.',
  },
  {
    keywords: ['the fly', 'a mosca'],
    title: 'A Mosca',
    originalTitle: 'The Fly',
    year: 1986,
    duration: '1h 36min',
    imdbRating: '7.6',
    director: 'David Cronenberg',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMjI5NDE3NTE0NV5BMl5BanBnXkFtZTgwNzY5NTk4NjE@._V1_SX600.jpg',
    synopsis:
      'O brilhante e excêntrico cientista Seth Brundle decide testar em si mesmo sua máquina de teletransporte, sem perceber que uma mosca entrou na cápsula com ele. À medida que seus átomos se fundem aos do inseto, sua mente e seu corpo sofrem uma metamorfose grotesca e irreversível diante da mulher que o ama.',
  },
  {
    keywords: ['the exorcist', 'o exorcista'],
    title: 'O Exorcista',
    originalTitle: 'The Exorcist',
    year: 1973,
    duration: '2h 02min',
    imdbRating: '8.1',
    director: 'William Friedkin',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BZjg3YjE4ZjAtYTdmYS00ZTBkLWE1ZjgtNzAzODUwNzRiYjlmXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Quando a pequena Regan começa a apresentar mudanças brutais de comportamento, voz demoníaca e fenômenos inexplicáveis que a medicina não consegue diagnosticar, sua mãe desesperada recorre a dois padres para enfrentar uma antiga entidade maligna em um ritual de exorcismo mortal.',
  },
  {
    keywords: ['hereditario', 'hereditary'],
    title: 'Hereditário',
    originalTitle: 'Hereditary',
    year: 2018,
    duration: '2h 07min',
    imdbRating: '7.3',
    director: 'Ari Aster',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BNTEyZGQwODctYWJjZi00NjFmLTg3YmEtMzlhNjljOGZhMWMyXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Após a morte da reclusa matriarca da família Graham, sua filha e netos começam a desvendar segredos ancestrais cada vez mais aterrorizantes sobre sua linhagem e um destino sinistro que herdaram.',
  },
  {
    keywords: ['a bruxa', 'the witch', 'vvitch'],
    title: 'A Bruxa',
    originalTitle: 'The Witch',
    year: 2015,
    duration: '1h 32min',
    imdbRating: '7.0',
    director: 'Robert Eggers',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMTUyNzkwMzAxOF5BMl5BanBnXkFtZTgwMzc1OTk1NjE@._V1_SX600.jpg',
    synopsis:
      'Nova Inglaterra, década de 1630. Uma família devota se estabelece à beira de uma floresta sombria. Quando o filho recém-nascido desaparece misteriosamente, a paranoia e forças ocultas da mata tomam conta.',
  },
  {
    keywords: ['fale comigo', 'talk to me'],
    title: 'Fale Comigo',
    originalTitle: 'Talk to Me',
    year: 2022,
    duration: '1h 35min',
    imdbRating: '7.1',
    director: 'Danny Philippou',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BY2I2NzJmY2YtYTM3Ni00ZGJhLThkZTItODFhMzhlZjZkMDQ5XkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Um grupo de amigos descobre como conjurar espíritos usando uma mão embalsamada misteriosa. A brincadeira vira um vício perigoso até que um deles ultrapassa os 90 segundos permitidos e abre a porta para as trevas.',
  },
  {
    keywords: ['o iluminado', 'the shining'],
    title: 'O Iluminado',
    originalTitle: 'The Shining',
    year: 1980,
    duration: '2h 26min',
    imdbRating: '8.4',
    director: 'Stanley Kubrick',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BNmM5ZThhY2ItOGRjOS00NzZiLWEwYTItNDgyMjFkOTgxMmRiXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Durante o inverno rigoroso, um escritor aceita trabalhar como zelador do isolado Hotel Overlook com sua esposa e seu filho clarividente. Porém, as presenças fantasmagóricas do hotel começam a levá-lo à loucura.',
  },
  {
    keywords: ['invocacao do mal', 'the conjuring'],
    title: 'Invocação do Mal',
    originalTitle: 'The Conjuring',
    year: 2013,
    duration: '1h 52min',
    imdbRating: '7.5',
    director: 'James Wan',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMTM3NjA1NDMyMV5BMl5BanBnXkFtZTcwMDQzNDMzOQ@@._V1_SX600.jpg',
    synopsis:
      'Os investigadores paranormais Ed e Lorraine Warren são chamados para ajudar uma família aterrorizada por uma presença obscura em uma fazenda isolada onde todos os relógios param exatamente às 03:07 da madrugada.',
  },
  {
    keywords: ['o chamado', 'the ring', 'ringu'],
    title: 'O Chamado',
    originalTitle: 'The Ring',
    year: 2002,
    duration: '1h 55min',
    imdbRating: '7.1',
    director: 'Gore Verbinski',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BNDA2NTg2NjE4Ml5BMl5BanBnXkFtZTYwMjYxMDg5._V1_SX600.jpg',
    synopsis:
      'Uma jornalista investiga uma fita VHS amaldiçoada cheia de imagens perturbadoras. Após assisti-la, o telefone toca e uma voz anuncia que restam apenas sete dias de vida.',
  },
  {
    keywords: ['a autopsia', 'the autopsy of jane doe'],
    title: 'A Autópsia',
    originalTitle: 'The Autopsy of Jane Doe',
    year: 2016,
    duration: '1h 26min',
    imdbRating: '6.8',
    director: 'André Øvredal',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMjA2MTEzMzkzM15BMl5BanBnXkFtZTgwMjM2MTM5MDI@._V1_SX600.jpg',
    synopsis:
      'Pai e filho médicos-legistas recebem o corpo de uma jovem desconhecida sem causa aparente de morte. Enquanto uma tempestade os prende no necrotério subterrâneo, cada incisão revela segredos impossíveis.',
  },
  {
    keywords: ['sorria', 'smile'],
    title: 'Sorria',
    originalTitle: 'Smile',
    year: 2022,
    duration: '1h 55min',
    imdbRating: '6.5',
    director: 'Parker Finn',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BNjFhMzBlNzktMjE2Ni00YTMyLWI2YWUtYmM1N2QxMDQwZmZhXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Após testemunhar um incidente traumático e bizarro envolvendo uma paciente, a médica Rose Cotter começa a vivenciar acontecimentos assustadores que ela não consegue explicar, perseguida por uma entidade que sorri através das pessoas.',
  },
];

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function findCuratedMovieMatch(titleOrQuery: string) {
  const norm = normalizeStr(titleOrQuery);
  if (!norm) return undefined;
  return CURATED_HORROR_DB.find((item) =>
    item.keywords.some((k) => norm === k || norm.includes(k) || k.includes(norm))
  );
}

/**
 * Detects whether a synopsis is broken, encyclopedic ("X é um filme de 1990 dirigido por..."),
 * an actor/director biography ("Rósa Arianna McGowan é uma atriz..."), a generic placeholder,
 * or untranslated English text.
 */
export function isBadSynopsis(synopsis?: string): boolean {
  if (!synopsis) return true;
  const s = synopsis.trim();
  if (s.length < 55) return true;

  // Generic placeholders
  if (
    /^(Filme de terror estrelado por|Um filme de terror selecionado|Um mistério sombrio escolhido)/i.test(
      s
    )
  ) {
    return true;
  }

  // Actor / person biographies (e.g., Rose McGowan)
  if (
    /\b(é uma? atriz|é um ator|é uma? diretora?|é um cineasta|nascid[oa] na|nascid[oa] em|conhecid[oa] principalmente por seu papel|maior bilheteira em seu país)\b/i.test(
      s
    )
  ) {
    return true;
  }

  // Wikipedia encyclopedic credits header instead of story plot
  if (
    /\b(é um filme\b|dirigido e estrelado por|escrito e dirigido por|dirigido por [A-ZÀ-Ú][\w\s]+,?\s+com roteiro|estreia na direção|produzido por .* e distribuído)\b/i.test(
      s
    )
  ) {
    return true;
  }

  // Untranslated English synopsis check
  const englishStopWords = (
    s.match(/\b(the|and|with|from|their|after|when|who|into|that|this|young|family|woman|man)\b/gi) ||
    []
  ).length;
  if (englishStopWords >= 4) {
    return true;
  }

  return false;
}

/**
 * Generates or translates a real, atmospheric, spoiler-free plot synopsis in Brazilian Portuguese
 * using Google Gemini 2.5 Flash (or free Cloud LLM fallback), never returning Wikipedia credits headers.
 */
export async function generatePortuguesePlotSynopsis(params: {
  title: string;
  originalTitle?: string;
  year?: number;
  director?: string;
  rawPlot?: string;
}): Promise<string | null> {
  const curated =
    findCuratedMovieMatch(params.title) ||
    (params.originalTitle ? findCuratedMovieMatch(params.originalTitle) : undefined);
  if (curated && !isBadSynopsis(curated.synopsis)) {
    return curated.synopsis;
  }

  const systemInstruction = `Você é um curador especialista em cinema de terror.
Sua tarefa é escrever APENAS a sinopse do enredo (a história do que acontece no filme) em português do Brasil, de forma envolvente, sombria e SEM SPOILERS do final, em 2 a 3 frases (entre 160 e 340 caracteres).

REGRAS OBRIGATÓRIAS:
1. CONTE A HISTÓRIA (quem são os personagens, onde estão e qual mistério, maldição ou ameaça enfrentam).
2. PROIBIDO começar com ficha técnica estilo Wikipédia! NUNCA escreva "X é um filme de terror de 2020 dirigido por..." ou "Estrelado por...". Comece direto na história!
3. PROIBIDO escrever biografia de atores ou diretores.
4. Responda APENAS com o texto puro da sinopse em português, sem aspas, sem introdução e sem markdown.`;

  const hasValidRawPlot =
    params.rawPlot &&
    params.rawPlot.trim().length > 35 &&
    !/\b(é uma? atriz|é um ator|conhecid[oa] principalmente por seu papel)\b/i.test(params.rawPlot);

  const userPrompt = `Filme de terror: "${params.title}"${
    params.originalTitle && params.originalTitle !== params.title
      ? ` (Título original: "${params.originalTitle}")`
      : ''
  }${params.year ? ` (${params.year})` : ''}${
    params.director ? ` — Direção/Elenco: ${params.director}` : ''
  }.${
    hasValidRawPlot
      ? `\n\nResumo de referência do enredo (traduza/adapte apenas a história para português, removendo qualquer ficha técnica de diretor/elenco):\n"${params.rawPlot}"`
      : '\n\nEscreva a sinopse real do enredo deste filme em português.'
  }`;

  const apiKey = getStoredAgentApiKey();

  // 1. Try Google Gemini 2.5 Flash
  if (apiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        apiKey
      )}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 300,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text && !isBadSynopsis(text)) {
          return text.replace(/^["«]|["»]$/g, '').trim();
        }
      }
    } catch {
      // Fall through to Pollinations fallback
    }
  }

  // 2. Fallback: Free Cloud OpenAI-compatible reasoning endpoint
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text && !isBadSynopsis(text)) {
        return text.replace(/^["«]|["»]$/g, '').trim();
      }
    }
  } catch {
    // Ignore
  }

  return null;
}

export async function autoFillMovieByName(query: string): Promise<AutoFillMovieResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const curatedHit = findCuratedMovieMatch(cleanQuery);
  const results: AutoFillMovieResult[] = [];

  try {
    const res = await fetch(`/api/movie-autofill?q=${encodeURIComponent(cleanQuery)}`);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      const candidates = Array.isArray(data?.candidates) ? data.candidates : [];

      for (const c of candidates) {
        const title = String(c.title || cleanQuery);
        const originalTitle = String(c.originalTitle || title);
        const matchedCurated =
          findCuratedMovieMatch(title) || findCuratedMovieMatch(originalTitle) || curatedHit;

        const rawSynopsis = String(c.synopsis || '').trim();
        const synopsis =
          matchedCurated?.synopsis ||
          (!isBadSynopsis(rawSynopsis) ? rawSynopsis : '') ||
          rawSynopsis;

        const ai = analyzeMovieHorrorAI({
          title,
          originalTitle,
          synopsis,
          genre: String(c.genre || ''),
          director: String(c.director || matchedCurated?.director || ''),
        });

        results.push({
          title: matchedCurated ? matchedCurated.title : title,
          originalTitle: matchedCurated ? matchedCurated.originalTitle : originalTitle,
          year: Number(c.year || matchedCurated?.year || 2024),
          duration:
            c.duration && c.duration !== '1h 45min' && c.duration !== '1h 50min'
              ? String(c.duration)
              : matchedCurated?.duration || String(c.duration || '1h 45min'),
          imdbRating: String(matchedCurated?.imdbRating || c.imdbRating || '7.1'),
          subgenre: ai.subgenre,
          fearLevel: ai.fearLevel,
          bpm: ai.bpm,
          aiVerdict: ai.aiVerdict,
          aiBreakdown: ai.aiBreakdown,
          tags: ai.tags,
          synopsis,
          posterUrl: String(c.posterUrl || matchedCurated?.posterUrl || ''),
          curseWhisper: ai.curseWhisper,
          source: `${String(c.source || 'Catálogo')} + IA Terrômetro`,
        });
      }
    }
  } catch {
    // Proceed to client-side CORS fallback
  }

  if (results.length === 0) {
    try {
      const firstChar = cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '')[0] || 'a';
      const imdbTarget = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(
        cleanQuery.toLowerCase()
      )}.json`;

      const [itunesBrRes, itunesUsRes, imdbProxyRes] = await Promise.allSettled([
        fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            cleanQuery
          )}&media=movie&entity=movie&country=BR&lang=pt_br&limit=5`
        ).then((r) => r.json()),
        fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(
            cleanQuery
          )}&media=movie&entity=movie&country=US&limit=5`
        ).then((r) => r.json()),
        fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(imdbTarget)}`).then((r) =>
          r.json()
        ),
      ]);

      const brList =
        itunesBrRes.status === 'fulfilled' && Array.isArray(itunesBrRes.value?.results)
          ? itunesBrRes.value.results
          : [];
      const usList =
        itunesUsRes.status === 'fulfilled' && Array.isArray(itunesUsRes.value?.results)
          ? itunesUsRes.value.results
          : [];
      const combinedItunes = [...brList, ...usList];

      for (const item of combinedItunes) {
        const posterUrl = String(item.artworkUrl100 || '').replace('100x100bb', '600x900bb');
        const millis = Number(item.trackTimeMillis || 0);
        const totalMinutes = millis > 0 ? Math.round(millis / 60000) : 105;
        const duration = `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(
          2,
          '0'
        )}min`;
        const title = String(item.trackName || cleanQuery);
        const matchedCurated = findCuratedMovieMatch(title) || curatedHit;
        const rawDesc = String(item.longDescription || item.shortDescription || '');
        const synopsis = matchedCurated?.synopsis || rawDesc;

        const ai = analyzeMovieHorrorAI({
          title,
          originalTitle: title,
          synopsis,
          genre: String(item.primaryGenreName || ''),
          director: String(item.artistName || ''),
          advisoryRating: String(item.contentAdvisoryRating || ''),
        });

        results.push({
          title: matchedCurated ? matchedCurated.title : title,
          originalTitle: matchedCurated ? matchedCurated.originalTitle : title,
          year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : 2024,
          duration: matchedCurated?.duration || duration,
          imdbRating: matchedCurated?.imdbRating || '7.1',
          subgenre: ai.subgenre,
          fearLevel: ai.fearLevel,
          bpm: ai.bpm,
          aiVerdict: ai.aiVerdict,
          aiBreakdown: ai.aiBreakdown,
          tags: ai.tags,
          synopsis,
          posterUrl: posterUrl || matchedCurated?.posterUrl || '',
          curseWhisper: ai.curseWhisper,
          source: 'Apple TV + IA Terrômetro',
        });
      }

      if (
        imdbProxyRes.status === 'fulfilled' &&
        Array.isArray(imdbProxyRes.value?.d)
      ) {
        const imdbItems = imdbProxyRes.value.d.filter(
          (item: Record<string, unknown>) => item.qid === 'movie' || item.q === 'feature'
        );
        for (const item of imdbItems.slice(0, 4)) {
          const imgObj = item.i as { imageUrl?: string } | undefined;
          const rawImg = String(imgObj?.imageUrl || '');
          const highResImdb = rawImg
            ? rawImg.replace(/\._V1_.*\.jpg$/i, '._V1_SX600.jpg')
            : '';
          const title = String(item.l || cleanQuery);
          const matchedCurated = findCuratedMovieMatch(title) || curatedHit;
          const synopsis = matchedCurated?.synopsis || '';
          const ai = analyzeMovieHorrorAI({
            title,
            originalTitle: title,
            synopsis,
            director: String(item.s || ''),
          });
          results.push({
            title: matchedCurated ? matchedCurated.title : title,
            originalTitle: matchedCurated ? matchedCurated.originalTitle : title,
            year: Number(item.y || matchedCurated?.year || 2024),
            duration: matchedCurated?.duration || '1h 45min',
            imdbRating: matchedCurated?.imdbRating || '7.0',
            subgenre: ai.subgenre,
            fearLevel: ai.fearLevel,
            bpm: ai.bpm,
            aiVerdict: ai.aiVerdict,
            aiBreakdown: ai.aiBreakdown,
            tags: ai.tags,
            synopsis,
            posterUrl: highResImdb || matchedCurated?.posterUrl || '',
            curseWhisper: ai.curseWhisper,
            source: 'IMDb Oficial + IA Terrômetro',
          });
        }
      }
    } catch {
      // Ignore
    }
  }

  if (curatedHit && results.length === 0) {
    const ai = analyzeMovieHorrorAI({
      title: curatedHit.title,
      originalTitle: curatedHit.originalTitle,
      synopsis: curatedHit.synopsis,
      director: curatedHit.director,
    });
    results.push({
      title: curatedHit.title,
      originalTitle: curatedHit.originalTitle,
      year: curatedHit.year,
      duration: curatedHit.duration,
      imdbRating: curatedHit.imdbRating,
      subgenre: ai.subgenre,
      fearLevel: ai.fearLevel,
      bpm: ai.bpm,
      aiVerdict: ai.aiVerdict,
      aiBreakdown: ai.aiBreakdown,
      tags: ai.tags,
      synopsis: curatedHit.synopsis,
      posterUrl: curatedHit.posterUrl,
      curseWhisper: ai.curseWhisper,
      source: 'Base Embutida + IA Terrômetro',
    });
  } else if (results.length === 0) {
    const ai = analyzeMovieHorrorAI({ title: cleanQuery });
    results.push({
      title: cleanQuery,
      originalTitle: cleanQuery,
      year: 2024,
      duration: '1h 45min',
      imdbRating: '7.0',
      subgenre: ai.subgenre,
      fearLevel: ai.fearLevel,
      bpm: ai.bpm,
      aiVerdict: ai.aiVerdict,
      aiBreakdown: ai.aiBreakdown,
      tags: ai.tags,
      synopsis: '',
      posterUrl: '',
      curseWhisper: ai.curseWhisper,
      source: 'Análise IA Terrômetro',
    });
  }

  // Ensure the primary candidates have a genuine, spoiler-free Portuguese plot synopsis (not English, not Wikipedia header, not actor bio)
  const topCandidates = results.slice(0, 2);
  await Promise.all(
    topCandidates.map(async (item) => {
      if (isBadSynopsis(item.synopsis)) {
        const betterSynopsis = await generatePortuguesePlotSynopsis({
          title: item.title,
          originalTitle: item.originalTitle,
          year: item.year,
          rawPlot: item.synopsis,
        });
        if (betterSynopsis) {
          item.synopsis = betterSynopsis;
          const refreshedAi = analyzeMovieHorrorAI({
            title: item.title,
            originalTitle: item.originalTitle,
            synopsis: betterSynopsis,
          });
          item.subgenre = refreshedAi.subgenre;
          item.fearLevel = refreshedAi.fearLevel;
          item.bpm = refreshedAi.bpm;
          item.aiVerdict = refreshedAi.aiVerdict;
          item.aiBreakdown = refreshedAi.aiBreakdown;
          item.tags = refreshedAi.tags;
          item.curseWhisper = refreshedAi.curseWhisper;
        } else if (!item.synopsis || isBadSynopsis(item.synopsis)) {
          item.synopsis = `À medida que segredos ocultos vêm à tona em "${item.title}", forças sombrias e inexplicáveis transformam a realidade em um pesadelo sem volta.`;
        }
      }
    })
  );

  return results;
}

export async function persistMoviesEverywhere(movies: MovieTemplate[]): Promise<boolean> {
  try {
    localStorage.setItem('horror_night_movies_v3', JSON.stringify(movies));
  } catch {
    // Ignore
  }
  try {
    const res = await fetch('/api/save-movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movies }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
