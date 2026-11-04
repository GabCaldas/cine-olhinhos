import React, { useState } from 'react';
import { MovieTemplate } from '../types/horror';
import { PosterCanvas } from './PosterCanvas';
import { getMovieStreamingOffers } from '../utils/movieAutoFill';
import { isHorrorMovie } from '../utils/horrorAiAnalyzer';
import { soundEngine } from '../utils/soundEngine';
import { Skull, Activity, Eye, Film, Star, Tv, Heart, Sparkles } from 'lucide-react';

interface MovieCardProps {
  movie: MovieTemplate;
  reducedMotion: boolean;
  onSelectMovie: (movie: MovieTemplate) => void;
  onHoverScare: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onSelectMovie,
  onHoverScare,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const movieIsHorror = isHorrorMovie(movie);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (movieIsHorror) {
      soundEngine.playHeartbeat(0.35);
      if (movie.fearLevel >= 4) {
        onHoverScare();
      }
    } else {
      soundEngine.playFootstep();
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <article
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        soundEngine.playRomanticChime();
        onSelectMovie(movie);
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectMovie(movie);
        }
      }}
      className={`group relative cursor-pointer select-none border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        movieIsHorror
          ? 'bg-[#0a070c] border-[#2b1218] hover:border-red-600/90 shadow-[0_10px_30px_rgba(0,0,0,0.9)]'
          : 'bg-[#090d1a] border-amber-700/60 hover:border-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.9)]'
      }`}
    >
      {/* Top Spine Label */}
      <div
        className={`relative z-10 flex items-center justify-between px-3 py-1.5 border-b font-vt text-xs tracking-widest ${
          movieIsHorror
            ? 'bg-[#13090e] border-[#2e1118] text-red-400'
            : 'bg-[#111930] border-amber-700/50 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5" />
          <span>{movie.tapeNumber}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-[#f5c518] text-black font-bold text-[11px] flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-black text-black" />
            {movie.imdbRating || '7.2'}
          </span>
          <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-200 text-[11px]">
            {movie.year}
          </span>
        </div>
      </div>

      {/* Poster & Dossier Upper Area */}
      <div className="relative grid grid-cols-12 gap-3 p-3.5">
        <div className="col-span-5 relative border border-amber-600/50 bg-black p-1 shadow-inner">
          <PosterCanvas
            artType={movie.posterArt}
            customPosterUrl={movie.customPosterUrl}
            isHovered={isHovered}
            className="w-full aspect-[5/7]"
          />
        </div>

        <div className="col-span-7 flex flex-col justify-between">
          <div>
            <span className="inline-block font-vt text-xs uppercase tracking-widest text-amber-400 mb-0.5">
              {movie.subgenre}
            </span>

            <h3 className="font-gothic text-base sm:text-lg leading-snug text-zinc-100 group-hover:text-amber-300 transition-colors">
              {movie.title}
            </h3>

            {/* Hybrid Meter: Terrômetro (Horror) vs. Cinêmetro VIP (Non-Horror) */}
            {movieIsHorror ? (
              <div className="mt-2.5 p-2 bg-[#060408] border border-[#260e14]">
                <div className="flex items-center justify-between text-[11px] font-vt text-zinc-400 mb-1">
                  <span>TERRÔMETRO IA</span>
                  <span className="flex items-center gap-1 text-red-400">
                    <Activity className="w-3 h-3 animate-pulse" />
                    {movie.bpm} BPM
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <Skull
                      key={lvl}
                      className={`w-3.5 h-3.5 transition-transform ${
                        lvl <= movie.fearLevel
                          ? 'text-red-500 fill-red-950/60 group-hover:scale-110'
                          : 'text-zinc-800'
                      }`}
                    />
                  ))}
                  <span className="ml-auto font-pixel text-[8px] text-red-400/90">
                    {movie.fearLevel}/5
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 p-2 bg-[#0d1428] border border-amber-600/50">
                <div className="flex items-center justify-between text-[11px] font-vt text-amber-200 mb-1">
                  <span>CINÊMETRO VIP</span>
                  <span className="flex items-center gap-1 text-amber-300">
                    <Sparkles className="w-3 h-3" />
                    Sessão Pipoca
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <Heart
                      key={lvl}
                      className="w-3.5 h-3.5 text-rose-500 fill-rose-500 group-hover:scale-110 transition-transform"
                    />
                  ))}
                  <span className="ml-auto font-pixel text-[8px] text-amber-300">
                    5/5
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-2.5">
            {movie.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[11px] font-vt tracking-wider bg-zinc-900 border border-zinc-700 text-zinc-300"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Synopsis Excerpt & Streaming Badges */}
      <div className="px-3.5 pb-3 space-y-2">
        <p className="font-serif-horror text-sm text-zinc-300/90 line-clamp-3 leading-relaxed">
          {movie.synopsis}
        </p>

        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-zinc-800/80">
          <Tv className="w-3 h-3 text-cyan-400 mr-0.5 shrink-0" />
          {getMovieStreamingOffers(movie)
            .slice(0, 2)
            .map((offer, idx) => {
              const isSub = offer.type === 'subscription';
              return (
                <span
                  key={`${offer.platform}-${idx}`}
                  className={`px-1.5 py-0.5 font-vt text-[11px] border ${
                    isSub
                      ? 'bg-emerald-950/45 border-emerald-700/70 text-emerald-200'
                      : 'bg-amber-950/45 border-amber-700/70 text-amber-200'
                  }`}
                >
                  {isSub ? '🟢' : '🟡'} {offer.platform} (
                  {isSub ? 'No Catálogo' : 'Aluguel'})
                </span>
              );
            })}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative z-10 px-3.5 py-2 bg-black/70 border-t border-zinc-800 flex items-center justify-between">
        <span className="font-vt text-xs text-zinc-400 tracking-widest">
          DURAÇÃO: {movie.duration}
        </span>

        <span className="font-vt text-sm text-amber-300 group-hover:text-white flex items-center gap-1 shrink-0 ml-2">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>ABRIR FICHA</span>
        </span>
      </div>
    </article>
  );
};
