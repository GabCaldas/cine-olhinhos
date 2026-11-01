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
export const INITIAL_CHOSEN_MOVIES: ChosenMovieRecord[] = [];
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
