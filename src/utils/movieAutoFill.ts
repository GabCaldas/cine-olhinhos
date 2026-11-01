import { HorrorAIBreakdown, HorrorTag, MovieTemplate, StreamingOffer } from '../types/horror';
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
  streamingPlatforms: StreamingOffer[];
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
  streamingPlatforms: StreamingOffer[];
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
    streamingPlatforms: [
      { platform: 'Prime Video (Lionsgate+ / MGM)', type: 'subscription', priceInfo: 'Incluso no canal / assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel ou Compra Digital' },
      { platform: 'Amazon Prime Store', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 11,90)' },
    ],
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
    streamingPlatforms: [
      { platform: 'Prime Video (Adrenalina Pura)', type: 'subscription', priceInfo: 'Incluso na assinatura do canal' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 14,90)' },
      { platform: 'YouTube Filmes / Google TV', type: 'rent', priceInfo: 'Aluguel Digital' },
    ],
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
    streamingPlatforms: [
      { platform: 'Apple TV / Prime Video (VOD)', type: 'rent', priceInfo: 'Lançamento de Festival (Aluguel Digital)' },
      { platform: 'MUBI / Shudder', type: 'subscription', priceInfo: 'Circuito de Festivais / Catálogo Cult' },
    ],
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
    streamingPlatforms: [
      { platform: 'Shudder / AMC+', type: 'subscription', priceInfo: 'Incluso na assinatura (Catálogo Internacional)' },
      { platform: 'Apple TV / Prime Video', type: 'rent', priceInfo: 'Aluguel Digital (VOD)' },
    ],
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
    streamingPlatforms: [
      { platform: 'Prime Video (Filmelier+ / MUBI)', type: 'subscription', priceInfo: 'Incluso na assinatura do canal' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 11,90)' },
      { platform: 'Amazon Prime Store', type: 'rent', priceInfo: 'Aluguel ou Compra Digital' },
    ],
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
    streamingPlatforms: [
      { platform: 'Apple TV / Prime Video (VOD)', type: 'rent', priceInfo: 'Aluguel Digital (Lançamento Folk Horror)' },
      { platform: 'Shudder / Fantasia Cult', type: 'subscription', priceInfo: 'Catálogo Internacional' },
    ],
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
    streamingPlatforms: [
      { platform: 'Disney+ (aba Star)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 11,90)' },
      { platform: 'Prime Video Store', type: 'rent', priceInfo: 'Aluguel Digital' },
    ],
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
    streamingPlatforms: [
      { platform: 'Max (HBO Max)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 7,90)' },
      { platform: 'Prime Video Store', type: 'rent', priceInfo: 'Aluguel ou Compra Digital' },
    ],
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
    streamingPlatforms: [
      { platform: 'Max (HBO Max)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV / YouTube', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 11,90)' },
    ],
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
    streamingPlatforms: [
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Globoplay (Telecine)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 11,90)' },
    ],
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
    streamingPlatforms: [
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Globoplay (Telecine)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 14,90)' },
    ],
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
    streamingPlatforms: [
      { platform: 'Max (HBO Max)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 7,90)' },
      { platform: 'Prime Video Store', type: 'rent', priceInfo: 'Aluguel Digital' },
    ],
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
    streamingPlatforms: [
      { platform: 'Max (HBO Max)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 7,90)' },
    ],
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
    streamingPlatforms: [
      { platform: 'Paramount+', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 11,90)' },
    ],
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
    streamingPlatforms: [
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Pluto TV / Runtime', type: 'subscription', priceInfo: 'Gratuito com anúncios' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital' },
    ],
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
    streamingPlatforms: [
      { platform: 'Netflix', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Paramount+', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV / Prime Video', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 11,90)' },
    ],
  },
  {
    keywords: ['midsommar'],
    title: 'Midsommar: O Mal Não Espera a Noite',
    originalTitle: 'Midsommar',
    year: 2019,
    duration: '2h 28min',
    imdbRating: '7.1',
    director: 'Ari Aster',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMzQxNzQzOTQwM15BMl5BanBnXkFtZTgwMDQ2NTcwODM@._V1_SX600.jpg',
    synopsis:
      'Abalada por uma tragédia familiar devastadora, Dani viaja com o namorado e seus amigos para um festival de verão que acontece apenas a cada 90 anos em uma vila remota da Suécia. O que começa como um retiro ensolarado se transforma em um ritual pagão perturbador.',
    streamingPlatforms: [
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Max (HBO Max)', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital' },
    ],
  },
  {
    keywords: ['the substance', 'a substancia'],
    title: 'A Substância',
    originalTitle: 'The Substance',
    year: 2024,
    duration: '2h 21min',
    imdbRating: '7.3',
    director: 'Coralie Fargeat',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BZDQ1NGE5MGMtYzdlZC00ODExLWJlMDMtNWU4NjA5YzYwMDEwXkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Demitida de seu programa de aeróbica na televisão por causa da idade, a estrela Elisabeth Sparkle recorre a uma droga clandestina de replicação celular que cria uma versão mais jovem e perfeita de si mesma — desde que as duas dividam exatamente uma semana cada no mesmo corpo.',
    streamingPlatforms: [
      { platform: 'MUBI', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Prime Video (Canal MUBI)', type: 'subscription', priceInfo: 'Incluso no canal MUBI' },
      { platform: 'Apple TV / Prime Video', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 19,90)' },
    ],
  },
  {
    keywords: ['sinister', 'a entidade'],
    title: 'A Entidade',
    originalTitle: 'Sinister',
    year: 2012,
    duration: '1h 50min',
    imdbRating: '6.8',
    director: 'Scott Derrickson',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMjI5MTg1Njg0Ml5BMl5BanBnXkFtZTcwNzg2Mjc4Nw@@._V1_SX600.jpg',
    synopsis:
      'Em busca de um novo livro de sucesso, um escritor de crimes reais se muda com a família para a casa onde os antigos moradores foram brutalmente assassinados. No sótão, ele encontra uma caixa de fitas Super 8 caseiras que revelam uma entidade ancestral devoradora de almas.',
    streamingPlatforms: [
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 9,90)' },
    ],
  },
  {
    keywords: ['it follows', 'corrente do mal'],
    title: 'Corrente do Mal',
    originalTitle: 'It Follows',
    year: 2014,
    duration: '1h 40min',
    imdbRating: '6.8',
    director: 'David Robert Mitchell',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMmU0MjBlYzYtZWY0MC00MjliLWI3ZmUtMzhlZDVjMWVmYWY4XkEyXkFqcGc@._V1_SX600.jpg',
    synopsis:
      'Após um encontro íntimo aparentemente inocente, a jovem Jay descobre que recebeu uma maldição implacável: uma entidade metamorfa que assume a aparência de qualquer pessoa e caminha lentamente em sua direção para matá-la.',
    streamingPlatforms: [
      { platform: 'Prime Video', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'MUBI', type: 'subscription', priceInfo: 'Incluso na assinatura' },
      { platform: 'Apple TV (iTunes)', type: 'rent', priceInfo: 'Aluguel Digital' },
    ],
  },
  {
    keywords: ['the babadook', 'o babadook', 'babadook'],
    title: 'O Babadook',
    originalTitle: 'The Babadook',
    year: 2014,
    duration: '1h 34min',
    imdbRating: '6.8',
    director: 'Jennifer Kent',
    posterUrl:
      'https://m.media-amazon.com/images/M/MV5BMTk0NzMzODc2NF5BMl5BanBnXkFtZTgwOTYzNTM1MzE@._V1_SX600.jpg',
    synopsis:
      'Seis anos após a morte violenta do marido, uma mãe exausta tenta lidar com o medo constante de seu filho pequeno. Quando um misterioso livro infantil pop-up chamado "Mister Babadook" aparece na casa, uma presença sombria passa a dominar os dois.',
    streamingPlatforms: [
      { platform: 'Prime Video (Adrenalina Pura)', type: 'subscription', priceInfo: 'Incluso na assinatura do canal' },
      { platform: 'Apple TV / YouTube', type: 'rent', priceInfo: 'Aluguel Digital (~R$ 9,90)' },
    ],
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
 * Returns the movie's streaming & rental availability in Brazil, checking stored offers first,
 * then the curated horror database, then a clear fallback.
 */
export function getMovieStreamingOffers(movie: MovieTemplate): StreamingOffer[] {
  if (movie.isSecret) {
    return [
      {
        platform: 'Sessão Exclusiva na Mansão',
        type: 'subscription',
        priceInfo: 'Incluso no coração de Caldas & Aninha <3',
      },
    ];
  }
  if (Array.isArray(movie.streamingPlatforms) && movie.streamingPlatforms.length > 0) {
    return movie.streamingPlatforms;
  }
  const curated =
    findCuratedMovieMatch(movie.title) ||
    (movie.originalTitle ? findCuratedMovieMatch(movie.originalTitle) : undefined);
  if (curated && curated.streamingPlatforms.length > 0) {
    return curated.streamingPlatforms;
  }
  return [
    {
      platform: 'Apple TV / Prime Video Store',
      type: 'rent',
      priceInfo: 'Disponível por Aluguel / Compra Digital (VOD)',
    },
    {
      platform: 'Prime Video / Canais Especializados',
      type: 'subscription',
      priceInfo: 'Consulte disponibilidade no catálogo atual',
    },
  ];
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

  if (
    /^(Filme de terror estrelado por|Um filme de terror selecionado|Um mistério sombrio escolhido)/i.test(
      s
    )
  ) {
    return true;
  }

  if (
    /\b(é uma? atriz|é um ator|é uma? diretora?|é um cineasta|nascid[oa] na|nascid[oa] em|conhecid[oa] principalmente por seu papel|maior bilheteira em seu país)\b/i.test(
      s
    )
  ) {
    return true;
  }

  if (
    /\b(é um filme\b|dirigido e estrelado por|escrito e dirigido por|dirigido por [A-ZÀ-Ú][\w\s]+,?\s+com roteiro|estreia na direção|produzido por .* e distribuído)\b/i.test(
      s
    )
  ) {
    return true;
  }

  const englishStopWords = (
    s.match(/\b(the|and|with|from|their|after|when|who|into|that|this|young|family|woman|man)\b/gi) ||
    []
  ).length;
  if (englishStopWords >= 4) {
    return true;
  }

  return false;
}

function extractGeminiText(data: Record<string, unknown>): string {
  const candidates = data?.candidates as Array<{
    content?: { parts?: Array<{ text?: string; thought?: boolean }> };
  }> | undefined;
  const parts = candidates?.[0]?.content?.parts || [];
  const nonThought = parts.filter((p) => !p.thought && typeof p.text === 'string');
  if (nonThought.length > 0) {
    return nonThought.map((p) => p.text).join('').trim();
  }
  return (parts[parts.length - 1]?.text || '').trim();
}

/**
 * Generates or translates a real, atmospheric, spoiler-free plot synopsis in Brazilian Portuguese
 * AND fetches accurate Brazilian streaming vs. rental platforms using Gemini 3.5 Flash.
 */
export async function enrichMovieSynopsisAndStreamingWithAI(params: {
  title: string;
  originalTitle?: string;
  year?: number;
  director?: string;
  rawPlot?: string;
}): Promise<{ synopsis?: string; streamingPlatforms?: StreamingOffer[] } | null> {
  const curated =
    findCuratedMovieMatch(params.title) ||
    (params.originalTitle ? findCuratedMovieMatch(params.originalTitle) : undefined);
  if (curated && !isBadSynopsis(curated.synopsis)) {
    return {
      synopsis: curated.synopsis,
      streamingPlatforms: curated.streamingPlatforms,
    };
  }

  const systemInstruction = `Você é um curador especialista em cinema de terror no Brasil.
Responda APENAS com um JSON válido contendo:
1. "synopsis": A sinopse real do enredo (a história do que acontece no filme) em português do Brasil, de forma envolvente, sombria e SEM SPOILERS do final, em 2 a 3 frases (entre 160 e 340 caracteres). PROIBIDO começar com ficha técnica ("X é um filme dirigido por...") e PROIBIDO escrever biografia de atores.
2. "streamingPlatforms": Lista de 2 a 3 plataformas onde o filme está disponível no Brasil, diferenciando claramente se está INCLUSO NA ASSINATURA ("type": "subscription") ou se é por ALUGUEL / COMPRA DIGITAL ("type": "rent").

Formato exato:
{
  "synopsis": "história do filme em português...",
  "streamingPlatforms": [
    { "platform": "Nome da Plataforma (ex: Max, Prime Video, Netflix, MUBI, Looke)", "type": "subscription", "priceInfo": "Incluso na assinatura" },
    { "platform": "Apple TV / Prime Video Store", "type": "rent", "priceInfo": "Aluguel Digital (~R$ 14,90)" }
  ]
}`;

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
      ? `\nResumo de referência do enredo em inglês/português: "${params.rawPlot}"`
      : ''
  }`;

  const apiKey = getStoredAgentApiKey();
  const geminiModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];

  if (apiKey) {
    for (const model of geminiModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`;
        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.35,
              responseMimeType: 'application/json',
            },
          }),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const rawText = extractGeminiText(data);
        const firstBrace = rawText.indexOf('{');
        const lastBrace = rawText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          const parsed = JSON.parse(rawText.slice(firstBrace, lastBrace + 1));
          const syn = typeof parsed.synopsis === 'string' ? parsed.synopsis.trim() : '';
          const platforms: StreamingOffer[] = Array.isArray(parsed.streamingPlatforms)
            ? parsed.streamingPlatforms
                .filter((p: Record<string, unknown>) => p && typeof p.platform === 'string')
                .map((p: Record<string, unknown>) => ({
                  platform: String(p.platform),
                  type: p.type === 'subscription' ? 'subscription' : 'rent',
                  priceInfo: String(
                    p.priceInfo ||
                      (p.type === 'subscription' ? 'Incluso na assinatura' : 'Aluguel Digital')
                  ),
                }))
            : [];
          if (syn && !isBadSynopsis(syn)) {
            return {
              synopsis: syn,
              streamingPlatforms: platforms.length > 0 ? platforms : undefined,
            };
          }
        }
      } catch {
        // try next model
      }
    }
  }

  return null;
}

