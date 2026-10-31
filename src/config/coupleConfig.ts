import { CoupleConfig } from '../types/horror';

/**
 * ============================================================================
 * CONFIGURAÇÃO DO CASAL EM PIXEL ART (CALDAS & ANINHA / "OLHINHOS")
 * ============================================================================
 * Inspirado diretamente na foto de vocês dois!
 * - Aninha: Cabelo preto longo liso com franja reta, brinco prateado,
 *   casaco preto com alça de corrente prateada e detalhe azul na gola.
 * - Caldas: Cabelo escuro levemente ondulado, barba curta desenhada,
 *   jaqueta de couro preta sobre camiseta branca.
 */
export const DEFAULT_COUPLE_CONFIG: CoupleConfig = {
  her: {
    name: 'Aninha',
    nickname: 'Olhinhos',
    skinColor: '#ebbfa0',
    hairColor: '#121016',
    hairStyle: 'aninha_bangs_long',
    hasEarring: true,
    earringColor: '#e2e8f0',
    coatColor: '#111217',
    scarfColor: '#2563eb',
    hasChainBag: true,
  },
  him: {
    name: 'Caldas',
    nickname: 'Caldas',
    skinColor: '#dfa885',
    hairColor: '#1b161d',
    hairStyle: 'wavy_short',
    beardStyle: 'short_stubble',
    jacketColor: '#16161c',
    shirtColor: '#f3f2ee',
    hasLantern: true,
  },
  finalConfirmationMessage: 'Bom filme amoreco!!!!',
  secretLoveLetter: '',
  lanternColor: '#f59e0b',
};

const STORAGE_KEY = 'horror_night_couple_config_v2';

export function loadCoupleConfig(): CoupleConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COUPLE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_COUPLE_CONFIG,
      ...parsed,
      her: { ...DEFAULT_COUPLE_CONFIG.her, ...(parsed.her || {}) },
      him: { ...DEFAULT_COUPLE_CONFIG.him, ...(parsed.him || {}) },
    };
  } catch {
    return DEFAULT_COUPLE_CONFIG;
  }
}

export function saveCoupleConfig(config: CoupleConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

export function resetCoupleConfig(): CoupleConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
  return DEFAULT_COUPLE_CONFIG;
}
