import React, { useState } from 'react';
import { MovieTemplate } from '../types/horror';
import { PosterCanvas } from './PosterCanvas';
import { getMovieStreamingOffers } from '../utils/movieAutoFill';
import { soundEngine } from '../utils/soundEngine';
import { Skull, Activity, Eye, Film, Star, Tv } from 'lucide-react';

interface MovieCardProps {
  movie: MovieTemplate;
  reducedMotion: boolean;
  onSelectMovie: (movie: MovieTemplate) => void;
  onHoverScare: () => void;
}

const GLITCH_CHARS = ['†', '‡', '¥', '§', 'Ø', '∆', '¶', '#'];

function corruptTitleOnHover(text: string, active: boolean, tick: number): string {
  if (!active || tick % 3 !== 0) return text;
  const chars = text.split('');
  const idx = (tick * 7) % chars.length;
  if (chars[idx] !== ' ') {
    chars[idx] = GLITCH_CHARS[tick % GLITCH_CHARS.length];
  }
  return chars.join('');
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  reducedMotion,
  onSelectMovie,
  onHoverScare,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [glitchTick, setGlitchTick] = useState(0);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setGlitchTick((t) => t + 1);
    soundEngine.playHeartbeat(0.4);
    soundEngine.playVhsStatic(0.09, 0.08);
    if (movie.fearLevel >= 4) {
      onHoverScare();
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
        soundEngine.playVhsStatic(0.18, 0.16);
        onSelectMovie(movie);
      }}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectMovie(movie);
        }
      }}
      className={`group relative cursor-pointer select-none bg-[#0a070c] border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden ${
        !reducedMotion ? 'hover-tremor' : ''
      } ${
        movie.isSecret
          ? 'border-red-600/80 shadow-[0_0_25px_rgba(220,38,38,0.28)]'
          : 'border-[#2b1218] hover:border-red-700/90 shadow-[0_10px_30px_rgba(0,0,0,0.9)] hover:shadow-[0_0_35px_rgba(153,27,27,0.4)]'
      }`}
    >
      {/* Top VHS Spine Label */}
      <div className="relative z-10 flex items-center justify-between px-3 py-1.5 bg-[#13090e] border-b border-[#2e1118] font-vt text-xs tracking-widest">
        <div className="flex items-center gap-1.5 text-red-400">
          <Film className="w-3.5 h-3.5 text-red-500" />
          <span>{movie.tapeNumber}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-[#f5c518] text-black font-bold text-[11px] flex items-center gap-0.5">
            <Star className="w-2.5 h-2.5 fill-black text-black" />
            {movie.imdbRating || '7.2'}
          </span>
          <span className="px-1.5 py-0.5 bg-red-950/70 border border-red-800/50 text-red-200 text-[11px]">
            {movie.year}
          </span>
        </div>
      </div>

      {/* Poster & Dossier Upper Area */}
      <div className="relative grid grid-cols-12 gap-3 p-3.5">
        <div className="col-span-5 relative border border-[#3a161e] bg-black p-1 shadow-inner">
          <PosterCanvas
            artType={movie.posterArt}
            customPosterUrl={movie.customPosterUrl}
            isHovered={isHovered}
            className="w-full aspect-[5/7]"
          />
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-10 h-2.5 bg-amber-100/15 border border-amber-200/10 rotate-[-3deg]" />
        </div>

        <div className="col-span-7 flex flex-col justify-between">
          <div>
            <span className="inline-block font-vt text-xs uppercase tracking-widest text-amber-500/85 mb-0.5">
              {movie.subgenre}
            </span>

            <h3
              className={`font-gothic text-base sm:text-lg leading-snug text-zinc-100 group-hover:text-red-400 transition-colors ${
                isHovered && !reducedMotion ? 'glitch-text' : ''
              }`}
            >
              {corruptTitleOnHover(movie.title, isHovered && !reducedMotion, glitchTick)}
            </h3>

            {/* Creative Fear Level: Cursed Skulls + Heartbeat BPM */}
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
          </div>

          <div className="flex flex-wrap gap-1 mt-2.5">
            {movie.tags.map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[11px] font-vt tracking-wider bg-[#160b11] border border-[#33131d] text-zinc-300"
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

        <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[#220c12]">
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
      <div className="relative z-10 px-3.5 py-2 bg-[#060408] border-t border-[#260d13] flex items-center justify-between">
        {isHovered ? (
          <span className="font-pixel text-[8px] text-red-500 tracking-wider animate-pulse truncate">
            ⚠ {movie.curseWhisper}
          </span>
        ) : (
          <span className="font-vt text-xs text-zinc-500 tracking-widest">
            DURAÇÃO: {movie.duration}
          </span>
        )}

        <span className="font-vt text-sm text-red-300 group-hover:text-white flex items-center gap-1 shrink-0 ml-2">
          <Eye className="w-3.5 h-3.5 text-red-500" />
          <span>EXAMINAR</span>
        </span>
      </div>

      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 shadow-[inset_0_0_55px_rgba(153,27,27,0.35)] ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </article>
  );
};
