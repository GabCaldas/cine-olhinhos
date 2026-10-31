import { ChosenMovieRecord, MovieTemplate } from '../types/horror';

/**
 * ============================================================================
 * HISTÓRICO DE FILMES ESCOLHIDOS PELO CASAL (SALÃO DOS PACTOS SELADOS)
 * ============================================================================
 * À medida que vocês escolhem os filmes e completam o ritual, cada filme
 * escolhido é salvo automaticamente e passa a aparecer emoldurado na
 * Segunda Sala da Mansão ("O Salão dos Filmes Escolhidos")!
 */

// __CHOSEN_MOVIES_START__
export const INITIAL_CHOSEN_MOVIES: ChosenMovieRecord[] = [
  {
    "recordId": "chosen-movie-slot-1793477032961-1793477368615",
    "movie": {
      "id": "movie-slot-1793477032961",
      "tapeNumber": "QUADRO 1 // GALERIA",
      "title": "Frailty",
      "originalTitle": "Frailty",
      "year": 2001,
      "duration": "1h 40min",
      "subgenre": "Terror Religioso & Slasher",
      "fearLevel": 2,
      "bpm": 97,
      "tags": [
        "Religioso",
        "Slasher"
      ],
      "synopsis": "Um homem entra na sede do FBI no Texas afirmando saber a verdadeira identidade do assassino em série conhecido como \"Mão de Deus\". Ele revela sua infância sombria ao lado do pai viúvo e fanático, que após receber uma visão acreditava que a família fora escolhida para destruir demônios disfarçados de pessoas comuns.",
      "whyIChoseIt": "Escolhi esse para assistirmos juntinhos hoje à noite <3",
      "curseWhisper": "VOCÊ OUVIU ESSE BARULHO NO CORREDOR?",
      "posterArt": "silent_fog",
      "customPosterUrl": "https://m.media-amazon.com/images/M/MV5BM2MyMWVjNGYtZmRkOC00ZWI4LWI2OWEtYzY3YjNiZjgwNGFkXkEyXkFqcGc@._V1_SX600.jpg",
      "ritualVariation": "vhs_ring",
      "imdbRating": "7.2",
      "aiVerdict": "Análise IA (50% de Intensidade • Pico de 97 BPM): Filme marcado por assombração sobrenatural (54%) e alta tensão e sustos iminentes (50%). Classificado como Nível 2/5 no Terrômetro.",
      "aiBreakdown": {
        "psychological": 37,
        "supernatural": 54,
        "tension": 50,
        "visceral": 44
      }
    },
    "chosenAtIso": "2026-10-31T20:09:28.615Z",
    "chosenAtFormatted": "31/10/2026 às 17:09",
    "sessionNumber": 1
  },
  {
    "recordId": "chosen-movie-slot-1793477032961-1793477956637",
    "movie": {
      "id": "movie-slot-1793477032961",
      "tapeNumber": "QUADRO 1 // GALERIA DA MANSÃO",
      "title": "Frailty",
      "originalTitle": "Frailty",
      "year": 2001,
      "duration": "1h 40min",
      "subgenre": "Terror Religioso & Slasher",
      "fearLevel": 2,
      "bpm": 97,
      "tags": [
        "Religioso",
        "Slasher"
      ],
      "synopsis": "Um homem entra na sede do FBI no Texas afirmando saber a verdadeira identidade do assassino em série conhecido como \"Mão de Deus\". Ele revela sua infância sombria ao lado do pai viúvo e fanático, que após receber uma visão acreditava que a família fora escolhida para destruir demônios disfarçados de pessoas comuns.",
      "whyIChoseIt": "Escolhi esse para assistirmos juntinhos hoje à noite <3",
      "curseWhisper": "VOCÊ OUVIU ESSE BARULHO NO CORREDOR?",
      "posterArt": "silent_fog",
      "customPosterUrl": "https://m.media-amazon.com/images/M/MV5BM2MyMWVjNGYtZmRkOC00ZWI4LWI2OWEtYzY3YjNiZjgwNGFkXkEyXkFqcGc@._V1_SX600.jpg",
      "ritualVariation": "vhs_ring",
      "imdbRating": "7.2",
      "aiVerdict": "Análise IA (50% de Intensidade • Pico de 97 BPM): Filme marcado por assombração sobrenatural (54%) e alta tensão e sustos iminentes (50%). Classificado como Nível 2/5 no Terrômetro.",
      "aiBreakdown": {
        "psychological": 37,
        "supernatural": 54,
        "tension": 50,
        "visceral": 44
      }
    },
    "chosenAtIso": "2026-10-31T20:19:16.637Z",
    "chosenAtFormatted": "31/10/2026 às 17:19",
    "sessionNumber": 2
  },
  {
    "recordId": "chosen-movie-slot-1793477032961-1793478296858",
    "movie": {
      "id": "movie-slot-1793477032961",
      "tapeNumber": "QUADRO 1 // GALERIA DA MANSÃO",
      "title": "Frailty",
      "originalTitle": "Frailty",
      "year": 2001,
      "duration": "1h 40min",
      "subgenre": "Terror Religioso & Slasher",
      "fearLevel": 2,
      "bpm": 97,
      "tags": [
        "Religioso",
        "Slasher"
      ],
      "synopsis": "Um homem entra na sede do FBI no Texas afirmando saber a verdadeira identidade do assassino em série conhecido como \"Mão de Deus\". Ele revela sua infância sombria ao lado do pai viúvo e fanático, que após receber uma visão acreditava que a família fora escolhida para destruir demônios disfarçados de pessoas comuns.",
      "whyIChoseIt": "Escolhi esse para assistirmos juntinhos hoje à noite <3",
      "curseWhisper": "VOCÊ OUVIU ESSE BARULHO NO CORREDOR?",
      "posterArt": "silent_fog",
      "customPosterUrl": "https://m.media-amazon.com/images/M/MV5BM2MyMWVjNGYtZmRkOC00ZWI4LWI2OWEtYzY3YjNiZjgwNGFkXkEyXkFqcGc@._V1_SX600.jpg",
      "ritualVariation": "vhs_ring",
      "imdbRating": "7.2",
      "aiVerdict": "Análise IA (50% de Intensidade • Pico de 97 BPM): Filme marcado por assombração sobrenatural (54%) e alta tensão e sustos iminentes (50%). Classificado como Nível 2/5 no Terrômetro.",
      "aiBreakdown": {
        "psychological": 37,
        "supernatural": 54,
        "tension": 50,
        "visceral": 44
      }
    },
    "chosenAtIso": "2026-10-31T20:24:56.858Z",
    "chosenAtFormatted": "31/10/2026 às 17:24",
    "sessionNumber": 3
  },
  {
    "recordId": "chosen-movie-slot-1793477032961-1793478304086",
    "movie": {
      "id": "movie-slot-1793477032961",
      "tapeNumber": "QUADRO 1 // GALERIA DA MANSÃO",
      "title": "Frailty",
      "originalTitle": "Frailty",
      "year": 2001,
      "duration": "1h 40min",
      "subgenre": "Terror Religioso & Slasher",
      "fearLevel": 2,
      "bpm": 97,
      "tags": [
        "Religioso",
        "Slasher"
      ],
      "synopsis": "Um homem entra na sede do FBI no Texas afirmando saber a verdadeira identidade do assassino em série conhecido como \"Mão de Deus\". Ele revela sua infância sombria ao lado do pai viúvo e fanático, que após receber uma visão acreditava que a família fora escolhida para destruir demônios disfarçados de pessoas comuns.",
      "whyIChoseIt": "Escolhi esse para assistirmos juntinhos hoje à noite <3",
      "curseWhisper": "VOCÊ OUVIU ESSE BARULHO NO CORREDOR?",
      "posterArt": "silent_fog",
      "customPosterUrl": "https://m.media-amazon.com/images/M/MV5BM2MyMWVjNGYtZmRkOC00ZWI4LWI2OWEtYzY3YjNiZjgwNGFkXkEyXkFqcGc@._V1_SX600.jpg",
      "ritualVariation": "vhs_ring",
      "imdbRating": "7.2",
      "aiVerdict": "Análise IA (50% de Intensidade • Pico de 97 BPM): Filme marcado por assombração sobrenatural (54%) e alta tensão e sustos iminentes (50%). Classificado como Nível 2/5 no Terrômetro.",
      "aiBreakdown": {
        "psychological": 37,
        "supernatural": 54,
        "tension": 50,
        "visceral": 44
      }
    },
    "chosenAtIso": "2026-10-31T20:25:04.086Z",
    "chosenAtFormatted": "31/10/2026 às 17:25",
    "sessionNumber": 4
  }
];
// __CHOSEN_MOVIES_END__

