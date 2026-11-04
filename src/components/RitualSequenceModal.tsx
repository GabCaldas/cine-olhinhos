import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CoupleConfig, MovieTemplate } from '../types/horror';
import { PosterCanvas } from './PosterCanvas';
import {
  drawAninhaPixelSprite,
  drawCaldasPixelSprite,
  drawPixelHeart,
  renderCouplePortraitCanvas,
} from '../utils/pixelSprites';
import { isHorrorMovie } from '../utils/horrorAiAnalyzer';
import { soundEngine } from '../utils/soundEngine';
import { Heart, RotateCcw, Sparkles, Skull, Award, Film } from 'lucide-react';

interface RitualSequenceModalProps {
  movie: MovieTemplate | null;
  coupleConfig: CoupleConfig;
  reducedMotion: boolean;
  onResetChoice: () => void;
  onGoToChosenHall: () => void;
}

export const RitualSequenceModal: React.FC<RitualSequenceModalProps> = ({
  movie,
  coupleConfig,
  reducedMotion,
  onResetChoice,
  onGoToChosenHall,
}) => {
  const movieIsHorror = useMemo(() => (movie ? isHorrorMovie(movie) : false), [movie]);

  // For Horror: Stages 1..8
  // For Non-Horror Cozy Cinema: Stages 1 (Entering Theater), 2 (Watching Screen Together), 8 (Final Card)
  const [stage, setStage] = useState<number>(1);
  const [variationSeed, setVariationSeed] = useState<number>(0);
  const coupleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const entityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cinemaSceneCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const posterImgRef = useRef<HTMLImageElement | null>(null);

  // Preload movie poster image for projecting onto the 2D Pixel Art Cinema Screen!
  useEffect(() => {
    if (!movie?.customPosterUrl) {
      posterImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src =
      movie.customPosterUrl === '/couple-reference.jpg'
        ? './couple-reference.jpg'
        : movie.customPosterUrl;
    posterImgRef.current = img;
  }, [movie]);

  useEffect(() => {
    if (!movie) return;
    setStage(1);
    setVariationSeed(Math.floor(Math.random() * 3));

    if (!movieIsHorror) {
      // COZY & SWEET CINEMA SCREENING SEQUENCE (FOR NON-HORROR MOVIES)
      soundEngine.playCinemaSequence();

      if (reducedMotion) {
        const t1 = setTimeout(() => setStage(2), 900);
        const t2 = setTimeout(() => {
          setStage(8);
          soundEngine.playRomanticChime();
        }, 2800);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }

      const timers = [
        setTimeout(() => setStage(2), 2300), // Couple sits down & projector lights up the big screen!
        setTimeout(() => {
          setStage(8);
          soundEngine.playRomanticChime();
        }, 6200),
      ];
      return () => timers.forEach((t) => clearTimeout(t));
    }

    // HORROR RITUAL SEQUENCE (FOR HORROR MOVIES)
    soundEngine.playRitualSequence();

    if (reducedMotion) {
      const t1 = setTimeout(() => setStage(4), 700);
      const t2 = setTimeout(() => setStage(7), 1600);
      const t3 = setTimeout(() => setStage(8), 3200);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    const timers = [
      setTimeout(() => setStage(2), 1100),
      setTimeout(() => setStage(3), 2400),
      setTimeout(() => setStage(4), 3800),
      setTimeout(() => setStage(5), 5400),
      setTimeout(() => setStage(6), 6300),
      setTimeout(() => setStage(7), 7300),
      setTimeout(() => {
        setStage(8);
        soundEngine.playRomanticChime();
      }, 9400),
    ];

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [movie, movieIsHorror, reducedMotion]);

  // Animate pixel canvases (Horror reaction OR Cozy Cinema Screening Room!)
  useEffect(() => {
    if (!movie) return;
    let animId: number;
    let frame = 0;

    const renderLoop = () => {
      frame++;

      if (coupleCanvasRef.current) {
        renderCouplePortraitCanvas(
          coupleCanvasRef.current,
          coupleConfig,
          frame,
          movieIsHorror && stage < 8
        );
      }

      // NON-HORROR: COZY 2D PIXEL ART CINEMA THEATER ANIMATION (Caldas & Aninha entering & watching together!)
      if (!movieIsHorror && stage < 8 && cinemaSceneCanvasRef.current) {
        const ctx = cinemaSceneCanvasRef.current.getContext('2d');
        if (ctx) {
          const W = 200;
          const H = 120;

          // 1. Cozy Darkened Cinema Auditorium Background
          ctx.fillStyle = stage === 1 ? '#0c1224' : '#050812';
          ctx.fillRect(0, 0, W, H);

          // Side Wall Velvet Curtains & Warm Sconces
          ctx.fillStyle = '#450a14';
          ctx.fillRect(0, 6, 18, 86);
          ctx.fillRect(W - 18, 6, 18, 86);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(6, 36, 3, 4);
          ctx.fillRect(W - 9, 36, 3, 4);

          // 2. THE BIG SILVER CINEMA SCREEN AT THE FRONT
          const scrX = 34;
          const scrY = 8;
          const scrW = 132;
          const scrH = 54;

          // Screen Gold Frame
          ctx.fillStyle = '#b45309';
          ctx.fillRect(scrX - 2, scrY - 2, scrW + 4, scrH + 4);

          if (stage === 1) {
            // Curtains parting on the big screen as the couple walks in!
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(scrX, scrY, scrW, scrH);
            const curtainOpen = Math.min(52, Math.floor(frame * 0.55));
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(scrX, scrY, Math.max(8, 66 - curtainOpen), scrH);
            ctx.fillRect(
              scrX + scrW - Math.max(8, 66 - curtainOpen),
              scrY,
              Math.max(8, 66 - curtainOpen),
              scrH
            );
            // "BOM FILME" warm glow in center of screen
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(scrX + 52, scrY + 22, 28, 8);
          } else {
            // STAGE 2: Movie playing on the big screen!
            const screenGlow = ctx.createLinearGradient(scrX, scrY, scrX, scrY + scrH);
            screenGlow.addColorStop(0, '#0284c7');
            screenGlow.addColorStop(0.5, '#1e1b4b');
            screenGlow.addColorStop(1, '#f59e0b');
            ctx.fillStyle = screenGlow;
            ctx.fillRect(scrX, scrY, scrW, scrH);

            // Draw the chosen movie poster and stars inside the big cinema screen!
            const pImg = posterImgRef.current;
            if (pImg && pImg.complete && pImg.naturalWidth > 0) {
              ctx.drawImage(pImg, scrX + 48, scrY + 3, 36, 48);
            }
            // Twinkling stars & warm light on the cinema screen
            ctx.fillStyle = '#fef08a';
            for (let i = 0; i < 8; i++) {
              const sx = scrX + 8 + ((i * 19 + Math.floor(frame * 0.3)) % (scrW - 16));
              const sy = scrY + 6 + ((i * 11) % (scrH - 12));
              if (sx < scrX + 44 || sx > scrX + 88) {
                ctx.fillRect(sx, sy, 2, 2);
              }
            }
            drawPixelHeart(ctx, scrX + 24, scrY + 26, '#f43f5e');
            drawPixelHeart(ctx, scrX + scrW - 24, scrY + 26, '#f43f5e');

            // Golden Projector Light Beam shining from top-center onto the screen!
            ctx.fillStyle =
              frame % 6 < 3
                ? 'rgba(253, 224, 71, 0.13)'
                : 'rgba(253, 224, 71, 0.09)';
            ctx.beginPath();
            ctx.moveTo(W / 2 - 6, 0);
            ctx.lineTo(scrX, scrY + scrH);
            ctx.lineTo(scrX + scrW, scrY + scrH);
            ctx.lineTo(W / 2 + 6, 0);
            ctx.closePath();
            ctx.fill();
          }

          // 3. PLUSH RED VELVET CINEMA SEATS (Back Row & VIP Couple Row)
          ctx.fillStyle = '#090d16';
          ctx.fillRect(0, 66, W, H - 66);

          // Front row seat backs
          for (let sx = 24; sx <= 160; sx += 22) {
            ctx.fillStyle = '#450a14';
            ctx.fillRect(sx, 68, 16, 12);
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(sx + 1, 67, 14, 3);
          }

          // VIP Center Row Seats
          for (let sx = 16; sx <= 168; sx += 24) {
            ctx.fillStyle = '#58111e';
            ctx.fillRect(sx, 86, 18, 18);
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(sx + 2, 84, 14, 4);
          }

          // 4. CALDAS & ANINHA IN THE CINEMA!
          if (stage === 1) {
            // Walking together from the left aisle toward their center VIP seats!
            const walkX = Math.min(98, 28 + frame * 0.65);
            const walkAnim = {
              frame,
              isWalking: walkX < 98,
              facing: 'right' as const,
              isScared: false,
              isLookingBack: false,
              isHoldingHands: true,
              blink: frame % 90 > 85,
            };
            drawAninhaPixelSprite(ctx, walkX - 8, 110, coupleConfig.her, walkAnim);
            drawCaldasPixelSprite(
              ctx,
              walkX + 8,
              110,
              coupleConfig.him,
              walkAnim,
              coupleConfig.lanternColor
            );
            // Striped Popcorn Bucket in between them!
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(Math.round(walkX - 2), 95, 5, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(Math.round(walkX), 95, 1, 6);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(Math.round(walkX - 2), 93, 5, 2);
          } else {
            // STAGE 2: Seated cozily side-by-side in the center VIP seats watching the screen!
            const seatX = 100;
            const seatY = 108;
            const calmAnim = {
              frame,
              isWalking: false,
              facing: 'right' as const,
              isScared: false,
              isLookingBack: false,
              isHoldingHands: true,
              blink: frame % 95 > 90,
            };

            // Draw Aninha & Caldas cuddled close together in their seats
            drawAninhaPixelSprite(ctx, seatX - 7, seatY, coupleConfig.her, calmAnim);
            drawCaldasPixelSprite(
              ctx,
              seatX + 7,
              seatY,
              coupleConfig.him,
              { ...calmAnim, isHoldingHands: true },
              coupleConfig.lanternColor
            );

            // Plush VIP seat armrests & shared Popcorn Bucket with golden kernels!
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(seatX - 3, seatY - 14, 6, 7);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(seatX - 1, seatY - 14, 2, 7);
            ctx.fillStyle = '#fde047';
            ctx.fillRect(seatX - 3, seatY - 16, 6, 2);

            // Floating romantic hearts rising above them as they watch the movie!
            const float1 = Math.sin(frame * 0.08) * 2;
            const float2 = Math.cos(frame * 0.07) * 2;
            drawPixelHeart(ctx, seatX, seatY - 38 + float1, '#ef4444');
            drawPixelHeart(ctx, seatX - 12, seatY - 34 + float2, '#fbbf24');
            drawPixelHeart(ctx, seatX + 12, seatY - 34 - float2, '#fbbf24');
          }
        }
      }

      // HORROR: Draw terrifying pixel entity in Stage 5!
      if (movieIsHorror && stage === 5 && entityCanvasRef.current) {
        const ctx = entityCanvasRef.current.getContext('2d');
        if (ctx) {
          const W = 120;
          const H = 90;
          ctx.fillStyle = frame % 2 === 0 ? '#090204' : '#1f0408';
          ctx.fillRect(0, 0, W, H);

          const jitterX = (Math.random() - 0.5) * 6;
          const jitterY = (Math.random() - 0.5) * 4;
          const cx = Math.round(60 + jitterX);
          const cy = Math.round(45 + jitterY);

          if (variationSeed === 0) {
            ctx.fillStyle = '#d6d3d1';
            ctx.fillRect(cx - 14, cy - 22, 28, 36);
            ctx.fillStyle = '#020204';
            ctx.fillRect(cx - 18, cy - 26, 36, 12);
            ctx.fillRect(cx - 20, cy - 18, 10, 44);
            ctx.fillRect(cx + 10, cy - 18, 10, 44);
            ctx.fillStyle = '#000000';
            ctx.fillRect(cx - 9, cy - 8, 7, 8);
            ctx.fillRect(cx + 2, cy - 8, 7, 8);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(cx - 6, cy - 5, 2, 2);
            ctx.fillRect(cx + 5, cy - 5, 2, 2);
            ctx.fillStyle = '#000000';
            ctx.fillRect(cx - 6, cy + 4, 12, 12);
          } else if (variationSeed === 1) {
            ctx.fillStyle = '#7f1d1d';
            ctx.fillRect(cx - 24, cy - 32, 8, 22);
            ctx.fillRect(cx + 16, cy - 32, 8, 22);
            ctx.fillStyle = '#050305';
            ctx.fillRect(cx - 16, cy - 20, 32, 42);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(cx - 10, cy - 8, 5, 4);
            ctx.fillRect(cx + 5, cy - 8, 5, 4);
            ctx.fillRect(cx - 2, cy - 16, 4, 4);
          } else {
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(cx - 12, cy - 20, 24, 24);
            ctx.fillRect(cx - 8, cy + 4, 16, 10);
            ctx.fillStyle = '#090406';
            ctx.fillRect(cx - 9, cy - 12, 6, 7);
            ctx.fillRect(cx + 3, cy - 12, 6, 7);
            ctx.fillRect(cx - 2, cy - 3, 4, 5);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(cx - 7, cy - 9, 2, 2);
            ctx.fillRect(cx + 5, cy - 9, 2, 2);
          }

          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.fillRect(0, (frame * 7) % H, W, 3);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [coupleConfig, movie, movieIsHorror, stage, variationSeed]);

  if (!movie) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto select-none transition-colors duration-300 ${
        movieIsHorror && stage === 1 && !reducedMotion
          ? 'bg-red-950/80 animate-flicker'
          : movieIsHorror && (stage === 6 || stage === 7)
          ? 'bg-[#020103]'
          : 'bg-[#050814]/95'
      } ${
        movieIsHorror && stage >= 2 && stage <= 5 && !reducedMotion
          ? 'animate-ritual-shake'
          : ''
      }`}
    >
      <div className="pointer-events-none fixed inset-0 crt-scanlines opacity-35" />
      {movieIsHorror && stage >= 3 && stage <= 5 && !reducedMotion && (
        <div className="pointer-events-none fixed inset-x-0 h-20 bg-white/10 vhs-bar z-40" />
      )}

      {/* ==================================================================== */}
      {/* BRANCH A: NON-HORROR COZY CINEMA SCREENING ANIMATION (STAGES 1 & 2)  */}
      {/* ==================================================================== */}
      {!movieIsHorror && stage < 8 && (
        <div className="relative z-10 max-w-2xl w-full text-center space-y-5 p-6 border-2 border-amber-400 bg-[#090d1a] shadow-[0_0_80px_rgba(245,158,11,0.35)] animate-fadeIn">
          <div className="flex items-center justify-between font-vt text-sm text-amber-300 tracking-widest border-b border-amber-800/60 pb-2">
            <span className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-amber-400" />
              <span>SALA VIP // GRAND CINE OLHINHOS</span>
            </span>
            <span>PIPOCA QUENTINHA ★</span>
          </div>

          <div className="flex flex-col items-center space-y-4">
            <div className="border-4 border-amber-500/90 bg-black p-1 shadow-[0_0_45px_rgba(245,158,11,0.3)] w-full max-w-[460px]">
              <canvas
                ref={cinemaSceneCanvasRef}
                width={200}
                height={120}
                className="w-full aspect-[200/120] pixelated block"
              />
            </div>

            {stage === 1 ? (
              <div className="space-y-1.5">
                <p className="font-pixel text-xs sm:text-sm text-amber-300 tracking-wider uppercase">
                  {coupleConfig.her.name} &amp; {coupleConfig.him.name} estão entrando na sala de cinema...
                </p>
                <p className="font-serif-horror italic text-lg text-zinc-200">
                  As cortinas de veludo se abrem e o cheirinho de pipoca toma conta da sala!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-pixel text-xs sm:text-base text-amber-300 tracking-wider uppercase flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-bounce" />
                  <span>Bom filme amoreco!!!!</span>
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500 animate-bounce" />
                </p>
                <p className="font-serif-horror italic text-lg text-amber-100">
                  Juntinhos na primeira fila assistindo a <strong>{movie.title}</strong>!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BRANCH B: HORROR RITUAL SEQUENCE (STAGES 1 TO 7)                     */}
      {/* ==================================================================== */}
      {movieIsHorror && stage >= 1 && stage <= 4 && (
        <div className="relative z-10 max-w-xl w-full text-center space-y-6 p-6 border-2 border-red-800/80 bg-[#090408] shadow-[0_0_80px_rgba(220,38,38,0.5)]">
          <div className="flex items-center justify-between font-vt text-sm text-red-500 tracking-widest border-b border-red-950 pb-2">
            <span>REC ● FITA BLOQUEADA</span>
            <span>BPM: {120 + stage * 15}</span>
            <span>ERR // 03:33:0{stage}</span>
          </div>

          {stage === 1 && (
            <div className="py-10 space-y-3">
              <p className="font-pixel text-xs sm:text-sm text-red-400 tracking-widest uppercase animate-pulse">
                AS LUZES DA SALA ESTÃO PISCANDO...
              </p>
              <p className="font-serif-horror italic text-xl text-zinc-300">
                A porta atrás de vocês acabou de se trancar sozinha.
              </p>
            </div>
          )}

          {stage === 2 && (
            <div className="py-10 space-y-3">
              <p className="font-pixel text-xs sm:text-sm text-red-500 tracking-widest uppercase">
                UM RUÍDO GRAVE ECOA DO SUBSOLO...
              </p>
              <p className="font-serif-horror italic text-xl text-zinc-200">
                O chão treme. Alguma coisa ouviu o nome do filme escolhido.
              </p>
            </div>
          )}

          {stage === 3 && (
            <div className="py-10 space-y-3">
              <p className="font-pixel text-sm sm:text-base text-white glitch-text-intense tracking-widest uppercase">
                SINAL DE VÍDEO CORROMPIDO // FITA INSERIDA
              </p>
              <p className="font-vt text-xl text-red-400 tracking-widest">
                NÃO DESLIGUE A TELA. NÃO OLHE PARA TRÁS.
              </p>
            </div>
          )}

          {stage === 4 && (
            <div className="py-4 space-y-4 flex flex-col items-center">
              <p className="font-pixel text-xs text-red-400 tracking-widest uppercase">
                {coupleConfig.her.name.toUpperCase()} &amp; {coupleConfig.him.name.toUpperCase()} SE ABRAÇAM NO ESCURO!
              </p>
              <div className="border-2 border-red-600 p-1 bg-black shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                <canvas
                  ref={coupleCanvasRef}
                  width={96}
                  height={68}
                  className="w-56 h-40 pixelated block"
                />
              </div>
              <p className="font-serif-horror italic text-lg text-red-200">
                &ldquo;Fica pertinho de mim, {coupleConfig.her.nickname}...&rdquo;
              </p>
            </div>
          )}
        </div>
      )}

      {movieIsHorror && stage === 5 && (
        <div className="relative z-20 flex flex-col items-center justify-center px-4 text-center">
          <canvas
            ref={entityCanvasRef}
            width={120}
            height={90}
            className="w-[340px] sm:w-[480px] h-[260px] sm:h-[360px] pixelated border-4 border-red-600 shadow-[0_0_120px_rgba(239,68,68,0.95)]"
          />
          <p className="mt-4 font-pixel text-xs sm:text-base text-red-500 glitch-text-intense tracking-[0.2em] uppercase">
            Bom filme amoreco!!!!
          </p>
        </div>
      )}

      {movieIsHorror && stage === 6 && <div className="w-full h-full bg-black" />}

      {movieIsHorror && stage === 7 && (
        <div className="relative z-20 text-center space-y-4 px-4 max-w-3xl">
          <p className="font-gothic text-3xl sm:text-5xl text-red-500 tracking-wider glitch-text animate-pulse leading-snug">
            Bom filme amoreco!!!!
          </p>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STAGE 8: FINAL MOVIE REVEAL + "Bom filme amoreco!!!!" (BOTH MODES)   */}
      {/* ==================================================================== */}
      {stage === 8 && (
        <div
          className={`relative z-20 max-w-3xl w-full border-2 p-5 sm:p-8 my-auto animate-fadeIn ${
            movieIsHorror
              ? 'bg-[#09050a] border-red-700 shadow-[0_0_100px_rgba(185,28,28,0.6)]'
              : 'bg-[#090d1a] border-amber-400 shadow-[0_0_100px_rgba(245,158,11,0.45)]'
          }`}
        >
          {/* Top Banner */}
          <div
            className={`flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b ${
              movieIsHorror ? 'border-red-900/60' : 'border-amber-700/60'
            }`}
          >
            <div className="flex items-center gap-2">
              {movieIsHorror ? (
                <Skull className="w-5 h-5 text-red-500" />
              ) : (
                <Film className="w-5 h-5 text-amber-400" />
              )}
              <span
                className={`font-pixel text-[10px] sm:text-xs tracking-widest uppercase ${
                  movieIsHorror ? 'text-red-400' : 'text-amber-300'
                }`}
              >
                SESSÃO CONFIRMADA // FILME DA NOITE ESCOLHIDO
              </span>
            </div>
            <span className="font-vt text-sm text-amber-400 tracking-widest">
              SESSÃO ESPECIAL: {coupleConfig.her.name.toUpperCase()} &amp;{' '}
              {coupleConfig.him.name.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Chosen Movie Poster */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div
                className={`relative w-full max-w-[240px] border-2 bg-black p-2 ${
                  movieIsHorror
                    ? 'border-red-600 shadow-[0_0_45px_rgba(220,38,38,0.45)]'
                    : 'border-amber-400 shadow-[0_0_45px_rgba(245,158,11,0.4)]'
                }`}
              >
                <PosterCanvas
                  artType={movie.posterArt}
                  customPosterUrl={movie.customPosterUrl}
                  isHovered={true}
                  className="w-full aspect-[5/7]"
                />
                <div className="mt-2 text-center font-pixel text-[8px] text-amber-300 tracking-widest">
                  {movie.tapeNumber}
                </div>
              </div>
            </div>

            {/* Chosen Movie Details + Pixel Couple + Iconic Message */}
            <div className="md:col-span-7 space-y-5 text-center md:text-left">
              <div>
                <div className="font-vt text-sm text-amber-400 uppercase tracking-widest">
                  {movie.subgenre} • {movie.year} • {movie.duration}
                </div>
                <h2 className="font-gothic text-2xl sm:text-4xl text-white mt-1">
                  {movie.title}
                </h2>
              </div>

              {/* Final Confirmation Message Box: Always "Bom filme amoreco!!!!" */}
              <div
                className={`p-4 sm:p-5 border-2 flex items-center justify-center md:justify-start gap-3 ${
                  movieIsHorror
                    ? 'bg-[#1a060d] border-red-600/80 shadow-[0_0_30px_rgba(220,38,38,0.25)]'
                    : 'bg-[#131d38] border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)]'
                }`}
              >
                <Heart className="w-5 h-5 fill-rose-600 text-rose-500 animate-bounce shrink-0" />
                <p className="font-pixel text-xs sm:text-base text-amber-100 tracking-wider leading-relaxed">
                  Bom filme amoreco!!!!
                </p>
              </div>

              {/* Mini Pixel Couple Holding Hands */}
              <div className="flex items-center justify-center md:justify-start gap-4 bg-[#0d1222] border border-amber-900/60 p-3">
                <canvas
                  ref={coupleCanvasRef}
                  width={96}
                  height={68}
                  className="w-28 h-20 pixelated border border-amber-700/60 shrink-0"
                />
                <div className="text-left space-y-1">
                  <div className="font-vt text-base text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Protagonistas da Sessão:</span>
                  </div>
                  <p className="font-serif-horror text-sm text-zinc-200">
                    <strong>{coupleConfig.her.name}</strong> ({coupleConfig.her.nickname}) &amp;{' '}
                    <strong>{coupleConfig.him.name}</strong> — prontos para a sessão com pipoca!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={onGoToChosenHall}
                  className="px-5 py-3 bg-amber-700 hover:bg-amber-600 border-2 border-amber-300 text-white font-pixel text-[10px] tracking-widest uppercase flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-200" />
                  <span>Ir para a Sala VIP dos Escolhidos</span>
                </button>

                <button
                  onClick={onResetChoice}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-vt text-base tracking-wider uppercase flex items-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <span>Voltar à Galeria</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
