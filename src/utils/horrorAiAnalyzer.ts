import { HorrorAIBreakdown, HorrorTag } from '../types/horror';

export interface HorrorAIResult {
  fearLevel: 1 | 2 | 3 | 4 | 5;
  bpm: number;
  aiVerdict: string;
  aiBreakdown: HorrorAIBreakdown;
  tags: HorrorTag[];
  subgenre: string;
  curseWhisper: string;
  isHorror: boolean;
}

const KNOWN_NON_HORROR_KEYWORDS = [
  'fantastic mr. fox',
  'fantastico sr. raposo',
  'fantastico sr raposo',
  'megamind',
  'megamente',
  'everything everywhere',
  'tudo em todo o lugar',
  'wild robot',
  'robo selvagem',
  'totoro',
  'teen beach',
  'pitch perfect',
  'escolha perfeita',
  'minions',
  'meu malvado favorito',
  'shrek',
  'ratatouille',
  'wall-e',
  'up altas aventuras',
  'divertida mente',
  'inside out',
  'coco',
  'viva a vida e uma festa',
  'la la land',
  'questao de tempo',
  'about time',
  'spirited away',
  'viagem de chihiro',
  'howls moving castle',
  'castelo animado',
  'spider-verse',
  'aranhaverso',
  'interstellar',
  'interestelar',
  'whiplash',
  'grand budapest',
  'truman show',
  'show de truman',
  '10 coisas que eu odeio',
  'como perder um homem',
  'diario de uma paixao',
  'orgulho e preconceito',
  'mamma mia',
  'high school musical',
];

const KNOWN_HORROR_KEYWORDS = [
  'frailty',
  'mao do diabo',
  'dark and the wicked',
  'saccharine',
  'frewaka',
  'jacob',
  'alucinacoes do passado',
  'heresy',
  'witte wieven',
  'the fly',
  'a mosca',
  'exorcist',
  'hereditario',
  'hereditary',
  'the witch',
  'vvitch',
  'a bruxa',
  'fale comigo',
  'talk to me',
  'iluminado',
  'shining',
  'invocacao do mal',
  'conjuring',
  'o chamado',
  'the ring',
  'autopsia',
  'jane doe',
  'sorria',
  'smile',
  'midsommar',
  'substancia',
  'substance',
  'sinister',
  'a entidade',
  'it follows',
  'corrente do mal',
  'babadook',
  'terrifier',
  'scream',
  'panico',
  'insidious',
  'sobrenatural',
  'nosferatu',
  'longlegs',
  'alien',
  'halloween',
  'sexta-feira 13',
  'friday the 13th',
  'jogos mortais',
  'saw',
  'it a coisa',
  'evil dead',
  'a morte do demonio',
  'actividad paranormal',
  'atividade paranormal',
  'cemiterio maldito',
  'pet sematary',
  'corra',
  'get out',
  'us',
  'nope',
  'um lugar silencioso',
  'quiet place',
  'blair witch',
];

export function isHorrorMovie(movie: {
  title?: string;
  originalTitle?: string;
  subgenre?: string;
  synopsis?: string;
  tags?: string[];
  isHorror?: boolean;
  isSecret?: boolean;
}): boolean {
  if (movie.isSecret) return false;
  if (typeof movie.isHorror === 'boolean') return movie.isHorror;

  const combinedTitle = `${movie.title || ''} ${movie.originalTitle || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (KNOWN_NON_HORROR_KEYWORDS.some((k) => combinedTitle.includes(k))) {
    return false;
  }
  if (KNOWN_HORROR_KEYWORDS.some((k) => combinedTitle.includes(k))) {
    return true;
  }

  const sub = (movie.subgenre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    sub.includes('animacao') ||
    sub.includes('comedia') ||
    sub.includes('musical') ||
    sub.includes('romance') ||
    sub.includes('aventura') ||
    sub.includes('familia')
  ) {
    return false;
  }

  if (
    sub.includes('terror') ||
    sub.includes('horror') ||
    sub.includes('slasher') ||
    sub.includes('sobrenatural') ||
    sub.includes('folk') ||
    sub.includes('ocult') ||
    sub.includes('paranormal')
  ) {
    return true;
  }

  const full = `${combinedTitle} ${sub} ${(movie.synopsis || '').toLowerCase()}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const horrorWords = [
    'terror',
    'horror',
    'assombra',
    'demon',
    'exorcis',
    'maldic',
    'entidade',
    'pesadelo',
    'slasher',
    'macabr',
    'ocult',
    'possess',
    'sobrenatural',
  ];
  return horrorWords.some((w) => full.includes(w));
}

