import React, { useState } from 'react';
import { HorrorTag, MovieTemplate } from '../types/horror';
import {
  AutoFillMovieResult,
  autoFillMovieByName,
  persistMoviesEverywhere,
} from '../utils/movieAutoFill';
import {
  X,
  Save,
  RotateCcw,
  Film,
  Check,
  Plus,
  Sparkles,
  Search,
  Loader2,
  Wand2,
} from 'lucide-react';

interface MovieEditorModalProps {
  isOpen: boolean;
  movies: MovieTemplate[];
  initialSelectedMovie?: MovieTemplate | null;
  onSaveMovies: (updated: MovieTemplate[]) => void;
  onResetMovies: () => void;
  onClose: () => void;
}

const ALL_TAGS: HorrorTag[] = [
  'Sobrenatural',
  'Psicológico',
  'Slasher',
  'Found Footage',
  'Religioso',
  'Mistério',
  'Paranormal',
  'Folk Horror',
  'Gótico',
];

export const MovieEditorModal: React.FC<MovieEditorModalProps> = ({
  isOpen,
  movies,
  initialSelectedMovie,
  onSaveMovies,
  onResetMovies,
  onClose,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedMovie?.id || movies[0]?.id || 'movie-slot-1'
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<AutoFillMovieResult[]>([]);
  const [savedDiskStatus, setSavedDiskStatus] = useState<string>('');
  const [batchTitles, setBatchTitles] = useState<string>(() =>
    movies
      .filter((m) => !m.isSecret)
      .map((m) => m.title)
      .join('\n')
  );
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [isBatchLoading, setIsBatchLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentMovie =
    movies.find((m) => m.id === selectedId) || movies[0];

  const handleUpdateCurrent = async (patch: Partial<MovieTemplate>) => {
    const updated = movies.map((m) =>
      m.id === currentMovie.id ? { ...m, ...patch } : m
    );
    onSaveMovies(updated);
    await persistMoviesEverywhere(updated);
  };

  // Auto-fill current slot by searching a movie title!
  const handleAutoFillSearch = async (e?: React.FormEvent, customName?: string) => {
    if (e) e.preventDefault();
    const q = (customName ?? searchQuery ?? currentMovie.title).trim();
    if (!q) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await autoFillMovieByName(q);
      setSearchResults(results);
      if (results.length > 0) {
        // Immediately apply the top match to the current movie slot!
        await applyAutoFillResult(results[0]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const applyAutoFillResult = async (res: AutoFillMovieResult) => {
    await handleUpdateCurrent({
      title: res.title,
      originalTitle: res.originalTitle,
      year: res.year,
      duration: res.duration,
      imdbRating: res.imdbRating,
      subgenre: res.subgenre,
      fearLevel: res.fearLevel,
      bpm: res.bpm,
      aiVerdict: res.aiVerdict,
      aiBreakdown: res.aiBreakdown,
      tags: res.tags,
      synopsis: res.synopsis,
      streamingPlatforms: res.streamingPlatforms,
      customPosterUrl: res.posterUrl,
      curseWhisper: res.curseWhisper,
    });
    setSavedDiskStatus(
      `"${res.title}" preenchido! IMDb ${res.imdbRating}/10 • Terrômetro IA: Nível ${res.fearLevel}/5 (${res.bpm} BPM)`
    );
    setTimeout(() => setSavedDiskStatus(''), 4500);
  };

  // Batch Auto-Fill all movies from a simple list of movie names!
  const handleBatchAutoFillAll = async () => {
    const lines = batchTitles
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setIsBatchLoading(true);
    try {
      const secretMovies = movies.filter((m) => m.isSecret);
      const regularMovies = movies.filter((m) => !m.isSecret);

      const newRegular: MovieTemplate[] = [];
      for (let i = 0; i < lines.length; i++) {
        const movieName = lines[i];
        const existing = regularMovies[i] || {
          id: `movie-slot-${i + 1}`,
          tapeNumber: `QUADRO ${i + 1} // GALERIA`,
          title: movieName,
          year: 2024,
          duration: '1h 50min',
          subgenre: 'Terror Sobrenatural',
          fearLevel: 4 as const,
          bpm: 128,
          tags: ['Sobrenatural', 'Psicológico'] as HorrorTag[],
          synopsis: '',
          whyIChoseIt:
            'Escolhi esse especialmente para assistirmos abraçadinhos no escuro <3',
          curseWhisper: 'NÃO OLHE PARA TRÁS...',
          posterArt: 'silent_fog' as const,
          customPosterUrl: '',
          ritualVariation: 'vhs_ring' as const,
        };

        const hits = await autoFillMovieByName(movieName);
        const best = hits[0];
        if (best) {
          newRegular.push({
            ...existing,
            tapeNumber: `QUADRO ${i + 1} // GALERIA`,
            title: best.title,
            originalTitle: best.originalTitle,
            year: best.year,
            duration: best.duration,
            imdbRating: best.imdbRating,
            subgenre: best.subgenre,
            fearLevel: best.fearLevel,
            bpm: best.bpm,
            aiVerdict: best.aiVerdict,
            aiBreakdown: best.aiBreakdown,
            tags: best.tags,
            synopsis: best.synopsis,
            streamingPlatforms: best.streamingPlatforms,
            customPosterUrl: best.posterUrl,
            curseWhisper: best.curseWhisper,
          });
        } else {
          newRegular.push({ ...existing, title: movieName });
        }
      }

      const finalMovies = [...newRegular, ...secretMovies];
      onSaveMovies(finalMovies);
      await persistMoviesEverywhere(finalMovies);
      setIsBatchMode(false);
      setSavedDiskStatus('Todos os quadros foram preenchidos e salvos no projeto!');
      setTimeout(() => setSavedDiskStatus(''), 4000);
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleToggleTag = (tag: HorrorTag) => {
    const exists = currentMovie.tags.includes(tag);
    const nextTags = exists
      ? currentMovie.tags.filter((t) => t !== tag)
      : [...currentMovie.tags, tag];
    handleUpdateCurrent({
      tags: nextTags.length > 0 ? nextTags : ['Sobrenatural'],
    });
  };

  const handleAddBlankMovie = async () => {
    const regularCount = movies.filter((m) => !m.isSecret).length + 1;
    const newMovie: MovieTemplate = {
      id: `movie-slot-${Date.now()}`,
      tapeNumber: `QUADRO ${regularCount} // GALERIA`,
      title: 'Novo Filme',
      originalTitle: '',
      year: 2024,
      duration: '1h 45min',
      subgenre: 'Terror Sobrenatural',
      fearLevel: 4,
      bpm: 125,
      tags: ['Sobrenatural', 'Psicológico'],
      synopsis: 'Digite o nome do filme no campo de Auto-Fill acima para puxar tudo automaticamente!',
      whyIChoseIt: 'Escolhi esse para assistirmos juntinhos hoje à noite <3',
      curseWhisper: 'ALGUÉM ESTÁ OBSERVANDO ATRÁS DA MOLDURA...',
      posterArt: 'silent_fog',
      customPosterUrl: '',
      ritualVariation: 'vhs_ring',
    };
    const next = [
      ...movies.filter((m) => !m.isSecret),
      newMovie,
      ...movies.filter((m) => m.isSecret),
    ];
    onSaveMovies(next);
    await persistMoviesEverywhere(next);
    setSelectedId(newMovie.id);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/92 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-[#09060b] border-2 border-amber-700/80 shadow-[0_0_90px_rgba(180,83,9,0.4)] overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-[#170e08] border-b border-amber-900/60">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-amber-400" />
            <h2 className="font-pixel text-[10px] sm:text-xs text-amber-200 tracking-wider uppercase">
              PAINEL SECRETO DO CALDAS // AUTO-FILL DE FILMES (CTRL + M)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBatchMode((v) => !v)}
              className={`px-3 py-1 border font-vt text-sm flex items-center gap-1.5 cursor-pointer ${
                isBatchMode
                  ? 'bg-amber-700 border-amber-400 text-white'
                  : 'bg-amber-950/60 border-amber-700/60 text-amber-200 hover:bg-amber-900/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isBatchMode
                  ? 'Voltar para Edição Individual'
                  : 'Modo Lista Rápida (Colar Nomes)'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white bg-amber-950/50 border border-amber-800/50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {savedDiskStatus && (
          <div className="bg-emerald-950/90 border-b border-emerald-600 px-5 py-2 flex items-center gap-2 text-emerald-200 font-vt text-base">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{savedDiskStatus}</span>
          </div>
        )}

        {isBatchMode ? (
          /* BATCH MODE: Paste a list of movie names and auto-fill all paintings at once! */
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="font-pixel text-xs text-amber-300 uppercase">
                Preencher Todos os Quadros Apenas pelos Nomes dos Filmes
              </h3>
              <p className="font-serif-horror text-base text-zinc-300">
                Digite um filme por linha (em português ou inglês). O sistema buscará automaticamente o{' '}
                <strong>Pôster Oficial em Alta Resolução</strong>, <strong>Sinopse</strong>,{' '}
                <strong>Ano</strong>, <strong>Duração</strong> e <strong>Tags</strong> para cada quadro!
              </p>
            </div>

            <textarea
              rows={9}
              value={batchTitles}
              onChange={(e) => setBatchTitles(e.target.value)}
              placeholder={'Hereditário\nA Bruxa\nFale Comigo\nO Chamado\nA Autópsia\nO Iluminado\nInvocação do Mal\nSorria'}
              className="w-full bg-black border-2 border-amber-800/70 p-4 text-lg text-white font-vt tracking-wide"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsBatchMode(false)}
                className="px-4 py-2.5 bg-zinc-900 border border-zinc-700 text-zinc-300 font-vt text-base cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleBatchAutoFillAll}
                disabled={isBatchLoading}
                className="px-6 py-3 bg-amber-700 hover:bg-amber-600 border border-amber-400 text-white font-pixel text-[10px] tracking-widest uppercase flex items-center gap-2 cursor-pointer"
              >
                {isBatchLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Buscando Pôsteres e Sinopses...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Auto-Preencher Todos os Quadros Agora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* INDIVIDUAL SLOT AUTO-FILL & EDITOR */
          <div className="grid grid-cols-1 md:grid-cols-12 max-h-[80vh] overflow-y-auto">
            {/* Left Sidebar: Movie Slots */}
            <div className="md:col-span-4 bg-[#0d080c] border-r border-zinc-800 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-pixel text-[9px] text-zinc-400 uppercase">
                  Quadros da Mansão ({movies.length})
                </span>
                <button
                  onClick={handleAddBlankMovie}
                  className="px-2 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-700/70 text-amber-200 font-vt text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo Quadro</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {movies.map((m, idx) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedId(m.id);
                      setSearchQuery(m.title);
                      setSearchResults([]);
                    }}
                    className={`w-full text-left px-3 py-2 border transition flex items-center gap-2.5 cursor-pointer ${
                      m.id === currentMovie.id
                        ? 'bg-[#260d14] border-amber-500 text-white'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {m.customPosterUrl ? (
                      <img
                        src={m.customPosterUrl}
                        alt={m.title}
                        className="w-8 h-11 object-cover border border-zinc-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-11 bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <Film className="w-3.5 h-3.5 text-zinc-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-vt text-xs text-amber-400 truncate">
                        Quadro {idx + 1} • {m.year}
                      </div>
                      <div className="font-serif-horror font-bold text-sm truncate">
                        {m.title}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-800">
                <button
                  onClick={onResetMovies}
                  className="w-full px-3 py-1.5 bg-zinc-950 hover:bg-red-950/40 border border-zinc-800 text-zinc-400 font-vt text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Lista Padrão</span>
                </button>
              </div>
            </div>

            {/* Right Form: Smart Auto-Fill Bar + Fields */}
            <div className="md:col-span-8 p-5 space-y-4">
              {/* MAGIC AUTO-FILL SEARCH BOX */}
              <form
                onSubmit={(e) => handleAutoFillSearch(e)}
                className="p-3.5 bg-[#1a0f07] border-2 border-amber-600/80 space-y-2.5 shadow-[0_0_25px_rgba(217,119,6,0.2)]"
              >
                <div className="flex items-center gap-2 font-pixel text-[9px] text-amber-300 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Auto-Fill Inteligente: Digite o Nome do Filme para puxar Pôster, Sinopse e Ano
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ex: Longlegs, A Entidade, Rec, Midsommar, Corra, Nosferatu..."
                    className="flex-1 bg-black border border-amber-700/80 px-3 py-2 text-base text-white font-vt"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-600 border border-amber-400 text-white font-pixel text-[9px] uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Auto-Preencher</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Alternative Search Matches if multiple movies share a name */}
                {searchResults.length > 1 && (
                  <div className="pt-2 border-t border-amber-900/50 space-y-1.5">
                    <span className="font-vt text-xs text-amber-200/80 block">
                      Outros resultados encontrados (clique para aplicar):
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {searchResults.map((r, i) => (
                        <button
                          key={`${r.title}-${r.year}-${i}`}
                          type="button"
                          onClick={() => applyAutoFillResult(r)}
                          className="flex items-center gap-2 p-1.5 bg-black/80 hover:bg-amber-950/60 border border-amber-800/60 text-left shrink-0 cursor-pointer"
                        >
                          {r.posterUrl && (
                            <img
                              src={r.posterUrl}
                              alt={r.title}
                              className="w-7 h-10 object-cover"
                            />
                          )}
                          <div>
                            <div className="font-vt text-xs text-white font-bold">
                              {r.title} ({r.year})
                            </div>
                            <div className="font-vt text-[11px] text-amber-400">
                              {r.source}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </form>

              {/* Current Movie Preview & Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                <div className="sm:col-span-3 flex flex-col items-center">
                  <div className="w-28 aspect-[2/3] border-2 border-amber-700 bg-black overflow-hidden shadow-lg">
                    {currentMovie.customPosterUrl ? (
                      <img
                        src={currentMovie.customPosterUrl}
                        alt={currentMovie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-center p-2 font-vt text-xs text-zinc-500">
                        Sem Pôster Externo (Usando Pixel Art)
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-9 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className="font-vt text-sm text-zinc-300">Título no Quadro:</span>
                      <input
                        type="text"
                        value={currentMovie.title}
                        onChange={(e) => handleUpdateCurrent({ title: e.target.value })}
                        className="mt-1 w-full bg-black border border-zinc-700 px-3 py-1.5 text-sm text-white font-serif-horror"
                      />
                    </label>

                    <label className="block">
                      <span className="font-vt text-sm text-zinc-300">Subgênero:</span>
                      <input
                        type="text"
                        value={currentMovie.subgenre}
                        onChange={(e) => handleUpdateCurrent({ subgenre: e.target.value })}
                        className="mt-1 w-full bg-black border border-zinc-700 px-3 py-1.5 text-sm text-amber-300 font-vt"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <label className="block">
                      <span className="font-vt text-sm text-zinc-300">Ano:</span>
                      <input
                        type="number"
                        value={currentMovie.year}
                        onChange={(e) =>
                          handleUpdateCurrent({
                            year: parseInt(e.target.value, 10) || 2024,
                          })
                        }
                        className="mt-1 w-full bg-black border border-zinc-700 px-3 py-1.5 text-sm text-white font-vt"
                      />
                    </label>

                    <label className="block">
                      <span className="font-vt text-sm text-amber-300">IMDb (0-10):</span>
                      <input
                        type="text"
                        value={currentMovie.imdbRating || '7.2'}
                        onChange={(e) =>
                          handleUpdateCurrent({ imdbRating: e.target.value })
                        }
                        className="mt-1 w-full bg-black border border-amber-700 px-3 py-1.5 text-sm text-amber-300 font-vt font-bold"
                      />
                    </label>

                    <label className="block">
                      <span className="font-vt text-sm text-zinc-300">Duração:</span>
                      <input
                        type="text"
                        value={currentMovie.duration}
                        onChange={(e) => handleUpdateCurrent({ duration: e.target.value })}
                        className="mt-1 w-full bg-black border border-zinc-700 px-3 py-1.5 text-sm text-white font-vt"
                      />
                    </label>

                    <label className="block">
                      <span className="font-vt text-sm text-zinc-300">Medo (1-5):</span>
                      <select
                        value={currentMovie.fearLevel}
                        onChange={(e) =>
                          handleUpdateCurrent({
                            fearLevel: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5,
                            bpm: 90 + parseInt(e.target.value, 10) * 12,
                          })
                        }
                        className="mt-1 w-full bg-black border border-zinc-700 px-3 py-1.5 text-sm text-white font-vt"
                      >
                        <option value={1}>1 - Leve</option>
                        <option value={2}>2 - Tensão</option>
                        <option value={3}>3 - Assustador</option>
                        <option value={4}>4 - Intenso</option>
                        <option value={5}>5 - Pavor Absoluto</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="font-vt text-sm text-zinc-300">
                      URL do Pôster (preenchido pelo Auto-Fill):
                    </span>
                    <input
                      type="text"
                      value={currentMovie.customPosterUrl || ''}
                      onChange={(e) =>
                        handleUpdateCurrent({ customPosterUrl: e.target.value })
                      }
                      className="mt-1 w-full bg-black border border-zinc-700 px-3 py-1 text-xs text-zinc-300 font-vt"
                    />
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div>
                <span className="font-vt text-sm text-zinc-300 block mb-1">Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {ALL_TAGS.map((tag) => {
                    const active = currentMovie.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-0.5 font-vt text-xs border transition cursor-pointer ${
                          active
                            ? 'bg-red-900/70 border-red-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="font-vt text-sm text-zinc-300">
                  Sinopse (preenchida pelo Auto-Fill):
                </span>
                <textarea
                  rows={3}
                  value={currentMovie.synopsis}
                  onChange={(e) => handleUpdateCurrent({ synopsis: e.target.value })}
                  className="mt-1 w-full bg-black border border-zinc-700 px-3 py-2 text-sm text-zinc-200 font-serif-horror"
                />
              </label>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-amber-800 hover:bg-amber-700 border border-amber-500 text-white font-pixel text-[10px] tracking-widest uppercase flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar &amp; Voltar à Mansão</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
