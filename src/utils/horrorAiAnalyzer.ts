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
  'you can see everything',
  'everything you can see',
  'nathan fielder',
  'lance oppenheim',
];

const KNOWN_HORROR_KEYWORDS = [
  'frailty',
  'mao do diabo',
  'dark and the wicked',
  'saccharine',
  'frewaka',
  'jacob\'s ladder',
  'jacobs ladder',
  'alucinacoes do passado',
  'witte wieven',
  'the fly',
  'a mosca',
  'exorcist',
  'o exorcista',
  'hereditario',
  'hereditary',
  'the witch',
  'vvitch',
  'a bruxa',
  'fale comigo',
  'talk to me',
  'o iluminado',
  'the shining',
  'invocacao do mal',
  'conjuring',
  'o chamado',
  'the ring',
  'autopsia de jane doe',
  'autopsy of jane doe',
  'midsommar',
  'a substancia',
  'the substance',
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
  'halloween',
  'sexta-feira 13',
  'friday the 13th',
  'jogos mortais',
  'it a coisa',
  'evil dead',
  'a morte do demonio',
  'actividad paranormal',
  'atividade paranormal',
  'cemiterio maldito',
  'pet sematary',
  'get out',
  'um lugar silencioso',
  'quiet place',
  'blair witch',
  'fright night',
  'a hora do espanto',
];