/**
 * Base de Calibração Empírica inspirada no estudo real "Science of Scare Project"
 * (monitoramento real de BPM cardíaco e variabilidade de frequência cardíaca em espectadores)
 */
const SCIENCE_OF_SCARE_BENCHMARKS: Array<{
  matches: string[];
  bpm: number;
  fearLevel: 1 | 2 | 3 | 4 | 5;
  breakdown: HorrorAIBreakdown;
  verdictNote: string;
}> = [
  {
    matches: ['a entidade', 'sinister'],
    bpm: 151,
    fearLevel: 5,
    breakdown: { psychological: 88, supernatural: 95, tension: 96, visceral: 78 },
    verdictNote:
      'Classificado pelo Science of Scare como um dos filmes com maior pico cardíaco já medido, combinando fitas Super 8 perturbadoras e tensão constante.',
  },
  {
    matches: ['hereditario', 'hereditary'],
    bpm: 146,
    fearLevel: 5,
    breakdown: { psychological: 98, supernatural: 92, tension: 89, visceral: 82 },
    verdictNote:
      'Pavor psicológico extremo e ocultismo familiar. Provoca angústia prolongada e cenas que permanecem na memória por dias.',
  },
  {
    matches: ['invocacao do mal', 'the conjuring'],
    bpm: 144,
    fearLevel: 5,
    breakdown: { psychological: 82, supernatural: 96, tension: 95, visceral: 60 },
    verdictNote:
      'Altíssima densidade de tensão claustrofóbica, fenômenos paranormais clássicos e picos de susto (jump scares) cirurgicamente construídos.',
  },
  {
    matches: ['sorria', 'smile'],
    bpm: 144,
    fearLevel: 5,
    breakdown: { psychological: 92, supernatural: 88, tension: 94, visceral: 76 },
    verdictNote:
      'Maldição psicológica implacável com sustos repentinos de alta intensidade e sensação constante de perseguição.',
  },
  {
    matches: ['fale comigo', 'talk to me'],
    bpm: 142,
    fearLevel: 5,
    breakdown: { psychological: 90, supernatural: 94, tension: 91, visceral: 85 },
    verdictNote:
      'Possessão visceral e moderna com cenas de impacto físico e psicológico muito intensas.',
  },
  {
    matches: ['sobresalto', 'insidious', 'sobrenatural'],
    bpm: 145,
    fearLevel: 5,
    breakdown: { psychological: 80, supernatural: 96, tension: 97, visceral: 55 },
    verdictNote:
      'Um dos recordistas mundiais em picos de susto (jump scares) e atmosfera astral sufocante.',
  },
  {
    matches: ['a autopsia', 'autopsy of jane doe'],
    bpm: 138,
    fearLevel: 5,
    breakdown: { psychological: 86, supernatural: 92, tension: 93, visceral: 80 },
    verdictNote:
      'Terror claustrofóbico em ambiente fechado onde a tensão cresce a cada descoberta anatômica.',
  },
  {
    matches: ['o exorcista', 'the exorcist'],
    bpm: 136,
    fearLevel: 5,
    breakdown: { psychological: 91, supernatural: 98, tension: 88, visceral: 84 },
    verdictNote:
      'Referência máxima do horror religioso e possessão demoníaca, com impacto psicológico profundo.',
  },
  {
    matches: ['terrifier'],
    bpm: 140,
    fearLevel: 5,
    breakdown: { psychological: 72, supernatural: 68, tension: 88, visceral: 99 },
    verdictNote:
      'Nível máximo de horror visceral/gore e presença ameaçadora constante.',
  },
  {
    matches: ['rec', 'quarentena'],
    bpm: 143,
    fearLevel: 5,
    breakdown: { psychological: 82, supernatural: 85, tension: 98, visceral: 88 },
    verdictNote:
      'Found footage frenético em primeira pessoa; os 20 minutos finais elevam os batimentos ao limite.',
  },
  {
    matches: ['a bruxa', 'the witch', 'vvitch'],
    bpm: 122,
    fearLevel: 4,
    breakdown: { psychological: 93, supernatural: 88, tension: 80, visceral: 65 },
    verdictNote:
      'Folk horror denso e desconfortável; troca o susto fácil por uma atmosfera opressiva de paranoia e ocultismo.',
  },
  {
    matches: ['o chamado', 'the ring', 'ringu'],
    bpm: 128,
    fearLevel: 4,
    breakdown: { psychological: 86, supernatural: 91, tension: 87, visceral: 58 },
    verdictNote:
      'Mistério sobrenatural icônico com imagens amaldiçoadas e clímax de gelar o sangue.',
  },
  {
    matches: ['o iluminado', 'the shining'],
    bpm: 120,
    fearLevel: 4,
    breakdown: { psychological: 97, supernatural: 84, tension: 85, visceral: 64 },
    verdictNote:
      'Obra-prima de terror psicológico e isolamento; a tensão cresce lentamente pelos corredores do hotel.',
  },
  {
    matches: ['midsommar'],
    bpm: 121,
    fearLevel: 4,
    breakdown: { psychological: 95, supernatural: 62, tension: 82, visceral: 84 },
    verdictNote:
      'Perturbador e hipnótico; gera profundo desconforto psicológico mesmo sob a luz do sol.',
  },
  {
    matches: ['longlegs'],
    bpm: 130,
    fearLevel: 4,
    breakdown: { psychological: 92, supernatural: 85, tension: 88, visceral: 74 },
    verdictNote:
      'Atmosfera ocultista macabra e sensação constante de que há algo escondido no fundo de cada cena.',
  },
  {
    matches: ['o telefone preto', 'the black phone'],
    bpm: 126,
    fearLevel: 4,
    breakdown: { psychological: 85, supernatural: 80, tension: 89, visceral: 70 },
    verdictNote:
      'Suspense sobrenatural de alta tensão combinando sequestro claustrofóbico e vozes do além.',
  },
  {
    matches: ['corrente do mal', 'it follows'],
    bpm: 132,
    fearLevel: 4,
    breakdown: { psychological: 90, supernatural: 86, tension: 93, visceral: 62 },
    verdictNote:
      'Paranoia constante: o espectador fica procurando a entidade no fundo da tela durante o filme inteiro.',
  },
  {
    matches: ['babadook'],
    bpm: 130,
    fearLevel: 4,
    breakdown: { psychological: 94, supernatural: 84, tension: 88, visceral: 52 },
    verdictNote:
      'Terror psicológico intenso sobre luto e uma presença sombria que invade a casa à noite.',
  },
  {
    matches: ['a bruxa de blair', 'blair witch'],
    bpm: 133,
    fearLevel: 4,
    breakdown: { psychological: 91, supernatural: 82, tension: 92, visceral: 48 },
    verdictNote:
      'Imersão crua de found footage; transmite a sensação real de estar perdido numa floresta amaldiçoada.',
  },
  {
    matches: ['it a coisa', 'it chapter', 'it (2017)'],
    bpm: 127,
    fearLevel: 4,
    breakdown: { psychological: 78, supernatural: 88, tension: 86, visceral: 75 },
    verdictNote:
      'Combina sustos diretos e manifestações sobrenaturais assustadoras com ritmo de aventura sombria.',
  },
  {
    matches: ['corra', 'get out'],
    bpm: 114,
    fearLevel: 3,
    breakdown: { psychological: 92, supernatural: 45, tension: 84, visceral: 62 },
    verdictNote:
      'Mais focado em suspense psicológico e paranoia social do que em sustos sobrenaturais pesados.',
  },
  {
    matches: ['panico', 'scream'],
    bpm: 116,
    fearLevel: 3,
    breakdown: { psychological: 72, supernatural: 20, tension: 85, visceral: 78 },
    verdictNote:
      'Slasher eletrizante e divertido, cheio de mistério e perseguições tensas, sem terror sobrenatural pesado.',
  },
  {
    matches: ['um lugar silencioso', 'a quiet place'],
    bpm: 124,
    fearLevel: 3,
    breakdown: { psychological: 80, supernatural: 65, tension: 94, visceral: 64 },
    verdictNote:
      'Altíssima tensão baseada no silêncio absoluto e sobrevivência, moderado no horror psicológico.',
  },
];

