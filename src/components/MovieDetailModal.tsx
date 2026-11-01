import React, { useEffect, useMemo } from 'react';
import { MovieTemplate } from '../types/horror';
import { PosterCanvas } from './PosterCanvas';
import { analyzeMovieHorrorAI } from '../utils/horrorAiAnalyzer';
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
  useEffect(() => {
    if (!movie) return;
    soundEngine.playHeartbeat(0.65);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [movie, onClose]);

  const aiAnalysis = useMemo(() => {
    if (!movie) return null;
    if (movie.aiBreakdown && movie.aiVerdict) {
      return {
        fearLevel: movie.fearLevel,
        bpm: movie.bpm,
        aiVerdict: movie.aiVerdict,
        aiBreakdown: movie.aiBreakdown,
      };
    }
    return analyzeMovieHorrorAI({
      title: movie.title,
      originalTitle: movie.originalTitle,
      synopsis: movie.synopsis,
      genre: movie.subgenre,
    });
  }, [movie]);

  if (!movie || !aiAnalysis) return null;

  const breakdownItems = [
    { label: 'Psicológico & Angústia', val: aiAnalysis.aiBreakdown.psychological },
    { label: 'Sobrenatural & Oculto', val: aiAnalysis.aiBreakdown.supernatural },
    { label: 'Tensão & Jump Scares', val: aiAnalysis.aiBreakdown.tension },
    { label: 'Visceral & Ameaça Física', val: aiAnalysis.aiBreakdown.visceral },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#09060b] border-2 border-amber-700/80 shadow-[0_0_90px_rgba(153,27,27,0.55)] overflow-hidden my-auto"
      >
        {/* Top Gallery Frame Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#14070d] border-b border-red-900/70">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span className="font-pixel text-[9px] sm:text-[11px] text-amber-300 tracking-widest uppercase">
              INSPEÇÃO DO QUADRO // {movie.tapeNumber}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white bg-red-950/40 hover:bg-red-900/70 border border-red-800/50 cursor-pointer"
            aria-label="Voltar ao corredor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-7">
          {/* Left Column: Framed Painting Shrine */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="relative border-4 border-[#78552b] bg-black p-2 shadow-[0_0_45px_rgba(0,0,0,0.95)]">
              <PosterCanvas
                artType={movie.posterArt}
                customPosterUrl={movie.customPosterUrl}
                isHovered={true}
                className="w-full aspect-[2/3]"
              />
              <div className="mt-2 flex items-center justify-between px-1 font-vt text-xs text-amber-400/90 tracking-widest">
                <span>GALERIA DA MANSÃO</span>
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  IMDb {movie.imdbRating || '7.2'}/10
                </span>
              </div>
            </div>

            {/* Disturbing Whisper Warning Box */}
            <div className="p-3 bg-[#13060a] border border-red-900/50 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <p className="font-pixel text-[9px] text-red-400 leading-relaxed tracking-wider">
                {movie.curseWhisper}
              </p>
            </div>
          </div>

          {/* Right Column: Full Dossier Details */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-vt tracking-widest text-amber-400/90 uppercase mb-2">
                  {/* Prominent IMDb Rating Badge */}
                  <span className="px-2.5 py-0.5 bg-[#f5c518] text-black font-pixel text-[10px] font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(245,197,24,0.4)]">
                    <Star className="w-3 h-3 fill-black text-black" />
                    IMDb {movie.imdbRating || '7.2'}/10
                  </span>

                  <span>{movie.subgenre}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Calendar className="w-3.5 h-3.5 text-red-500" />
                    {movie.year}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-red-500" />
                    {movie.duration}
                  </span>
                </div>

                <h2 className="font-gothic text-2xl sm:text-4xl text-white glitch-text leading-tight">
                  {movie.title}
                </h2>

                {movie.originalTitle && movie.originalTitle !== movie.title && (
                  <p className="font-vt text-sm text-zinc-400 tracking-wide mt-0.5">
                    Título Original: {movie.originalTitle}
                  </p>
                )}
              </div>

              {/* AI TERRÔMETRO & TELEMETRY BOX */}
              <div className="p-3.5 bg-[#0e070c] border border-[#3d131e] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-950/80 pb-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-pixel text-[9px] text-amber-300 uppercase tracking-wider mb-1">
                      <Cpu className="w-3.5 h-3.5 text-red-500" />
                      <span>TERRÔMETRO DA MANSÃO // NÍVEL DE PAVOR</span>
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

                {/* 4-Axis Horror Breakdown Bars */}
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

                {/* AI Verdict Explanation */}
                <p className="font-vt text-sm text-amber-200/90 leading-snug pt-1 border-t border-red-950/60">
                  {aiAnalysis.aiVerdict}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {movie.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-[#1b0b12] border border-red-900/50 text-red-200 font-vt text-sm tracking-wider"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              <div className="space-y-1.5">
                <h4 className="font-pixel text-[9px] text-zinc-400 uppercase tracking-widest">
                  Sinopse do Quadro:
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

            {/* Bottom Action Buttons: Confirm the Irreversible Ritual */}
            <div className="pt-3 border-t border-[#2b0f16] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-vt text-base tracking-wider uppercase cursor-pointer"
              >
                Continuar Andando pelo Corredor
              </button>

              <button
                onClick={() => onConfirmChoice(movie)}
                className="flex-1 px-6 py-3.5 bg-[#6b0913] hover:bg-[#991b1b] border-2 border-red-500 text-white font-pixel text-[10px] sm:text-xs tracking-[0.16em] uppercase shadow-[0_0_30px_rgba(220,38,38,0.5)] hover:shadow-[0_0_45px_rgba(239,68,68,0.9)] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>ESCOLHER ESTE FILME (SELAR O PACTO)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
