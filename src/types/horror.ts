export type HorrorTag =
  | 'Sobrenatural'
  | 'Psicológico'
  | 'Slasher'
  | 'Found Footage'
  | 'Religioso'
  | 'Mistério'
  | 'Paranormal'
  | 'Folk Horror'
  | 'Gótico';

export type PosterArtType =
  | 'silent_fog'
  | 'occult_attic'
  | 'forest_witch'
  | 'cursed_well'
  | 'found_footage'
  | 'mansion_corridor'
  | 'spencer_manor'
  | 'unholy_cross'
  | 'secret_couple';

export type RitualVariation = 'vhs_ring' | 'faith_sigil' | 'silent_siren';

export interface HorrorAIBreakdown {
  psychological: number; // 0..100
  supernatural: number;  // 0..100
  tension: number;       // 0..100 (Jump scares / suspense)
  visceral: number;      // 0..100 (Gore / physical threat)
}

export interface StreamingOffer {
  platform: string; // e.g. "Max (HBO)", "Prime Video", "Apple TV", "MUBI"
  type: 'subscription' | 'rent' | 'unavailable'; // 'subscription' = Incluso na assinatura, 'rent' = Aluguel / Compra
  priceInfo?: string; // e.g. "Incluso na assinatura" or "Aluguel R$ 11,90"
}

export interface MovieTemplate {
  id: string;
  tapeNumber: string; // e.g. "QUADRO I // ALA LESTE"
  title: string;
  originalTitle?: string;
  year: number;
  duration: string;
  imdbRating?: string; // e.g. "7.3"
  subgenre: string;
  fearLevel: 1 | 2 | 3 | 4 | 5;
  bpm: number; // Heartbeat rate calculated by embedded AI
  aiVerdict?: string; // Embedded AI explanation of why the movie is scary
  aiBreakdown?: HorrorAIBreakdown; // 4-axis fear breakdown
  tags: HorrorTag[];
  synopsis: string;
  streamingPlatforms?: StreamingOffer[]; // Brazilian streaming & rental availability
  whyIChoseIt?: string;
  curseWhisper: string; // Disturbing message on hover
  posterArt: PosterArtType;
  customPosterUrl?: string; // Official high-res poster URL
  ritualVariation: RitualVariation;
  isSecret?: boolean;
}

export interface ChosenMovieRecord {
  recordId: string;
  movie: MovieTemplate;
  chosenAtIso: string;
  chosenAtFormatted: string; // e.g. "29/10/2026 às 21:40"
  sessionNumber: number;
}

export type HairStyleHer = 'aninha_bangs_long' | 'long_wavy' | 'bob_bangs' | 'braided_goth';
export type HairStyleHim = 'wavy_short' | 'messy_curls' | 'slick_back' | 'short_crop';
export type BeardStyle = 'short_stubble' | 'full_beard' | 'clean_shaven';

export interface HerAppearance {
  name: string;
  nickname: string;
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyleHer;
  hasEarring: boolean;
  earringColor: string;
  coatColor: string;
  scarfColor: string;
  hasChainBag: boolean;
}

export interface HimAppearance {
  name: string;
  nickname: string;
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyleHim;
  beardStyle: BeardStyle;
  jacketColor: string;
  shirtColor: string;
  hasLantern: boolean;
}

export interface CoupleConfig {
  her: HerAppearance;
  him: HimAppearance;
  finalConfirmationMessage: string;
  secretLoveLetter: string;
  lanternColor: string;
}

export type EasterEggId =
  | 'hidden_minion'
  | 'ghostface'
  | 'pennywise_balloon'
  | 'jigsaw_billy'
  | 'crt_tv'
  | 'shining_twins'
  | 'jason_mask'
  | 'cursed_portrait'
  | 'secret_vhs';

export interface EasterEggInfo {
  id: EasterEggId;
  title: string;
  location: string;
  hint: string;
  discoveryText: string;
}

export type SceneEvent =
  | 'none'
  | 'window_shadow'
  | 'tree_watcher'
  | 'lantern_flicker'
  | 'thunder_flash'
  | 'phone_ringing'
  | 'clock_333'
  | 'couple_hold_hands';