// Léxico Semântico Bilíngue (PT + EN) para pontuar qualquer filme desconhecido
const LEXICON = {
  psychological: [
    'psicolog', 'psychological', 'loucura', 'madness', 'insan', 'paranoia',
    'trauma', 'luto', 'grief', 'isolad', 'isolated', 'mente', 'mind',
    'alucinac', 'hallucin', 'pesadelo', 'nightmare', 'delirio', 'culpa',
    'obsess', 'medo', 'pavor', 'dread', 'perturbador', 'disturbing', 'suicid',
  ],
  supernatural: [
    'demon', 'possess', 'espirit', 'spirit', 'fantasma', 'ghost', 'assombra',
    'haunt', 'maldic', 'curse', 'entidade', 'entity', 'ocult', 'occult',
    'ritual', 'brux', 'witch', 'exorcis', 'inferno', 'hell', 'paranormal',
    'sobrenatural', 'supernatural', 'seita', 'cult', 'invocac', 'diabo', 'devil',
    'macabr', 'necrot', 'morgue', 'vulto', 'sombra', 'profec', 'omen',
  ],
  tension: [
    'escurid', 'darkness', 'noite', 'night', 'porao', 'basement', 'sotao',
    'attic', 'trancad', 'locked', 'persegu', 'stalk', 'susto', 'scare',
    'silencio', 'silence', 'camera', 'gravac', 'footage', 'fita', 'tape',
    'telefone', 'phone', 'floresta', 'forest', 'woods', 'corredor', 'hallway',
    'sobreviv', 'survive', 'fuga', 'escape', 'madrugada', '3:00', '3:33',
  ],
  visceral: [
    'sangue', 'blood', 'morte', 'death', 'dead', 'cadaver', 'corpse', 'body',
    'autopsia', 'autopsy', 'assassin', 'killer', 'murder', 'slasher', 'massacre',
    'tortur', 'mutil', 'carne', 'flesh', 'brutal', 'violenc', 'gore', 'faca',
    ' serial ', 'visceral', 'terrifier', 'esquartej',
  ],
  mildIndicators: [
    'comedia', 'comedy', 'parodia', 'familia', 'aventura', 'infantil',
    'animacao', 'fantasia', 'romance', 'musical', 'tim burton', 'scary movie',
  ],
};

