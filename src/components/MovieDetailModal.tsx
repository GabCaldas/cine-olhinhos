import React, { useEffect, useMemo } from 'react';
import { MovieTemplate } from '../types/horror';
import { PosterCanvas } from './PosterCanvas';
import { analyzeMovieHorrorAI, isHorrorMovie } from '../utils/horrorAiAnalyzer';
import { getMovieStreamingOffers } from '../utils/movieAutoFill';
import { soundEngine } from '../utils/soundEngine';
import {
  X,
  Skull,
  Flame,
  Clock,
  Calendar,
  Activity,
  AlertTriangle,
  Cpu,
  Star,
  Tv,
  Film,
  Sparkles,
  Heart,
} from 'lucide-react';

interface MovieDetailModalProps {
  movie: MovieTemplate | null;
  onClose: () => void;
  onConfirmChoice: (movie: MovieTemplate) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onConfirmChoice,
}) => {
  const movieIsHorror = useMemo(() => (movie ? isHorrorMovie(movie) : false), [movie]);

  useEffect(() => {
    if (!movie) return;
    if (movieIsHorror) {
      soundEngine.playHeartbeat(0.65);
    } else {
      soundEngine.playRomanticChime();
    }

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movie, movieIsHorror, onClose]);

  const aiAnalysis = useMemo(() => {
    if (!movie) return null;
    const computed = analyzeMovieHorrorAI({
      title: movie.title,
      originalTitle: movie.originalTitle,
      synopsis: movie.synopsis,
      genre: movieIsHorror ? movie.subgenre : '',
    });
    if (movie.aiBreakdown && movie.aiVerdict && movieIsHorror) {
      return {
        fearLevel: movie.fearLevel,
        bpm: movie.bpm,
        subgenre: movie.subgenre,
        tags: movie.tags,
        aiVerdict: movie.aiVerdict,
        aiBreakdown: movie.aiBreakdown,
      };
    }
    return computed;
  }, [movie, movieIsHorror]);

  if (!movie || !aiAnalysis) return null;

  const breakdownItems = movieIsHorror
    ? [
        { label: 'Psicológico & Angústia', val: aiAnalysis.aiBreakdown.psychological },
        { label: 'Sobrenatural & Oculto', val: aiAnalysis.aiBreakdown.supernatural },
        { label: 'Tensão & Jump Scares', val: aiAnalysis.aiBreakdown.tension },
        { label: 'Visceral & Ameaça Física', val: aiAnalysis.aiBreakdown.visceral },
      ]
    : [
        { label: 'Emoção & Coração', val: aiAnalysis.aiBreakdown.psychological },
        { label: 'Carisma & Humor', val: aiAnalysis.aiBreakdown.supernatural },
        { label: 'Direção & Visual', val: aiAnalysis.aiBreakdown.tension },
        { label: 'Ritmo & Trilha Sonora', val: aiAnalysis.aiBreakdown.visceral },
      ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-4xl border-2 overflow-hidden my-auto ${
          movieIsHorror
            ? 'bg-[#09060b] border-red-800/80 shadow-[0_0_90px_rgba(153,27,27,0.55)]'
            : 'bg-[#090d1a] border-amber-500/85 shadow-[0_0_90px_rgba(245,158,11,0.35)]'
        }`}
      >
        {/* Top Frame Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 border-b ${
            movieIsHorror
              ? 'bg-[#14070d] border-red-900/70'
              : 'bg-[#111930] border-amber-600/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full animate-ping ${
                movieIsHorror ? 'bg-red-600' : 'bg-amber-400'
              }`}
            />
            <span className="font-pixel text-[9px] sm:text-[11px] text-amber-300 tracking-widest uppercase">
              {movieIsHorror
                ? `DOSSIÊ DE TERROR // ${movie.tapeNumber}`
                : `CARTAZ EM EXIBIÇÃO // ${movie.tapeNumber}`}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-red-900/70 border border-zinc-700 cursor-pointer"
            aria-label="Voltar à galeria"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-7">
          {/* Left Column: Framed Poster */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="relative border-4 border-amber-600/80 bg-black p-2 shadow-[0_0_45px_rgba(0,0,0,0.95)]">
              <PosterCanvas
                artType={movie.posterArt}
                customPosterUrl={movie.customPosterUrl}
                isHovered={true}
                className="w-full aspect-[2/3]"
              />
              <div className="mt-2 flex items-center justify-between px-1 font-vt text-xs text-amber-400/90 tracking-widest">
                <span>GRAND CINE OLHINHOS</span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  IMDb {movie.imdbRating || '7.2'}/10
                </span>
              </div>
            </div>

            {/* Bottom Note Box (Horror Whisper vs. Cinema Highlight) */}
            {movieIsHorror ? (
              <div className="p-3 bg-[#13060a] border border-red-900/50 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                <p className="font-pixel text-[9px] text-red-400 leading-relaxed tracking-wider">
                  {movie.curseWhisper}
                </p>
              </div>
            ) : (
              <div className="p-3 bg-[#11192e] border border-amber-500/50 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="font-pixel text-[9px] text-amber-200 leading-relaxed tracking-wider">
                  SESSÃO VIP • PIPOCA QUENTINHA PARA ANINHA &amp; CALDAS!
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Full Movie Details */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-vt tracking-widest text-amber-400/90 uppercase mb-2">
                  {/* Prominent IMDb Rating Badge */}
                  <span className="px-2.5 py-0.5 bg-[#f5c518] text-black font-pixel text-[10px] font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(245,197,24,0.4)]">
                    <Star className="w-3 h-3 fill-black text-black" />
                    IMDb {movie.imdbRating || '7.2'}/10
                  </span>

                  <span>{movieIsHorror ? movie.subgenre : aiAnalysis.subgenre || movie.subgenre}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    {movie.year}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {movie.duration}
                  </span>
                </div>

                <h2 className="font-gothic text-2xl sm:text-4xl text-white leading-tight">
                  {movie.title}
                </h2>

                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <p className="font-vt text-sm text-zinc-400 tracking-wide mt-0.5">
                    Título Original: {movie.originalTitle}
                  </p>
                )}
              </div>

              {/* HYBRID AI METER: TERRÔMETRO (FOR HORROR) VS. CINÊMETRO VIP (FOR NON-HORROR) */}
              {movieIsHorror ? (
                <div className="p-3.5 bg-[#0e070c] border border-[#3d131e] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-950/80 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-pixel text-[9px] text-amber-300 uppercase tracking-wider mb-1">
                        <Cpu className="w-3.5 h-3.5 text-red-500" />
                        <span>TERRÔMETRO IA // NÍVEL DE PAVOR</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <Skull
                            key={lvl}
                            className={`w-4 h-4 ${
                              lvl <= movie.fearLevel
                                ? 'text-red-500 fill-red-950 animate-pulse'
                                : 'text-zinc-800'
                            }`}
                          />
                        ))}
                        <span className="font-vt text-sm text-red-300 ml-1">
                          Nível {movie.fearLevel}/5
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-vt text-xs text-zinc-400 uppercase">Pico Cardíaco</div>
                      <div className="font-pixel text-xs text-red-500 flex items-center justify-end gap-1.5 mt-0.5">
                        <Activity className="w-4 h-4 animate-bounce" />
                        <span>{movie.bpm} BPM</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {breakdownItems.map((item) => (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex justify-between font-vt text-xs text-zinc-300">
                          <span>{item.label}</span>
                          <span className="text-red-400">{item.val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-red-900 via-red-600 to-amber-500"
                            style={{ width: `${item.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="font-vt text-sm text-amber-200/90 leading-snug pt-1 border-t border-red-950/60">
                    {aiAnalysis.aiVerdict}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-[#0e1529] border border-amber-500/60 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-900/60 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-pixel text-[9px] text-amber-300 uppercase tracking-wider mb-1">
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                        <span>CINÊMETRO VIP // VIBE &amp; ENCANTO</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <Heart
                            key={lvl}
                            className={`w-4 h-4 ${
                              lvl <= 5
                                ? 'text-rose-500 fill-rose-500'
                                : 'text-zinc-700'
                            }`}
                          />
                        ))}
                        <span className="font-vt text-sm text-amber-200 ml-1">
                          Sintonia Máxima para o Casal ★
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-vt text-xs text-zinc-400 uppercase">Clima da Sessão</div>
                      <div className="font-pixel text-[10px] text-amber-300 flex items-center justify-end gap-1.5 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>PIPOCA &amp; COBERTOR</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {breakdownItems.map((item) => (
                      <div key={item.label} className="space-y-0.5">
                        <div className="flex justify-between font-vt text-xs text-zinc-200">
                          <span>{item.label}</span>
                          <span className="text-amber-300">{item.val}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-cyan-400"
                            style={{ width: `${item.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="font-vt text-sm text-amber-100 leading-snug pt-1 border-t border-amber-900/50">
                    {aiAnalysis.aiVerdict}
                  </p>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {(movieIsHorror ? movie.tags : aiAnalysis.tags || movie.tags).map((tag) => (
                  <span
                    key={tag}
                    className={`px-2.5 py-0.5 border font-vt text-sm tracking-wider ${
                      movieIsHorror
                        ? 'bg-[#1b0b12] border-red-900/50 text-red-200'
                        : 'bg-[#131d36] border-amber-600/50 text-amber-200'
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5">
                <h4 className="font-pixel text-[9px] text-zinc-400 uppercase tracking-widest">
                  Sinopse do Filme:
                </h4>
                <p className="font-serif-horror text-base sm:text-lg text-zinc-200 leading-relaxed">
                  {movie.synopsis}
                </p>
              </div>

              {/* Streaming & Rental Availability in Brazil */}
              <div className="p-3.5 bg-[#0a0d14] border border-cyan-900/60 space-y-2.5">
                <div className="flex items-center justify-between gap-2 border-b border-cyan-950/80 pb-1.5">
                  <div className="flex items-center gap-1.5 font-pixel text-[9px] text-cyan-300 uppercase tracking-wider">
                    <Tv className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Onde Assistir no Brasil (Catálogo vs. Aluguel):</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getMovieStreamingOffers(movie).map((offer, idx) => {
                    const isSub = offer.type === 'subscription';
                    return (
                      <div
                        key={`${offer.platform}-${idx}`}
                        className={`px-3 py-2 border flex flex-col justify-between ${
                          isSub
                            ? 'bg-emerald-950/35 border-emerald-600/70 text-emerald-100'
                            : 'bg-amber-950/35 border-amber-600/70 text-amber-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-vt text-base font-bold tracking-wide">
                            {offer.platform}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 font-pixel text-[7px] uppercase tracking-wider border ${
                              isSub
                                ? 'bg-emerald-900/80 border-emerald-400 text-emerald-100'
                                : 'bg-amber-900/80 border-amber-400 text-amber-100'
                            }`}
                          >
                            {isSub ? '🟢 NO CATÁLOGO' : '🟡 POR ALUGUEL'}
                          </span>
                        </div>
                        <span className="font-vt text-xs opacity-90 mt-0.5">
                          {isSub
                            ? `Incluso na assinatura (${offer.priceInfo || 'Catálogo ativo'})`
                            : `Apenas Aluguel / Compra (${offer.priceInfo || 'VOD Digital'})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-vt text-base tracking-wider uppercase cursor-pointer"
              >
                Voltar à Galeria
              </button>

              <button
                onClick={() => onConfirmChoice(movie)}
                className={`flex-1 px-6 py-3.5 border-2 text-white font-pixel text-[10px] sm:text-xs tracking-[0.16em] uppercase transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                  movieIsHorror
                    ? 'bg-[#6b0913] hover:bg-[#991b1b] border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_45px_rgba(239,68,68,0.9)]'
                    : 'bg-amber-700 hover:bg-amber-600 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_45px_rgba(251,191,36,0.9)]'
                }`}
              >
                {movieIsHorror ? (
                  <>
                    <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>ESCOLHER ESTE FILME (INICIAR RITUAL)</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4 text-amber-200" />
                    <span>ESCOLHER ESTE FILME (INICIAR SESSÃO)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