const STRICT_HORROR_PLOT_TERMS = [
  'assombracao',
  'assombrada',
  'assombrado',
  'possessao',
  'possuido',
  'possuida',
  'exorcismo',
  'exorcista',
  'demonio',
  'demoniaca',
  'demoniaco',
  'sobrenatural',
  'paranormal',
  'slasher',
  'macabro',
  'macabra',
  'entidade maligna',
  'maldicao mortal',
  'bruxaria',
  'mortos-vivos',
  'zumbi',
  'vampiro',
  'lobisomem',
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

  const combinedTitle = `${movie.title || ''} ${movie.originalTitle || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (KNOWN_NON_HORROR_KEYWORDS.some((k) => combinedTitle.includes(k))) {
    return false;
  }
  if (
    KNOWN_HORROR_KEYWORDS.some((k) => combinedTitle.includes(k)) ||
    combinedTitle === 'us' ||
    combinedTitle === 'nos' ||
    combinedTitle === 'saw' ||
    combinedTitle === 'sorria' ||
    combinedTitle === 'smile' ||
    combinedTitle === 'corra' ||
    combinedTitle === 'heresy'
  ) {
    return true;
  }

  if (typeof movie.isHorror === 'boolean') return movie.isHorror;

  const plotNorm = (movie.synopsis || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const plotHorrorHits = STRICT_HORROR_PLOT_TERMS.filter((w) =>
    plotNorm.includes(w)
  ).length;
  if (plotHorrorHits >= 1) {
    return true;
  }

  const sub = (movie.subgenre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Ignore auto-generated fallback "terror religioso & misterio" if the plot/title had 0 horror terms!
  if (
    (sub.includes('slasher') ||
      sub.includes('folk horror') ||
      sub.includes('found footage') ||
      sub.includes('paranormal')) &&
    plotHorrorHits >= 1
  ) {
    return true;
  }

  return false;
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

// Léxico Semântico Bilíngue (PT + EN) para pontuar qualquer filme de terror
const LEXICON = {
  psychological: [
    'psicolog', 'psychological', 'loucura', 'madness', 'insan', 'paranoia',
    'trauma', 'luto', 'grief', 'isolamento', 'isolated',
    'alucinac', 'hallucin', 'pesadelo', 'nightmare', 'delirio',
    'obsess', 'pavor', 'dread', 'perturbador', 'disturbing',
  ],
  supernatural: [
    'demonio', 'demoniac', 'possessao', 'possuid', 'espiritos', 'fantasma', 'ghost', 'assombra',
    'haunt', 'maldicao', 'amaldiçoad', 'curse', 'entidade maligna', 'ocultismo', 'occult',
    'ritual macabro', 'bruxa', 'witch', 'exorcis', 'inferno', 'paranormal',
    'sobrenatural', 'supernatural', 'seita', 'invocac', 'diabo',
    'macabr', 'necrot', 'morgue', 'vulto', 'profecia', 'omen',
  ],
  tension: [
    'escuridao', 'darkness', 'porao', 'basement', 'sotao',
    'attic', 'trancad', 'perseguic', 'stalk', 'susto', 'jump scare',
    'silencio mortal', 'found footage', 'fita amaldicoada',
    'floresta sombria', 'corredor escuro',
    'sobrevivencia', 'madrugada', '3:00', '3:33',
  ],
  visceral: [
    'sangue', 'blood', 'cadaver', 'corpse',
    'autopsia', 'autopsy', 'serial killer', 'slasher', 'massacre',
    'tortur', 'mutil', 'brutal', 'gore',
    'visceral', 'terrifier', 'esquartej',
  ],
  mildIndicators: [
    'comedia', 'comedy', 'parodia', 'familia', 'aventura', 'infantil',
    'animacao', 'fantasia', 'romance', 'musical', 'documentario', 'documentary',
    'ficcao cientifica', 'sci-fi', 'tim burton', 'scary movie',
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
  'wes craven',
  'john carpenter',
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

  const strictHorrorPlotHits = STRICT_HORROR_PLOT_TERMS.filter((w) =>
    fullText.includes(w)
  ).length;

  const isExplicitNonHorror = KNOWN_NON_HORROR_KEYWORDS.some((k) =>
    fullText.includes(k)
  );

  // Strictly classify as Horror ONLY when there is unmistakable horror evidence!
  const detectedHorror =
    !isExplicitNonHorror &&
    (Boolean(benchmark) ||
      hasHorrorDirector ||
      KNOWN_HORROR_KEYWORDS.some((k) => titleNorm.includes(k)) ||
      titleNorm === 'us' ||
      titleNorm === 'saw' ||
      titleNorm === 'sorria' ||
      titleNorm === 'smile' ||
      titleNorm === 'corra' ||
      titleNorm === 'heresy' ||
      /\b(horror|terror|slasher)\b/i.test(params.genre || '') ||
      (strictHorrorPlotHits >= 2 && mildHits === 0));

  if (!detectedHorror) {
    // CINÊMETRO AI MODE (Non-Horror Movies: Documentary, Sci-Fi, Drama, Animation, Comedy, Musical, Romance, Adventure)
    const cineTags: HorrorTag[] = [];
    if (/animac|animation|raposo|fox|megamind|megamente|totoro|ghibli|robo selvagem|wild robot|minion|pixar|dreamworks/i.test(fullText)) {
      cineTags.push('Animação');
    }
    if (/comedia|comedy|funny|engracad|humor|satir|raposo|megamind|megamente|pitch perfect|escolha perfeita|minion|nathan fielder/i.test(fullText)) {
      cineTags.push('Comédia');
    }
    if (/musical|musica|cant|banda|surf|teen beach|pitch perfect|escolha perfeita|a capella|barden/i.test(fullText)) {
      cineTags.push('Musical');
    }
    if (/ficcao|sci-fi|multivers|everything everywhere|tudo em todo|robo|robot|espac|futur|tecnolog/i.test(fullText)) {
      cineTags.push('Ficção Científica');
    }
    if (/documentario|documentary|vida real|bastidores|camera|you can see everything|nathan fielder|lance oppenheim|a24/i.test(fullText)) {
      cineTags.push('Cult');
    }
    if (/misterio|mystery|conspirac|segred|investigac|suspense|thriller/i.test(fullText)) {
      cineTags.push('Mistério');
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
    if (/drama|familia|emocion|vida|human/i.test(fullText)) {
      cineTags.push('Drama');
    }
    if (cineTags.length === 0) {
      cineTags.push('Cult', 'Drama', 'Aventura');
    }
    const uniqueCineTags = Array.from(new Set(cineTags)).slice(0, 3) as HorrorTag[];
    const cineSubgenre = `${uniqueCineTags[0]}${uniqueCineTags[1] ? ` & ${uniqueCineTags[1]}` : ''}`;

    const seed = titleNorm.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const cineBreakdown: HorrorAIBreakdown = {
      psychological: 86 + (seed % 12),        // Emoção & Coração
      supernatural: 84 + ((seed * 3) % 14),   // Carisma & Humor
      tension: 88 + ((seed * 7) % 11),        // Direção & Visual
      visceral: 85 + ((seed * 5) % 13),       // Ritmo & Trilha Sonora
    };
    const avgCharm = Math.round(
      (cineBreakdown.psychological +
        cineBreakdown.supernatural +
        cineBreakdown.tension +
        cineBreakdown.visceral) /
        4
    );

    return {
      fearLevel: avgCharm >= 90 ? 5 : 4,
      bpm: 96,
      aiVerdict: `Cinêmetro IA (${avgCharm}% de Sintonia • Sessão VIP): Produção envolvente de ${cineSubgenre.toLowerCase()} com direção criativa, ótima atmosfera e roteiro marcante para assistir juntinhos no Grand Cine Olhinhos!`,
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
  if (fullText.includes('demon') || fullText.includes('exorcis') || fullText.includes('seita') || fullText.includes('ocultismo') || fullText.includes('brux')) {
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