const CHOSEN_STORAGE_KEY = 'horror_night_chosen_hall_v1';

export function loadChosenMovies(): ChosenMovieRecord[] {
  try {
    const raw = localStorage.getItem(CHOSEN_STORAGE_KEY);
    if (!raw) return INITIAL_CHOSEN_MOVIES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_CHOSEN_MOVIES;
  } catch {
    return INITIAL_CHOSEN_MOVIES;
  }
}

export async function saveChosenMovies(records: ChosenMovieRecord[]): Promise<void> {
  try {
    localStorage.setItem(CHOSEN_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage errors
  }

  // Also persist to src/data/chosenMovies.ts if running locally on Vite dev server
  try {
    await fetch('/api/save-chosen-movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chosenMovies: records }),
    });
  } catch {
    // Ignore when hosted on static cloud
  }
}

export async function addMovieToChosenHall(
  movie: MovieTemplate,
  currentList: ChosenMovieRecord[]
): Promise<ChosenMovieRecord[]> {
  const now = new Date();
  const formatted = now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) +
    ' às ' +
    now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

  const newRecord: ChosenMovieRecord = {
    recordId: `chosen-${movie.id}-${Date.now()}`,
    movie,
    chosenAtIso: now.toISOString(),
    chosenAtFormatted: formatted,
    sessionNumber: currentList.length + 1,
  };

  const next = [...currentList, newRecord];
  await saveChosenMovies(next);
  return next;
}

export async function removeChosenMovieRecord(
  recordId: string,
  currentList: ChosenMovieRecord[]
): Promise<ChosenMovieRecord[]> {
  const filtered = currentList
    .filter((r) => r.recordId !== recordId)
    .map((r, idx) => ({ ...r, sessionNumber: idx + 1 }));
  await saveChosenMovies(filtered);
  return filtered;
}
