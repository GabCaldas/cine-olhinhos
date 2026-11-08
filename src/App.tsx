import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChosenMovieRecord,
  EasterEggId,
  HorrorTag,
  MovieTemplate,
} from './types/horror';
import { DEFAULT_COUPLE_CONFIG } from './config/coupleConfig';
import {
  loadMovies,
  resetMoviesToDefault,
  saveMovies,
} from './data/movies';
import {
  addMovieToChosenHall,
  loadChosenMovies,
  removeChosenMovieRecord,
  saveChosenMovies,
} from './data/chosenMovies';
import { TOTAL_EASTER_EGGS } from './data/easterEggs';
import {
  autoFillMovieByName,
  findCuratedMovieMatch,
  generatePortuguesePlotSynopsis,
  isBadSynopsis,
  persistMoviesEverywhere,
} from './utils/movieAutoFill';
import { analyzeMovieHorrorAI, isHorrorMovie } from './utils/horrorAiAnalyzer';
import {
  pushStateToCloud,
  subscribeToLiveCloudSync,
  syncWithCloudOnStartup,
} from './utils/cloudSync';
import { soundEngine } from './utils/soundEngine';
import { IntroScreen } from './components/IntroScreen';
import { MansionCorridorScene } from './components/MansionCorridorScene';
import { ChosenHallScene } from './components/ChosenHallScene';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { RitualSequenceModal } from './components/RitualSequenceModal';
import { MovieEditorModal } from './components/MovieEditorModal';
import { SecretsModal } from './components/SecretsModal';
import { ButlerAgentModal } from './components/ButlerAgentModal';
import {
  Volume2,
  VolumeX,
  Heart,
  Eye,
  Shuffle,
  EyeOff,
  Film,
  DoorOpen,
  LayoutGrid,
  Footprints,
  KeyRound,
  Award,
  Cloud,
  RefreshCw,
  Bot,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export function App() {
  // 1. Scene state: Outside Mansion (Intro) vs Inside Mansion ('corridor' | 'chosen_hall')
  const [hasEnteredMansion, setHasEnteredMansion] = useState<boolean>(false);
  const [activeRoom, setActiveRoom] = useState<'corridor' | 'chosen_hall'>('corridor');

  // Fixed photo-accurate pixel couple config for Aninha & Caldas
  const coupleConfig = DEFAULT_COUPLE_CONFIG;

  // Movies & Chosen Movies Hall state
  const [movies, setMovies] = useState<MovieTemplate[]>(() => loadMovies());
  const [chosenRecords, setChosenRecords] = useState<ChosenMovieRecord[]>(() =>
    loadChosenMovies()
  );

  const [selectedTag, setSelectedTag] = useState<HorrorTag | 'TODOS'>('TODOS');
  const [showGridBelow, setShowGridBelow] = useState<boolean>(false);

  // Active modals, ritual & AI Butler Agent state
  const [inspectedMovie, setInspectedMovie] = useState<MovieTemplate | null>(null);
  const [chosenMovieForRitual, setChosenMovieForRitual] =
    useState<MovieTemplate | null>(null);
  const [isMovieEditorOpen, setIsMovieEditorOpen] = useState<boolean>(false);
  const [isSecretsOpen, setIsSecretsOpen] = useState<boolean>(false);
  const [isButlerOpen, setIsButlerOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [agentTargetMovieId, setAgentTargetMovieId] = useState<string | null>(null);

  // Easter eggs discovery tracker (Local session only — NOT saved in cloud!)
  const [discoveredEggs, setDiscoveredEggs] = useState<EasterEggId[]>([]);

  // Cloud Sync state
  const [cloudStatus, setCloudStatus] = useState<'syncing' | 'online' | 'offline'>('syncing');
  const moviesRef = useRef(movies);
  moviesRef.current = movies;
  const chosenRef = useRef(chosenRecords);
  chosenRef.current = chosenRecords;

  // Audio & Accessibility state
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // 1. Initial Cloud Sync on Startup + Live Real-Time SSE Subscription (Movies & Chosen Hall only!)
  useEffect(() => {
    let cancelled = false;

    async function initCloudSync() {
      setCloudStatus('syncing');
      const res = await syncWithCloudOnStartup({
        movies: moviesRef.current,
        chosenMovies: chosenRef.current,
      });

      if (cancelled) return;

      if (res.action === 'pulled' && res.state) {
        setMovies(res.state.movies);
        setChosenRecords(res.state.chosenMovies);
        setCloudStatus('online');
      } else if (res.action === 'pushed' || res.action === 'up_to_date') {
        setCloudStatus('online');
      } else {
        setCloudStatus('offline');
      }
    }

    initCloudSync();

    // Live SSE listener: when Aninha or Caldas makes a change on another device, apply it immediately!
    const unsubscribe = subscribeToLiveCloudSync((remoteState) => {
      if (cancelled) return;
      setMovies(remoteState.movies);
      setChosenRecords(remoteState.chosenMovies);
      setCloudStatus('online');
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Automatically fetch missing official posters, IMDb rating, AI Terrômetro metadata & repair bad synopses (once per movie ID, without overwriting concurrent agent actions)
  const repairedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function enrichAndRepairMovies() {
      const needsTemplateRepair = (m: MovieTemplate) => {
        const strictHorror = isHorrorMovie({
          title: m.title,
          originalTitle: m.originalTitle,
          synopsis: m.synopsis,
          isSecret: m.isSecret,
        });
        if (!strictHorror && (m.isHorror === true || m.subgenre?.startsWith('Terror'))) {
          return true;
        }
        return false;
      };

      const toRepairMovies = movies.filter(
        (m) =>
          !m.isSecret &&
          !repairedIdsRef.current.has(m.id) &&
          (!m.customPosterUrl ||
            !m.aiVerdict ||
            !m.imdbRating ||
            isBadSynopsis(m.synopsis) ||
            !m.streamingPlatforms?.length ||
            needsTemplateRepair(m))
      );
      const toRepairChosen = chosenRecords.filter(
        (r) =>
          !r.movie.isSecret &&
          !repairedIdsRef.current.has(r.recordId) &&
          (isBadSynopsis(r.movie.synopsis) ||
            !r.movie.streamingPlatforms?.length ||
            needsTemplateRepair(r.movie))
      );

      if (toRepairMovies.length === 0 && toRepairChosen.length === 0) return;

      toRepairMovies.forEach((m) => repairedIdsRef.current.add(m.id));
      toRepairChosen.forEach((r) => repairedIdsRef.current.add(r.recordId));

      const repairSingleMovie = async (
        m: MovieTemplate
      ): Promise<{ movie: MovieTemplate; didChange: boolean }> => {
        const curated =
          findCuratedMovieMatch(m.title) ||
          (m.originalTitle ? findCuratedMovieMatch(m.originalTitle) : undefined);

        if (curated) {
          const ai = analyzeMovieHorrorAI({
            title: curated.title,
            originalTitle: curated.originalTitle,
            synopsis: curated.synopsis,
            director: curated.director,
          });
          return {
            didChange: true,
            movie: {
              ...m,
              originalTitle: curated.originalTitle || m.originalTitle,
              year: curated.year || m.year,
              duration: curated.duration || m.duration,
              imdbRating: curated.imdbRating || m.imdbRating,
              isHorror: ai.isHorror,
              subgenre: ai.subgenre,
              fearLevel: ai.fearLevel,
              bpm: ai.bpm,
              aiVerdict: ai.aiVerdict,
              aiBreakdown: ai.aiBreakdown,
              tags: ai.tags,
              curseWhisper: ai.curseWhisper,
              synopsis: curated.synopsis,
              streamingPlatforms: curated.streamingPlatforms,
              customPosterUrl: m.customPosterUrl || curated.posterUrl,
            },
          };
        }

        if (needsTemplateRepair(m) && m.customPosterUrl && !isBadSynopsis(m.synopsis)) {
          const ai = analyzeMovieHorrorAI({
            title: m.title,
            originalTitle: m.originalTitle,
            synopsis: m.synopsis,
          });
          return {
            didChange: true,
            movie: {
              ...m,
              isHorror: ai.isHorror,
              subgenre: ai.subgenre,
              fearLevel: ai.fearLevel,
              bpm: ai.bpm,
              aiVerdict: ai.aiVerdict,
              aiBreakdown: ai.aiBreakdown,
              tags: ai.tags,
              curseWhisper: ai.curseWhisper,
            },
          };
        }

        try {
          if (m.customPosterUrl && isBadSynopsis(m.synopsis)) {
            const generatedSynopsis = await generatePortuguesePlotSynopsis({
              title: m.title,
              originalTitle: m.originalTitle,
              year: m.year,
              rawPlot: m.synopsis,
            });
            if (generatedSynopsis && !isBadSynopsis(generatedSynopsis)) {
              const ai = analyzeMovieHorrorAI({
                title: m.title,
                originalTitle: m.originalTitle,
                synopsis: generatedSynopsis,
              });
              return {
                didChange: true,
                movie: {
                  ...m,
                  isHorror: ai.isHorror,
                  subgenre: ai.subgenre,
                  fearLevel: ai.fearLevel,
                  bpm: ai.bpm,
                  aiVerdict: ai.aiVerdict,
                  aiBreakdown: ai.aiBreakdown,
                  tags: ai.tags,
                  curseWhisper: ai.curseWhisper,
                  synopsis: generatedSynopsis,
                },
              };
            }
          }

          const results = await autoFillMovieByName(m.title);
          const best = results.find((r) => r.posterUrl) || results[0];
          if (best) {
            return {
              didChange: true,
              movie: {
                ...m,
                year: best.year || m.year,
                duration: best.duration || m.duration,
                imdbRating: best.imdbRating || m.imdbRating,
                isHorror: best.isHorror,
                subgenre: best.subgenre || m.subgenre,
                fearLevel: best.fearLevel,
                bpm: best.bpm,
                aiVerdict: best.aiVerdict,
                aiBreakdown: best.aiBreakdown,
                tags: best.tags?.length ? best.tags : m.tags,
                curseWhisper: best.curseWhisper || m.curseWhisper,
                synopsis: !isBadSynopsis(best.synopsis) ? best.synopsis : m.synopsis,
                streamingPlatforms:
                  best.streamingPlatforms?.length
                    ? best.streamingPlatforms
                    : m.streamingPlatforms,
                customPosterUrl: m.customPosterUrl || best.posterUrl,
              },
            };
          }
        } catch {
          // ignore
        }

        return { movie: m, didChange: false };
      };

      const repairedMap = new Map<string, MovieTemplate>();
      for (const m of toRepairMovies) {
        const res = await repairSingleMovie(m);
        if (res.didChange) {
          repairedMap.set(m.id, res.movie);
        }
      }

      const repairedChosenMap = new Map<string, MovieTemplate>();
      for (const r of toRepairChosen) {
        const res = await repairSingleMovie(r.movie);
        if (res.didChange) {
          repairedChosenMap.set(r.recordId, res.movie);
        }
      }

      if (cancelled) return;

      let finalMovies = moviesRef.current;
      let finalChosen = chosenRef.current;

      if (repairedMap.size > 0) {
        finalMovies = moviesRef.current.map((m) => repairedMap.get(m.id) || m);
        setMovies(finalMovies);
        saveMovies(finalMovies);
        await persistMoviesEverywhere(finalMovies);
        setInspectedMovie((prev) => (prev ? repairedMap.get(prev.id) || prev : null));
      }

      if (repairedChosenMap.size > 0) {
        finalChosen = chosenRef.current.map((r) => {
          const rep = repairedChosenMap.get(r.recordId);
          return rep ? { ...r, movie: rep } : r;
        });
        setChosenRecords(finalChosen);
        await saveChosenMovies(finalChosen);
      }

      if (repairedMap.size > 0 || repairedChosenMap.size > 0) {
        await pushStateToCloud({
          movies: finalMovies,
          chosenMovies: finalChosen,
        });
      }
    }

    enrichAndRepairMovies();
    return () => {
      cancelled = true;
    };
  }, [movies, chosenRecords]);

  // Secret keyboard shortcut for Caldas (Ctrl+M or Cmd+M)
  useEffect(() => {
    const handleSecretShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsMovieEditorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleSecretShortcut);
    return () => window.removeEventListener('keydown', handleSecretShortcut);
  }, []);

  const triggerCloudPush = async (nextState: {
    movies: MovieTemplate[];
    chosenMovies: ChosenMovieRecord[];
  }) => {
    setCloudStatus('syncing');
    const res = await pushStateToCloud(nextState);
    setCloudStatus(res.ok ? 'online' : 'offline');
  };

  const handleManualCloudSync = async () => {
    setCloudStatus('syncing');
    const res = await syncWithCloudOnStartup({
      movies: moviesRef.current,
      chosenMovies: chosenRef.current,
    });
    if (res.action === 'pulled' && res.state) {
      setMovies(res.state.movies);
      setChosenRecords(res.state.chosenMovies);
      setCloudStatus('online');
    } else {
      const pushed = await pushStateToCloud({
        movies: moviesRef.current,
        chosenMovies: chosenRef.current,
      });
      setCloudStatus(pushed.ok ? 'online' : 'offline');
    }
  };

  const handleSaveMovies = (updated: MovieTemplate[]) => {
    setMovies(updated);
    saveMovies(updated);
    triggerCloudPush({
      movies: updated,
      chosenMovies: chosenRef.current,
    });
  };

  // Action when Arthur or the couple adds a brand-new movie to the corridor wall!
  const handleAddNewMovieFromAgent = async (newMovie: MovieTemplate) => {
    const secretMovies = moviesRef.current.filter((m) => m.isSecret);
    const regularMovies = moviesRef.current.filter((m) => !m.isSecret);
    const updated = [...regularMovies, newMovie, ...secretMovies];
    setMovies(updated);
    saveMovies(updated);
    await persistMoviesEverywhere(updated);
    setActiveRoom('corridor');
    setAgentTargetMovieId(newMovie.id);
    await triggerCloudPush({
      movies: updated,
      chosenMovies: chosenRef.current,
    });
  };

  // Action when Arthur or the couple removes a painting from the corridor wall (Total control — can delete down to 0!)
  const handleRemoveMovieFromWall = async (movieId: string) => {
    const regularMovies = moviesRef.current.filter((m) => !m.isSecret);
    const secretMovies = moviesRef.current.filter((m) => m.isSecret);
    const remainingRegular = regularMovies
      .filter((m) => m.id !== movieId)
      .map((m, idx) => ({
        ...m,
        tapeNumber: `EM CARTAZ #${idx + 1} // CINE OLHINHOS`,
      }));
    const updated = [...remainingRegular, ...secretMovies];
    setMovies(updated);
    saveMovies(updated);
    await persistMoviesEverywhere(updated);
    await triggerCloudPush({
      movies: updated,
      chosenMovies: chosenRef.current,
    });
  };

  const handleResetMovies = async () => {
    const def = resetMoviesToDefault();
    setMovies(def);
    await persistMoviesEverywhere(def);
    await triggerCloudPush({
      movies: def,
      chosenMovies: chosenRef.current,
    });
  };

  // Confirming a movie triggers the 8-step terrifying ritual, adds it to Chosen Hall AND pushes to Cloud!
  const handleConfirmMovieChoice = async (movie: MovieTemplate) => {
    setInspectedMovie(null);
    setChosenMovieForRitual(movie);
    const updatedChosen = await addMovieToChosenHall(movie, chosenRecords);
    setChosenRecords(updatedChosen);
    await triggerCloudPush({
      movies: moviesRef.current,
      chosenMovies: updatedChosen,
    });
  };

  const handleRemoveChosenRecord = async (recordId: string) => {
    const updated = await removeChosenMovieRecord(recordId, chosenRecords);
    setChosenRecords(updated);
    await triggerCloudPush({
      movies: moviesRef.current,
      chosenMovies: updated,
    });
  };

  // Secrets / Achievements remain strictly local (never saved in cloud)
  const handleDiscoverEgg = (id: EasterEggId) => {
    setDiscoveredEggs((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleToggleAudio = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const visibleMovies = useMemo(() => {
    const unlockedSecret = discoveredEggs.includes('secret_vhs');
    return movies.filter((m) => {
      if (m.isSecret && !unlockedSecret) return false;
      if (selectedTag === 'TODOS') return true;
      return m.tags.includes(selectedTag);
    });
  }, [movies, selectedTag, discoveredEggs]);

  const availableTags: Array<HorrorTag | 'TODOS'> = [
    'TODOS',
    'Animação',
    'Comédia',
    'Ficção Científica',
    'Aventura',
    'Musical',
    'Romance',
    'Drama',
    'Cult',
    'Fantasia',
    'Psicológico',
    'Sobrenatural',
    'Mistério',
  ];

  const handleRoulettePick = () => {
    if (visibleMovies.length === 0) return;
    soundEngine.playVhsStatic(0.3, 0.2);
    soundEngine.playHeartbeat(0.75);
    const randomIdx = Math.floor(Math.random() * visibleMovies.length);
    setInspectedMovie(visibleMovies[randomIdx]);
  };

  return (
    <div
      className={`min-h-screen bg-[#050306] text-[#e5e2e8] relative selection:bg-red-900 selection:text-white flex flex-col justify-between ${
        reducedMotion ? 'reduce-motion' : ''
      }`}
    >
      {/* Global Atmospheric Vignette & Subtle CRT Scanlines */}
      <div className="pointer-events-none fixed inset-0 crt-scanlines opacity-30 z-30" />
      <div className="pointer-events-none fixed inset-0 vignette-heavy z-20" />

      {/* SCENE 1: OUTSIDE THE MANSION (Caldas & Aninha standing in front of the Mansion Door) */}
      {!hasEnteredMansion && (
        <IntroScreen
          coupleConfig={coupleConfig}
          reducedMotion={reducedMotion}
          onEnterNight={() => {
            setHasEnteredMansion(true);
            setIsMuted(soundEngine.getMuted());
          }}
        />
      )}

      {/* TOP NAVIGATION / GRAND CINE OLHINHOS HUD (Clean Single-Row Layout on Mobile & Desktop) */}
      <header className="sticky top-0 z-30 bg-[#070408]/95 backdrop-blur-xs border-b border-amber-900/50 px-2.5 sm:px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 relative">
          {/* Left: Compact Cinema Logo & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 bg-[#1f070d] border border-amber-500/80 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-gothic text-xs sm:text-base tracking-wider text-white truncate">
                  <span className="sm:hidden">Grand Cine Olhinhos</span>
                  <span className="hidden sm:inline">
                    Grand Cine Olhinhos — Filmes para meus oinhos
                  </span>
                </h1>
                <span
                  onClick={handleManualCloudSync}
                  title={
                    cloudStatus === 'online'
                      ? 'Nuvem sincronizada (toque para atualizar)'
                      : cloudStatus === 'syncing'
                      ? 'Sincronizando...'
                      : 'Modo local'
                  }
                  className={`w-2 h-2 rounded-full shrink-0 cursor-pointer ${
                    cloudStatus === 'online'
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                      : cloudStatus === 'syncing'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-zinc-600'
                  }`}
                />
              </div>
              <p className="hidden sm:block font-vt text-xs text-amber-300/90 tracking-wider leading-none">
                Feito com carinho! - Caldas 🍿❤️
              </p>
            </div>
          </div>

          {/* Right: Streamlined Primary Actions + Compact Options Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 1. Summon George (The Cinema Concierge) */}
            <button
              onClick={() => {
                soundEngine.playRomanticChime();
                setIsButlerOpen(true);
                setIsMenuOpen(false);
              }}
              className="px-2.5 sm:px-3 py-1 bg-[#260c14] hover:bg-[#3d1220] border border-amber-500/80 text-amber-200 font-vt text-xs sm:text-sm flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.25)] transition cursor-pointer"
              title="Conversar com George, o Concierge e Curador Cinéfilo do Cinema"
            >
              <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
              <span>George</span>
            </button>

            {/* 2. Switch between Foyer and Sala VIP */}
            <button
              onClick={() => {
                soundEngine.playDoorCreak();
                setActiveRoom((r) => (r === 'corridor' ? 'chosen_hall' : 'corridor'));
                setIsMenuOpen(false);
              }}
              className={`px-2.5 sm:px-3 py-1 border font-vt text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer ${
                activeRoom === 'chosen_hall'
                  ? 'bg-amber-800/90 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : 'bg-[#211108] hover:bg-[#381c0c] border-amber-700/80 text-amber-200'
              }`}
              title="Alternar entre o Foyer do Cinema e a Sala VIP dos Filmes Escolhidos"
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
              <span>
                {activeRoom === 'chosen_hall'
                  ? '← Foyer'
                  : `VIP (${chosenRecords.length})`}
              </span>
            </button>

            {/* 3. Quick Mute / Unmute Audio */}
            <button
              onClick={handleToggleAudio}
              className="p-1.5 bg-zinc-900/90 hover:bg-amber-950/60 border border-amber-800/60 text-zinc-200 transition cursor-pointer"
              title={isMuted ? 'Ativar Som' : 'Silenciar Som'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-zinc-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* 4. Clean Options Menu Toggle (Hides secondary buttons so Mobile & Desktop stay super clean!) */}
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className={`px-2 py-1.5 border font-vt text-xs sm:text-sm flex items-center gap-1 transition cursor-pointer ${
                isMenuOpen
                  ? 'bg-amber-900/80 border-amber-400 text-amber-100'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}
              title="Mais opções (Sortear, Easter Eggs, Grade, Nuvem...)"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 text-amber-300" />
              ) : (
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              )}
              <span className="hidden md:inline">Menu</span>
            </button>
          </div>

          {/* Clean Dropdown Menu for Secondary Controls */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-[#0b0813] border-2 border-amber-600/80 shadow-[0_15px_45px_rgba(0,0,0,0.95)] p-2 space-y-1 animate-fadeIn">
                <div className="px-2.5 py-1 font-pixel text-[8px] text-amber-400 uppercase tracking-wider border-b border-amber-950/80">
                  Opções do Cinema
                </div>

                {activeRoom === 'corridor' && (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleRoulettePick();
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-amber-950/50 text-zinc-100 font-vt text-sm flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Shuffle className="w-4 h-4 text-amber-400" />
                        <span>Sortear Filme Aleatório</span>
                      </span>
                      <span className="text-xs text-amber-400">🎲</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowGridBelow((v) => !v);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-amber-950/50 text-zinc-100 font-vt text-sm flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {showGridBelow ? (
                          <Footprints className="w-4 h-4 text-amber-400" />
                        ) : (
                          <LayoutGrid className="w-4 h-4 text-amber-400" />
                        )}
                        <span>
                          {showGridBelow ? 'Ocultar Grade Abaixo' : 'Ver Todos em Grade'}
                        </span>
                      </span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsSecretsOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-amber-950/50 text-zinc-100 font-vt text-sm flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <span>Easter Eggs do Cinema</span>
                  </span>
                  <span className="px-1.5 py-0.5 bg-amber-950 border border-amber-700 text-amber-300 text-xs">
                    {discoveredEggs.length}/{TOTAL_EASTER_EGGS}
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleManualCloudSync();
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-amber-950/50 text-zinc-100 font-vt text-sm flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {cloudStatus === 'syncing' ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Cloud className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Sincronizar Nuvem</span>
                  </span>
                  <span className="text-xs text-emerald-400">
                    {cloudStatus === 'online' ? 'Online' : 'Sync'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setReducedMotion((v) => !v);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-amber-950/50 text-zinc-100 font-vt text-sm flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-zinc-400" />
                    <span>Reduzir Movimento</span>
                  </span>
                  <span className="text-xs text-amber-300">
                    {reducedMotion ? 'ATIVO' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsMovieEditorOpen(true);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-amber-950/50 text-zinc-100 font-vt text-sm flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Curadoria de Cartazes</span>
                  </span>
                </button>

                <div className="border-t border-zinc-800/80 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setHasEnteredMansion(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-red-950/50 text-red-200 font-vt text-sm flex items-center gap-2 transition cursor-pointer"
                  >
                    <DoorOpen className="w-4 h-4 text-red-400" />
                    <span>Voltar à Fachada do Cinema</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* MAIN MANSION INTERIOR: ROOM 1 (CORRIDOR) OR ROOM 2 (CHOSEN MOVIES HALL) */}
      <main className="relative z-10 flex-1 py-3">
        {activeRoom === 'corridor' ? (
          <>
            <MansionCorridorScene
              movies={visibleMovies}
              chosenCount={chosenRecords.length}
              coupleConfig={coupleConfig}
              reducedMotion={reducedMotion}
              discoveredEggs={discoveredEggs}
              agentTargetMovieId={agentTargetMovieId}
              onClearAgentTarget={() => setAgentTargetMovieId(null)}
              onDiscoverEgg={handleDiscoverEgg}
              onSelectMovie={(m) => setInspectedMovie(m)}
              onDirectConfirmMovie={(m) => handleConfirmMovieChoice(m)}
              onRemoveMovieFromWall={handleRemoveMovieFromWall}
              onEnterChosenHall={() => setActiveRoom('chosen_hall')}
              onOpenButlerAgent={() => setIsButlerOpen(true)}
            />

            {showGridBelow && (
              <section className="max-w-6xl mx-auto px-3 sm:px-6 pt-4 pb-12 animate-fadeIn">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-amber-950 pb-3">
                  <h3 className="font-gothic text-xl sm:text-2xl text-white">
                    Todos os Filmes em Cartaz ({visibleMovies.length})
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {availableTags.map((tag) => {
                      const active = selectedTag === tag;
                      return (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className={`px-2.5 py-0.5 font-vt text-sm border transition cursor-pointer ${
                            active
                              ? 'bg-[#420a14] border-red-500 text-white'
                              : 'bg-[#0b070d] border-[#260f16] text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {tag === 'TODOS' ? 'TODOS' : `#${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      reducedMotion={reducedMotion}
                      onSelectMovie={(m) => setInspectedMovie(m)}
                      onHoverScare={() => {}}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <ChosenHallScene
            chosenRecords={chosenRecords}
            coupleConfig={coupleConfig}
            reducedMotion={reducedMotion}
            onBackToCorridor={() => setActiveRoom('corridor')}
            onInspectMovie={(m) => setInspectedMovie(m)}
            onRemoveRecord={handleRemoveChosenRecord}
          />
        )}
      </main>

      {/* Footer with Subtle Secret Curator Keyhole for Caldas */}
      <footer className="relative z-10 border-t border-[#240a10] bg-[#040305] py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-2 font-pixel text-[8px] sm:text-[9px] text-red-500/80 tracking-widest uppercase">
            <Heart className="w-3 h-3 fill-red-600 text-red-500" />
            <span>
              PARA {coupleConfig.her.name.toUpperCase()} ({coupleConfig.her.nickname.toUpperCase()}) • COM AMOR, {coupleConfig.him.name.toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setIsMovieEditorOpen(true)}
            className="opacity-35 hover:opacity-100 transition-opacity flex items-center gap-1 text-amber-500/80 font-vt text-xs cursor-pointer"
            title="Atalho do Caldas: Escolher / Auto-Preencher Filmes (Ctrl + M)"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Curadoria (Ctrl+M)</span>
          </button>
        </div>
      </footer>

      {/* MOVIE PAINTING INSPECTION MODAL */}
      <MovieDetailModal
        movie={inspectedMovie}
        onClose={() => setInspectedMovie(null)}
        onConfirmChoice={(movie) => handleConfirmMovieChoice(movie)}
      />

      {/* THE 8-STEP TERRIFYING CONFIRMATION RITUAL SEQUENCE */}
      <RitualSequenceModal
        movie={chosenMovieForRitual}
        coupleConfig={coupleConfig}
        reducedMotion={reducedMotion}
        onResetChoice={() => setChosenMovieForRitual(null)}
        onGoToChosenHall={() => {
          setChosenMovieForRitual(null);
          setActiveRoom('chosen_hall');
        }}
      />

      {/* CALDAS'S SECRET AUTO-FILL MOVIE MANAGER (Ctrl + M) */}
      <MovieEditorModal
        isOpen={isMovieEditorOpen}
        movies={movies}
        onSaveMovies={handleSaveMovies}
        onResetMovies={handleResetMovies}
        onClose={() => setIsMovieEditorOpen(false)}
      />

      {/* SECRETS & HIDDEN HORROR CHARACTERS MODAL */}
      <SecretsModal
        isOpen={isSecretsOpen}
        discoveredEggs={discoveredEggs}
        onDiscoverEgg={handleDiscoverEgg}
        onClose={() => setIsSecretsOpen(false)}
      />

      {/* ARTHUR: THE GHOST BUTLER MODAL */}
      <ButlerAgentModal
        isOpen={isButlerOpen}
        movies={movies}
        chosenMovies={chosenRecords}
        onClose={() => setIsButlerOpen(false)}
        onWalkToMovieId={(movieId) => {
          setActiveRoom('corridor');
          setAgentTargetMovieId(movieId);
        }}
        onInspectMovie={(movie) => setInspectedMovie(movie)}
        onConfirmMovie={(movie) => handleConfirmMovieChoice(movie)}
        onAddNewMovieToWall={handleAddNewMovieFromAgent}
        onRemoveMovieFromWall={handleRemoveMovieFromWall}
      />
    </div>
  );
}

export default App;