const ACCLAIMED_HORROR_DIRECTORS = [
  'ari aster',
  'james wan',
  'robert eggers',
  'scott derrickson',
  'mike flanagan',
  'david robert mitchell',
  'ti west',
  'damien leone',
  'danny philippou',
  'michael philippou',
  'oz perkins',
  'osgood perkins',
  'parker finn',
  'sam raimi',
  'wes craven',
  'john carpenter',
  'stanley kubrick',
  'guillermo del toro',
  'andre ovredal',
  'jaume balaguero',
  'paco plaza',
  'takashi shimizu',
  'hideo nakata',
  'kiyoshi kurosawa',
  'jordan peele',
  'fede alvarez',
  'zach cregger',
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function countMatches(text: string, words: string[]): number {
  let count = 0;
  for (const w of words) {
    if (text.includes(w)) count++;
  }
  return count;
}

/**
 * Motor de IA Embutido para o Terrômetro:
 * Analisa título, sinopse, diretor, gênero e classificação etária para calcular
 * automaticamente o Nível de Medo (1 a 5), BPM estimado, decomposição em 4 eixos
 * e um Laudo Descritivo em português.
 */
export function analyzeMovieHorrorAI(params: {
  title: string;
  originalTitle?: string;
  synopsis?: string;
  genre?: string;
  director?: string;
  advisoryRating?: string;
}): HorrorAIResult {
  const fullText = normalize(
    `${params.title} ${params.originalTitle || ''} ${params.synopsis || ''} ${
      params.genre || ''
    } ${params.director || ''}`
  );
  const titleNorm = normalize(`${params.title} ${params.originalTitle || ''}`);

  // 1. Check if movie matches an empirical Science of Scare benchmark
  const benchmark = SCIENCE_OF_SCARE_BENCHMARKS.find((b) =>
    b.matches.some((m) => titleNorm.includes(m))
  );

  // 2. Semantic NLP Scoring across the 4 axes
  const psychHits = countMatches(fullText, LEXICON.psychological);
  const superHits = countMatches(fullText, LEXICON.supernatural);
  const tensionHits = countMatches(fullText, LEXICON.tension);
  const visceralHits = countMatches(fullText, LEXICON.visceral);
  const mildHits = countMatches(fullText, LEXICON.mildIndicators);

  const hasHorrorDirector = ACCLAIMED_HORROR_DIRECTORS.some((d) =>
    fullText.includes(d)
  );

  // Check if this is a Non-Horror Cinema movie!
  const detectedHorror =
    Boolean(benchmark) ||
    hasHorrorDirector ||
    KNOWN_HORROR_KEYWORDS.some((k) => titleNorm.includes(k)) ||
    (/\b(horror|terror|slasher|thriller sobrenatural)\b/i.test(params.genre || '') &&
      !KNOWN_NON_HORROR_KEYWORDS.some((k) => titleNorm.includes(k))) ||
    (superHits + visceralHits + psychHits >= 2 &&
      mildHits === 0 &&
      !KNOWN_NON_HORROR_KEYWORDS.some((k) => titleNorm.includes(k)));

  if (!detectedHorror) {
    // CINÊMETRO AI MODE (Non-Horror Movies: Animation, Comedy, Musical, Sci-Fi, Romance, Drama, Adventure)
    const cineTags: HorrorTag[] = [];
    if (/animac|animation|raposo|fox|megamind|megamente|totoro|ghibli|robo selvagem|wild robot|minion|pixar|dreamworks/i.test(fullText)) {
      cineTags.push('Animação');
    }
    if (/comedia|comedy|funny|engracad|raposo|megamind|megamente|pitch perfect|escolha perfeita|minion/i.test(fullText)) {
      cineTags.push('Comédia');
    }
    if (/musical|musica|cant|banda|surf|teen beach|pitch perfect|escolha perfeita|a capella|barden/i.test(fullText)) {
      cineTags.push('Musical');
    }
    if (/ficcao|sci-fi|multivers|everything everywhere|tudo em todo|robo|robot|espac|futur/i.test(fullText)) {
      cineTags.push('Ficção Científica');
    }
    if (/aventura|adventure|jornada|ilha|floresta|viagem/i.test(fullText)) {
      cineTags.push('Aventura');
    }
    if (/romanc|amor|paixao|casal|love/i.test(fullText)) {
      cineTags.push('Romance');
    }
    if (/fantasia|magia|totoro|espiritos da floresta/i.test(fullText)) {
      cineTags.push('Fantasia');
    }
    if (/drama|familia|emocion/i.test(fullText)) {
      cineTags.push('Drama');
    }
    if (cineTags.length === 0) {
      cineTags.push('Cult', 'Aventura', 'Comédia');
    }
    const uniqueCineTags = Array.from(new Set(cineTags)).slice(0, 3) as HorrorTag[];
    const cineSubgenre = `${uniqueCineTags[0]}${uniqueCineTags[1] ? ` & ${uniqueCineTags[1]}` : ''}`;

    const cineBreakdown: HorrorAIBreakdown = {
      psychological: 92, // Emoção & Coração
      supernatural: 90,  // Carisma & Humor
      tension: 94,       // Direção & Visual
      visceral: 89,      // Ritmo & Trilha Sonora
    };

    return {
      fearLevel: 5,
      bpm: 96,
      aiVerdict: `Cinêmetro IA (94% de Encanto • Sessão Pipoca VIP): Obra-prima de ${cineSubgenre.toLowerCase()} cheia de carisma, visual marcante e trilha sonora perfeita para assistir juntinhos no Grand Cine Olhinhos!`,
      aiBreakdown: cineBreakdown,
      tags: uniqueCineTags,
      subgenre: cineSubgenre,
      curseWhisper: 'PREPARE A PIPOCA: SESSÃO ESPECIAL NO GRAND CINE OLHINHOS!',
      isHorror: false,
    };
  }

  const isRatedMature =
    /18|16|r\b|nc-17|tv-ma|unrated/i.test(params.advisoryRating || '') ||
    visceralHits >= 2 ||
    superHits >= 2;

  const breakdown: HorrorAIBreakdown = benchmark
    ? benchmark.breakdown
    : {
        psychological: Math.min(
          98,
          Math.max(35, 52 + psychHits * 11 + (hasHorrorDirector ? 10 : 0) - mildHits * 15)
        ),
        supernatural: Math.min(
          98,
          Math.max(20, 40 + superHits * 13 - mildHits * 12)
        ),
        tension: Math.min(
          98,
          Math.max(40, 56 + tensionHits * 10 + (isRatedMature ? 8 : 0) - mildHits * 14)
        ),
        visceral: Math.min(
          98,
          Math.max(25, 38 + visceralHits * 14 + (isRatedMature ? 10 : 0) - mildHits * 18)
        ),
      };

  // 3. Calculate Overall Fear Score (0..100) -> Fear Level (1..5) & BPM (80..154)
  const topTwoAvg =
    [
      breakdown.psychological,
      breakdown.supernatural,
      breakdown.tension,
      breakdown.visceral,
    ]
      .sort((a, b) => b - a)
      .slice(0, 2)
      .reduce((acc, v) => acc + v, 0) / 2;

  const overallAvg =
    (breakdown.psychological +
      breakdown.supernatural +
      breakdown.tension +
      breakdown.visceral) /
    4;

  const compositeScore = Math.round(topTwoAvg * 0.65 + overallAvg * 0.35);

  let fearLevel: 1 | 2 | 3 | 4 | 5;
  let bpm: number;

  if (benchmark) {
    fearLevel = benchmark.fearLevel;
    bpm = benchmark.bpm;
  } else if (mildHits >= 2 && compositeScore < 65) {
    fearLevel = 2;
    bpm = 94;
  } else if (compositeScore >= 84) {
    fearLevel = 5;
    bpm = Math.min(152, 134 + Math.round((compositeScore - 84) * 1.1));
  } else if (compositeScore >= 71) {
    fearLevel = 4;
    bpm = 118 + Math.round((compositeScore - 71) * 1.1);
  } else if (compositeScore >= 58) {
    fearLevel = 3;
    bpm = 104 + Math.round((compositeScore - 58) * 1.0);
  } else if (compositeScore >= 44) {
    fearLevel = 2;
    bpm = 92 + Math.round((compositeScore - 44) * 0.8);
  } else {
    fearLevel = 1;
    bpm = 82;
  }

  // 4. Infer Tags & Subgenre from the strongest AI dimensions
  const tags: HorrorTag[] = [];
  if (breakdown.supernatural >= 68) tags.push('Sobrenatural');
  if (breakdown.psychological >= 70) tags.push('Psicológico');
  if (fullText.includes('demon') || fullText.includes('exorcis') || fullText.includes('cult') || fullText.includes('brux')) {
    tags.push('Religioso');
  }
  if (fullText.includes('floresta') || fullText.includes('folclor') || fullText.includes('aldeia') || fullText.includes('pag')) {
    tags.push('Folk Horror');
  }
  if (fullText.includes('camera') || fullText.includes('gravac') || fullText.includes('fita') || fullText.includes('documentario')) {
    tags.push('Found Footage');
  }
  if (breakdown.visceral >= 78 || fullText.includes('slasher') || fullText.includes('assassino')) {
    tags.push('Slasher');
  }
  if (breakdown.tension >= 75 && breakdown.supernatural >= 65) {
    tags.push('Paranormal');
  }
  if (tags.length < 2) {
    tags.push('Mistério', 'Sobrenatural');
  }
  const uniqueTags = Array.from(new Set(tags)).slice(0, 3) as HorrorTag[];

  // Dominant axis label for the AI Verdict
  const axes = [
    { name: 'terror psicológico profundo', val: breakdown.psychological },
    { name: 'assombração sobrenatural', val: breakdown.supernatural },
    { name: 'alta tensão e sustos iminentes', val: breakdown.tension },
    { name: 'ameaça visceral e impacto físico', val: breakdown.visceral },
  ].sort((a, b) => b.val - a.val);

  const aiVerdict = benchmark
    ? `Análise IA (${compositeScore}% de Intensidade • ${bpm} BPM): ${benchmark.verdictNote}`
    : `Análise IA (${compositeScore}% de Intensidade • Pico de ${bpm} BPM): Filme marcado por ${axes[0].name} (${axes[0].val}%) e ${axes[1].name} (${axes[1].val}%). Classificado como Nível ${fearLevel}/5 no Terrômetro.`;

  const subgenre = `Terror ${uniqueTags[0]}${
    uniqueTags[1] ? ` & ${uniqueTags[1]}` : ''
  }`;

  const whispersByLevel: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: 'AS SOMBRAS PARECEM CALMAS... POR ENQUANTO.',
    2: 'VOCÊ OUVIU ESSE BARULHO NO CORREDOR?',
    3: 'MANTENHA O LAMPIÃO ACESO E NÃO OLHE PARA TRÁS.',
    4: 'OS OLHOS DO QUADRO ESTÃO SEGUINDO VOCÊS DOIS...',
    5: 'ALERTA MÁXIMO NO TERRÔMETRO: SEGURE A MÃO DELA COM FORÇA!',
  };

  return {
    fearLevel,
    bpm,
    aiVerdict,
    aiBreakdown: breakdown,
    tags: uniqueTags,
    subgenre,
    curseWhisper: whispersByLevel[fearLevel],
    isHorror: true,
  };
}
