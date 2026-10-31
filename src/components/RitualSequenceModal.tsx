import React, { useEffect, useRef, useState } from 'react';
import { CoupleConfig, MovieTemplate } from '../types/horror';
import { PosterCanvas } from './PosterCanvas';
import { renderCouplePortraitCanvas } from '../utils/pixelSprites';
import { soundEngine } from '../utils/soundEngine';
import { Heart, RotateCcw, Sparkles, Skull, Award } from 'lucide-react';

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
  // Stages 1..8 matching Section 6 of the prompt
  const [stage, setStage] = useState<number>(1);
  const [variationSeed, setVariationSeed] = useState<number>(0);
  const coupleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const entityCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!movie) return;
    setStage(1);
    setVariationSeed(Math.floor(Math.random() * 3));

    // Play the 8-stage procedural horror soundscape
    soundEngine.playRitualSequence();

    if (reducedMotion) {
      // Faster, non-strobing progression for reduced motion accessibility
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
      setTimeout(() => setStage(2), 1100), // 2. Low drone & heartbeat swells
      setTimeout(() => setStage(3), 2400), // 3. Heavy VHS interference
      setTimeout(() => setStage(4), 3800), // 4. Pixel couple reacts in fear & hugs
      setTimeout(() => setStage(5), 5400), // 5. Terrifying entity flash!
      setTimeout(() => setStage(6), 6300), // 6. Pitch black silence
      setTimeout(() => setStage(7), 7300), // 7. "Aninha e Caldas selaram seu destino, (Bom filme amoreco)"
      setTimeout(() => {
        setStage(8); // 8. Final dramatic poster reveal
        soundEngine.playRomanticChime();
      }, 9400),
    ];

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [movie, reducedMotion]);

  // Animate pixel couple reaction canvas (Stage 4 & Stage 8)
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
          stage < 8 // Scared during ritual, calm/happy at final stage 8
        );
      }

      // Draw terrifying pixel entity in Stage 5!
      if (stage === 5 && entityCanvasRef.current) {
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
            // Variation A: The Pale Face from the Cursed Well
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
            // Variation B: The Horned Forest Entity
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
            // Variation C: The Silent Corridor Shadow & Static Skull
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

          // VHS corruption lines across entity
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.fillRect(0, (frame * 7) % H, W, 3);
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [coupleConfig, movie, stage, variationSeed]);

  if (!movie) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto select-none transition-colors duration-300 ${
        stage === 1 && !reducedMotion
          ? 'bg-red-950/80 animate-flicker'
          : stage === 6 || stage === 7
          ? 'bg-[#020103]'
          : 'bg-[#040206]/95'
      } ${stage >= 2 && stage <= 5 && !reducedMotion ? 'animate-ritual-shake' : ''}`}
    >
      {/* CRT Scanlines & VHS Tracking Bars */}
      <div className="pointer-events-none fixed inset-0 crt-scanlines opacity-65" />
      {stage >= 3 && stage <= 5 && !reducedMotion && (
        <div className="pointer-events-none fixed inset-x-0 h-20 bg-white/10 vhs-bar z-40" />
      )}

      {/* STAGES 1 TO 4: THE RITUAL BUILDUP */}
      {stage >= 1 && stage <= 4 && (
        <div className="relative z-10 max-w-xl w-full text-center space-y-6 p-6 border-2 border-red-800/80 bg-[#090408] shadow-[0_0_80px_rgba(220,38,38,0.5)]">
          <div className="flex items-center justify-between font-vt text-sm text-red-500 tracking-widest border-b border-red-950 pb-2">
            <span>REC ● FITA BLOQUEADA</span>
            <span>BPM: {120 + stage * 15}</span>
            <span>ERR // 03:33:0{stage}</span>
          </div>

          {stage === 1 && (
            <div className="py-10 space-y-3">
              <p className="font-pixel text-xs sm:text-sm text-red-400 tracking-widest uppercase animate-pulse">
                AS LUZES DA MANSÃO ESTÃO PISCANDO...
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

      {/* STAGE 5: THE SUDDEN ENTITY APPEARANCE */}
      {stage === 5 && (
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

      {/* STAGE 6: PITCH BLACK DEAD SILENCE */}
      {stage === 6 && <div className="w-full h-full bg-black" />}

      {/* STAGE 7: "Bom filme amoreco!!!!" */}
      {stage === 7 && (
        <div className="relative z-20 text-center space-y-4 px-4 max-w-3xl">
          <p className="font-gothic text-3xl sm:text-5xl text-red-500 tracking-wider glitch-text animate-pulse leading-snug">
            Bom filme amoreco!!!!
          </p>
        </div>
      )}

      {/* STAGE 8: DRAMATIC MOVIE REVEAL + FINAL MESSAGE */}
      {stage === 8 && (
        <div className="relative z-20 max-w-3xl w-full bg-[#09050a] border-2 border-red-700 shadow-[0_0_100px_rgba(185,28,28,0.6)] p-5 sm:p-8 my-auto animate-fadeIn">
          {/* Top Ritual Seal Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-red-900/60">
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-red-500" />
              <span className="font-pixel text-[10px] sm:text-xs text-red-400 tracking-widest uppercase">
                DESTINO SELADO // FILME DA NOITE ESCOLHIDO
              </span>
            </div>
            <span className="font-vt text-sm text-amber-400 tracking-widest">
              SESSÃO ESPECIAL: {coupleConfig.her.name.toUpperCase()} &amp; {coupleConfig.him.name.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Chosen Movie Poster */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-[240px] border-2 border-red-600 bg-black p-2 shadow-[0_0_45px_rgba(220,38,38,0.45)]">
                <PosterCanvas
                  artType={movie.posterArt}
                  customPosterUrl={movie.customPosterUrl}
                  isHovered={true}
                  className="w-full aspect-[5/7]"
                />
                <div className="mt-2 text-center font-pixel text-[8px] text-red-300 tracking-widest">
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
                <h2 className="font-gothic text-2xl sm:text-4xl text-white glitch-text mt-1">
                  {movie.title}
                </h2>
              </div>

              {/* Final Confirmation Message Box */}
              <div className="p-4 sm:p-5 bg-[#1a060d] border-2 border-red-600/80 shadow-[0_0_30px_rgba(220,38,38,0.25)] flex items-center justify-center md:justify-start gap-3">
                <Heart className="w-5 h-5 fill-red-600 text-red-500 animate-bounce shrink-0" />
                <p className="font-pixel text-xs sm:text-base text-red-100 tracking-wider leading-relaxed">
                  Bom filme amoreco!!!!
                </p>
              </div>

              {/* Mini Pixel Couple Holding Hands */}
              <div className="flex items-center justify-center md:justify-start gap-4 bg-[#0e070c] border border-red-950 p-3">
                <canvas
                  ref={coupleCanvasRef}
                  width={96}
                  height={68}
                  className="w-28 h-20 pixelated border border-red-900/60 shrink-0"
                />
                <div className="text-left space-y-1">
                  <div className="font-vt text-base text-red-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Protagonistas da Noite:</span>
                  </div>
                  <p className="font-serif-horror text-sm text-zinc-300">
                    <strong>{coupleConfig.her.name}</strong> ({coupleConfig.her.nickname}) &amp;{' '}
                    <strong>{coupleConfig.him.name}</strong> — protegidos pelo mesmo cobertor.
                  </p>
                </div>
              </div>

              {/* Actions: Go to Chosen Movies Hall or Return to Corridor */}
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <button
                  onClick={onGoToChosenHall}
                  className="px-5 py-3 bg-amber-800 hover:bg-amber-700 border-2 border-amber-400 text-white font-pixel text-[10px] tracking-widest uppercase flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.45)] transition cursor-pointer"
                >
                  <Award className="w-4 h-4 text-amber-200" />
                  <span>Ir para o Salão dos Escolhidos</span>
                </button>

                <button
                  onClick={onResetChoice}
                  className="px-4 py-3 bg-[#240910] hover:bg-[#3b0d19] border border-red-700 text-red-100 font-vt text-base tracking-wider uppercase flex items-center gap-2 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-red-400" />
                  <span>Escolher Outro no Corredor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
