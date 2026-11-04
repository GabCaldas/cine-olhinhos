import React, { useEffect, useRef, useState } from 'react';
import {
  ChosenMovieRecord,
  MovieTemplate,
} from '../types/horror';
import {
  askButlerAgent,
  ChatTurn,
  matchWallMovie,
} from '../utils/butlerAgent';
import { autoFillMovieByName } from '../utils/movieAutoFill';
import { renderButlerPortraitCanvas } from '../utils/pixelSprites';
import { soundEngine } from '../utils/soundEngine';
import {
  X,
  Send,
  Sparkles,
  PlusCircle,
  Trash2,
  Frame,
  Loader2,
  Plus,
  Eye,
  Footprints,
  Flame,
} from 'lucide-react';

interface ButlerAgentModalProps {
  isOpen: boolean;
  movies: MovieTemplate[];
  chosenMovies: ChosenMovieRecord[];
  onClose: () => void;
  onWalkToMovieId: (movieId: string) => void;
  onInspectMovie: (movie: MovieTemplate) => void;
  onConfirmMovie: (movie: MovieTemplate) => void;
  onAddNewMovieToWall: (newMovie: MovieTemplate) => void;
  onRemoveMovieFromWall: (movieId: string) => void;
}

export const ButlerAgentModal: React.FC<ButlerAgentModalProps> = ({
  isOpen,
  movies,
  chosenMovies,
  onClose,
  onWalkToMovieId,
  onInspectMovie,
  onConfirmMovie,
  onAddNewMovieToWall,
  onRemoveMovieFromWall,
}) => {
  const portraitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [history, setHistory] = useState<ChatTurn[]>([
    {
      role: 'assistant',
      content:
        'Luzes, câmera, ação! Que alegria ter sangue correndo nas veias de novo! Bem-vindos ao Grand Cine Olhinhos, Caldas e Aninha! Sou George, agora bem vivo como o Concierge e Curador Cinéfilo particular de vocês. Podem me perguntar onde assistir qualquer filme nos streamings, pedir recomendações de qualquer gênero ou mandar colocar e tirar cartazes da nossa galeria!',
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [quickAddTitle, setQuickAddTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [addingMovieTitle, setAddingMovieTitle] = useState<string | null>(null);
  const [showWallManager, setShowWallManager] = useState<boolean>(false);

  // Live RPG Typewriter & Lip-Sync Talking state for the latest assistant message
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number>(0);
  const [typedCharCount, setTypedCharCount] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(true);
  const isSpeakingRef = useRef<boolean>(true);
  isSpeakingRef.current = isSpeaking;
  const isLoadingRef = useRef<boolean>(false);
  isLoadingRef.current = isLoading;

  const publicMovies = movies.filter((m) => !m.isSecret);

  // Trigger typewriter speech animation whenever a new assistant message is added or modal opens
  useEffect(() => {
    if (!isOpen) return;
    const lastIdx = history.length - 1;
    const lastTurn = history[lastIdx];
    if (!lastTurn || lastTurn.role !== 'assistant') {
      setIsSpeaking(false);
      return;
    }

    setSpeakingMsgIdx(lastIdx);
    setTypedCharCount(0);
    setIsSpeaking(true);

    const fullLen = lastTurn.content.length;
    let current = 0;

    const interval = setInterval(() => {
      current += 3;
      if (current >= fullLen) {
        setTypedCharCount(fullLen);
        setIsSpeaking(false);
        clearInterval(interval);
      } else {
        setTypedCharCount(current);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [history, isOpen]);

  // Animate pixel butler portrait stage at 60 FPS with live talking & thinking animations!
  useEffect(() => {
    if (!isOpen) return;
    let animId: number;
    let frame = 0;

    const loop = () => {
      frame++;
      if (portraitCanvasRef.current) {
        renderButlerPortraitCanvas(
          portraitCanvasRef.current,
          frame,
          isSpeakingRef.current,
          isLoadingRef.current
        );
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading, typedCharCount]);

  if (!isOpen) return null;

  const createAndHangMovieByTitle = async (rawTitle: string): Promise<MovieTemplate | null> => {
    const query = rawTitle.trim();
    if (!query) return null;
    setAddingMovieTitle(query);
    try {
      const results = await autoFillMovieByName(query);
      const best = results.find((r) => r.posterUrl) || results[0];
      if (!best) return null;

      const count = movies.filter((m) => !m.isSecret).length;
      const newMovie: MovieTemplate = {
        id: `movie-agent-${Date.now()}`,
        tapeNumber: `EM CARTAZ #${count + 1} // CINE OLHINHOS`,
        title: best.title,
        originalTitle: best.originalTitle,
        year: best.year,
        duration: best.duration,
        imdbRating: best.imdbRating || '7.2',
        isHorror: best.isHorror,
        subgenre: best.subgenre,
        fearLevel: best.fearLevel,
        bpm: best.bpm,
        aiVerdict: best.aiVerdict,
        aiBreakdown: best.aiBreakdown,
        tags: best.tags,
        synopsis: best.synopsis,
        streamingPlatforms: best.streamingPlatforms,
        curseWhisper: best.curseWhisper,
        posterArt: 'mansion_corridor',
        customPosterUrl: best.posterUrl,
        ritualVariation: 'vhs_ring',
      };

      onAddNewMovieToWall(newMovie);
      soundEngine.playRomanticChime();
      return newMovie;
    } finally {
      setAddingMovieTitle(null);
    }
  };

  const handleConfirmHangSuggestedMovie = async (movieTitle: string) => {
    const created = await createAndHangMovieByTitle(movieTitle);
    if (created) {
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Como ordenaram! Acabei de buscar "${created.title}" (${created.year}) e pendurei a moldura dele na parede do corredor para vocês.`,
          actionSummary: `🖼️ Quadro adicionado por escolha de vocês: "${created.title}" (IMDb ★ ${created.imdbRating}/10)`,
        },
      ]);
    }
  };

  const handleConfirmRemoveMovie = (movie: MovieTemplate) => {
    onRemoveMovieFromWall(movie.id);
    soundEngine.playDoorCreak();
    setHistory((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `Prontinho! Retirei o quadro "${movie.title}" da parede do corredor e guardei no porão empoeirado da mansão.`,
        actionSummary: `🗑️ Quadro removido da parede: "${movie.title}"`,
      },
    ]);
  };

  const findMovieOnWall = (idOrQuery?: string): MovieTemplate | undefined => {
    return matchWallMovie(movies, idOrQuery);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const msg = (textToSend ?? input).trim();
    if (!msg || isLoading) return;

    setInput('');
    setIsSpeaking(false);
    const userTurn: ChatTurn = { role: 'user', content: msg };
    setHistory((prev) => [...prev, userTurn]);
    setIsLoading(true);
    soundEngine.playHeartbeat(0.45);

    try {
      const response = await askButlerAgent({
        userMessage: msg,
        history,
        movies,
        chosenMovies,
      });

      let actionBadge = '';
      const actionRef = response.action?.movieId || response.action?.movieQuery;

      if (response.action?.type === 'WALK_TO_PAINTING' && actionRef) {
        const target = findMovieOnWall(actionRef);
        if (target) {
          onWalkToMovieId(target.id);
          actionBadge = `🕯️ George caminhou com vocês até o quadro "${target.title}" (${target.year})`;
        }
      } else if (response.action?.type === 'INSPECT_PAINTING' && actionRef) {
        const target = findMovieOnWall(actionRef);
        if (target) {
          onWalkToMovieId(target.id);
          actionBadge = `🔍 Inspecionando o quadro "${target.title}"`;
          setTimeout(() => {
            onClose();
            onInspectMovie(target);
          }, 900);
        }
      } else if (response.action?.type === 'START_RITUAL' && actionRef) {
        const target = findMovieOnWall(actionRef);
        if (target) {
          actionBadge = `🔥 Iniciando o Ritual de Escolha com "${target.title}"!`;
          setTimeout(() => {
            onClose();
            onConfirmMovie(target);
          }, 1100);
        }
      } else if (response.action?.type === 'ADD_NEW_MOVIE' && actionRef) {
        const created = await createAndHangMovieByTitle(actionRef);
        if (created) {
          actionBadge = `🖼️ Novo quadro pendurado na parede: "${created.title}" (${created.year} • IMDb ★ ${created.imdbRating}/10)`;
        }
      } else if (response.action?.type === 'REMOVE_MOVIE' && actionRef) {
        const target = findMovieOnWall(actionRef);
        if (target) {
          onRemoveMovieFromWall(target.id);
          soundEngine.playDoorCreak();
          actionBadge = `🗑️ Quadro removido da parede: "${target.title}" (${target.year})`;
        }
      }

      soundEngine.playRomanticChime();
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply,
          actionSummary: actionBadge || undefined,
          proposedToAdd: response.proposedToAdd,
          proposedToRemove: response.proposedToRemove,
        },
      ]);
    } catch {
      setHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Uma rajada de vento apagou minha vela por um segundo... Podem repetir o pedido?',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/88 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#08050b] border-2 border-cyan-800/80 shadow-[0_0_90px_rgba(14,116,144,0.35),0_0_40px_rgba(185,28,28,0.25)] overflow-hidden my-auto flex flex-col max-h-[88vh]"
      >
        {/* Top Header */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 bg-[#0e0814] border-b border-amber-900/60">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-pixel text-[9px] sm:text-xs text-amber-200 tracking-wider uppercase">
              GEORGE // CONCIERGE &amp; CURADOR CINÉFILO
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWallManager((v) => !v)}
              className={`px-2.5 py-1 border font-vt text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer ${
                showWallManager
                  ? 'bg-amber-900/70 border-amber-400 text-amber-100'
                  : 'bg-[#170e24] hover:bg-[#231536] border-amber-700/70 text-amber-200'
              }`}
              title="Controle total: adicionar ou excluir qualquer cartaz da parede"
            >
              <Frame className="w-3.5 h-3.5 text-amber-400" />
              <span>Em Cartaz ({publicMovies.length})</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white bg-red-950/40 hover:bg-red-900/70 border border-red-800/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pinned Animated Live Talking Butler Stage Banner (Compact on mobile, full on desktop!) */}
        <div className="shrink-0 flex items-center gap-3 sm:gap-4 bg-[#0d0814] border-b-2 border-amber-900/70 px-3 sm:px-5 py-2 sm:py-3 shadow-[inset_0_0_30px_rgba(245,158,11,0.12)]">
          <div className="relative shrink-0">
            <canvas
              ref={portraitCanvasRef}
              width={68}
              height={56}
              onClick={() => {
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), 2600);
              }}
              title="Clique no George para vê-lo gesticular com a claquete e falar!"
              className={`w-18 h-15 sm:w-28 sm:h-24 pixelated border-2 bg-black cursor-pointer transition-shadow ${
                isSpeaking
                  ? 'border-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.55)]'
                  : isLoading
                  ? 'border-cyan-400 shadow-[0_0_20px_rgba(56,189,248,0.45)]'
                  : 'border-amber-700/70'
              }`}
            />
            <span
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 sm:px-2 py-0.5 font-pixel text-[6px] sm:text-[7px] uppercase tracking-wider border whitespace-nowrap ${
                isSpeaking
                  ? 'bg-amber-950 border-amber-400 text-amber-200 animate-pulse'
                  : isLoading
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200 animate-pulse'
                  : 'bg-zinc-950 border-zinc-700 text-zinc-400'
              }`}
            >
              {isSpeaking
                ? '🗣️ Falando...'
                : isLoading
                ? '🎬 Curando...'
                : '🍿 À disposição'}
            </span>
          </div>

          <div className="space-y-0.5 sm:space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-gothic text-base sm:text-2xl text-amber-200 truncate">
                George, o Concierge Cinéfilo
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 bg-amber-950/60 border border-amber-700/60 font-vt text-xs text-amber-300">
                Viva a Sétima Arte! 🎬
              </span>
            </div>
            <p className="font-vt text-xs sm:text-sm text-zinc-300 leading-snug line-clamp-2 sm:line-clamp-none">
              Pergunte <strong className="text-amber-200">onde assistir cada filme</strong> nos streamings, peça sugestões de qualquer gênero ou gerencie os <strong className="text-amber-300">{publicMovies.length} cartazes</strong>!
            </p>
          </div>
        </div>

        {/* Collapsible Wall Paintings Manager (100% Total Control: Add or Delete Any Painting, Even All of Them!) */}
        {showWallManager && (
          <div className="shrink-0 bg-[#110a19] border-b border-cyan-800/60 p-3.5 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-pixel text-[9px] text-amber-300 uppercase tracking-wider">
                Controle Total dos Quadros do Corredor ({publicMovies.length})
              </span>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!quickAddTitle.trim() || addingMovieTitle) return;
                  const title = quickAddTitle.trim();
                  setQuickAddTitle('');
                  await handleConfirmHangSuggestedMovie(title);
                }}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  placeholder="Adicionar filme pelo nome..."
                  className="bg-black border border-cyan-800 px-2.5 py-1 text-xs font-vt text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={!quickAddTitle.trim() || Boolean(addingMovieTitle)}
                  className="px-2.5 py-1 bg-emerald-900/80 hover:bg-emerald-800 disabled:opacity-40 border border-emerald-500 text-emerald-100 font-vt text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{addingMovieTitle ? 'Buscando...' : 'Pendurar'}</span>
                </button>
              </form>
            </div>

            {publicMovies.length === 0 ? (
              <div className="font-vt text-sm text-zinc-400 italic py-1">
                Nenhum quadro na parede no momento. Digite o nome de um filme acima ou peça sugestões ao George!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
                {publicMovies.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-black/80 border border-zinc-700/80 text-xs font-vt text-zinc-200"
                  >
                    <button
                      onClick={() => {
                        onWalkToMovieId(m.id);
                        onClose();
                      }}
                      className="hover:text-amber-300 transition cursor-pointer flex items-center gap-1"
                      title="Caminhar até este quadro no corredor"
                    >
                      <Footprints className="w-3 h-3 text-amber-400" />
                      <span>
                        {idx + 1}. {m.title} ({m.year})
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        onWalkToMovieId(m.id);
                        onClose();
                        onInspectMovie(m);
                      }}
                      className="text-cyan-400 hover:text-cyan-200 p-0.5 hover:bg-cyan-950/70 transition cursor-pointer"
                      title={`Abrir detalhes e onde assistir "${m.title}"`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onConfirmMovie(m);
                      }}
                      className="text-amber-400 hover:text-amber-200 p-0.5 hover:bg-amber-950/70 transition cursor-pointer"
                      title={`Escolher "${m.title}" para assistir hoje`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleConfirmRemoveMovie(m)}
                      className="text-red-400 hover:text-red-200 p-0.5 hover:bg-red-950/70 transition cursor-pointer"
                      title={`Excluir "${m.title}" da parede do corredor`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scrollable Chat Messages Area */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-3">
          {history.map((turn, idx) => {
            const isCurrentlyTyping =
              turn.role === 'assistant' && idx === speakingMsgIdx && isSpeaking;
            const displayedText = isCurrentlyTyping
              ? turn.content.slice(0, typedCharCount)
              : turn.content;

            return (
              <div
                key={idx}
                className={`flex flex-col ${
                  turn.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  onClick={() => {
                    if (isCurrentlyTyping) {
                      setTypedCharCount(turn.content.length);
                      setIsSpeaking(false);
                    }
                  }}
                  className={`max-w-[88%] p-3.5 border ${
                    turn.role === 'user'
                      ? 'bg-[#260812] border-red-700/80 text-red-100'
                      : 'bg-[#0e111d] border-cyan-800/70 text-zinc-100'
                  }`}
                >
                  <div className="font-pixel text-[8px] uppercase tracking-wider mb-1.5 opacity-75 flex items-center justify-between gap-2">
                    {turn.role === 'user' ? (
                      <span className="text-red-300">Aninha &amp; Caldas</span>
                    ) : (
                      <span className="text-amber-300">🎬 George (Concierge Cinéfilo)</span>
                    )}
                  </div>
                  <p className="font-serif-horror text-base sm:text-lg leading-relaxed">
                    {displayedText}
                    {isCurrentlyTyping && (
                      <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                    )}
                  </p>

                  {/* Interactive User-Choice Buttons when George suggests adding or removing movies! */}
                  {!isCurrentlyTyping &&
                    ((turn.proposedToAdd && turn.proposedToAdd.length > 0) ||
                      (turn.proposedToRemove && turn.proposedToRemove.length > 0)) && (
                      <div className="mt-3 pt-2.5 border-t border-cyan-900/60 space-y-2">
                        <div className="font-pixel text-[8px] text-amber-300 uppercase tracking-wider">
                          Vocês escolhem o que fazer na parede:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {turn.proposedToAdd?.map((movieTitle) => {
                            const alreadyOnWall = publicMovies.some(
                              (m) =>
                                m.title.toLowerCase() === movieTitle.toLowerCase() ||
                                m.originalTitle?.toLowerCase() === movieTitle.toLowerCase()
                            );
                            return (
                              <button
                                key={movieTitle}
                                disabled={alreadyOnWall || addingMovieTitle === movieTitle}
                                onClick={() => handleConfirmHangSuggestedMovie(movieTitle)}
                                className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 disabled:opacity-45 border border-emerald-500/80 text-emerald-200 font-vt text-sm flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <PlusCircle className="w-4 h-4 text-emerald-400" />
                                <span>
                                  {alreadyOnWall
                                    ? `"${movieTitle}" já está na parede`
                                    : addingMovieTitle === movieTitle
                                    ? `Pendurando "${movieTitle}"...`
                                    : `🖼️ Pendurar "${movieTitle}" na Parede`}
                                </span>
                              </button>
                            );
                          })}

                          {turn.proposedToRemove?.map((targetRef) => {
                            const wallMovie = findMovieOnWall(targetRef);
                            if (!wallMovie) return null;
                            return (
                              <button
                                key={wallMovie.id}
                                onClick={() => handleConfirmRemoveMovie(wallMovie)}
                                className="px-3 py-1.5 bg-red-950/70 hover:bg-red-900/90 border border-red-500/80 text-red-200 font-vt text-sm flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                                <span>🗑️ Excluir "{wallMovie.title}" da Parede</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {turn.actionSummary && (
                    <div className="mt-2.5 pt-2 border-t border-cyan-900/60 font-vt text-sm text-amber-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{turn.actionSummary}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-amber-300 font-vt text-base p-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>George está consultando o catálogo e preparando a claquete...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Clean Input Bar */}
        <div className="shrink-0 p-3.5 sm:p-4 bg-[#0d0814] border-t border-cyan-900/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Converse com George, pergunte onde assistir um filme ou peça sugestões...'
              className="flex-1 bg-black/90 border border-cyan-800/80 focus:border-cyan-400 px-3.5 py-2.5 font-vt text-base text-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-2.5 bg-cyan-800 hover:bg-cyan-700 disabled:opacity-40 border border-cyan-400 text-white font-pixel text-[10px] uppercase tracking-wider flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