export async function generatePortuguesePlotSynopsis(params: {
  title: string;
  originalTitle?: string;
  year?: number;
  director?: string;
  rawPlot?: string;
}): Promise<string | null> {
  const enriched = await enrichMovieSynopsisAndStreamingWithAI(params);
  return enriched?.synopsis || null;
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
          streamingPlatforms: matchedCurated?.streamingPlatforms || [],
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

        const rentalPrice = Number(item.trackRentalPrice || 0);
        const buyPrice = Number(item.trackPrice || 0);
        const itunesOffers: StreamingOffer[] = [];
        if (rentalPrice > 0 && item.currency === 'BRL') {
          itunesOffers.push({
            platform: 'Apple TV (iTunes BR)',
            type: 'rent',
            priceInfo: `Aluguel R$ ${rentalPrice.toFixed(2).replace('.', ',')}`,
          });
        } else if (buyPrice > 0 && item.currency === 'BRL') {
          itunesOffers.push({
            platform: 'Apple TV (iTunes BR)',
            type: 'rent',
            priceInfo: `Compra Digital R$ ${buyPrice.toFixed(2).replace('.', ',')}`,
          });
        }

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
          streamingPlatforms: matchedCurated?.streamingPlatforms || itunesOffers,
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
            streamingPlatforms: matchedCurated?.streamingPlatforms || [],
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
      streamingPlatforms: curatedHit.streamingPlatforms,
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
      streamingPlatforms: [],
      posterUrl: '',
      curseWhisper: ai.curseWhisper,
      source: 'Análise IA Terrômetro',
    });
  }

  // Enrich top candidates with genuine Portuguese plot synopsis AND Brazilian streaming/rental platforms
  const topCandidates = results.slice(0, 2);
  await Promise.all(
    topCandidates.map(async (item) => {
      if (isBadSynopsis(item.synopsis) || !item.streamingPlatforms?.length) {
        const enriched = await enrichMovieSynopsisAndStreamingWithAI({
          title: item.title,
          originalTitle: item.originalTitle,
          year: item.year,
          rawPlot: item.synopsis,
        });
        if (enriched?.synopsis && !isBadSynopsis(enriched.synopsis)) {
          item.synopsis = enriched.synopsis;
          const refreshedAi = analyzeMovieHorrorAI({
            title: item.title,
            originalTitle: item.originalTitle,
            synopsis: enriched.synopsis,
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

        if (enriched?.streamingPlatforms?.length && !item.streamingPlatforms?.length) {
          item.streamingPlatforms = enriched.streamingPlatforms;
        }
      }

      if (!item.streamingPlatforms || item.streamingPlatforms.length === 0) {
        item.streamingPlatforms = [
          {
            platform: 'Apple TV / Prime Video Store',
            type: 'rent',
            priceInfo: 'Disponível por Aluguel / Compra Digital (VOD)',
          },
          {
            platform: 'Prime Video / Canais',
            type: 'subscription',
            priceInfo: 'Consulte disponibilidade no catálogo',
          },
        ];
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
