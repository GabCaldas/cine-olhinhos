import React, { useEffect, useRef, useState } from 'react';
import { CoupleConfig } from '../types/horror';
import {
  drawAninhaPixelSprite,
  drawCaldasPixelSprite,
  drawPixelHeart,
} from '../utils/pixelSprites';
import { soundEngine } from '../utils/soundEngine';
import { Volume2, VolumeX, Film } from 'lucide-react';

interface IntroScreenProps {
  coupleConfig: CoupleConfig;
  reducedMotion: boolean;
  onEnterNight: () => void;
}

const W = 380;
const H = 210;

export const IntroScreen: React.FC<IntroScreenProps> = ({
  coupleConfig,
  reducedMotion,
  onEnterNight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isEnteringCinema, setIsEnteringCinema] = useState<boolean>(false);
  const [isDoorHovered, setIsDoorHovered] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());

  const isEnteringRef = useRef<boolean>(false);
  isEnteringRef.current = isEnteringCinema;

  const isDoorHoveredRef = useRef<boolean>(false);
  isDoorHoveredRef.current = isDoorHovered;

  // Full-screen Pixel Art Retro Cinema Palace Exterior with Caldas & Aninha on the Red Carpet!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let enterProgress = 0;

    const stars = Array.from({ length: 65 }, (_, i) => ({
      x: (i * 59 + 17) % W,
      y: (i * 29 + 7) % 125,
      size: i % 5 === 0 ? 2 : 1,
      phase: i * 13,
    }));

    const render = () => {
      frame++;
      if (isEnteringRef.current) {
        enterProgress = Math.min(100, enterProgress + 1.25);
      }

      // 1. Starry Midnight-Blue Cinema Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 152);
      skyGrad.addColorStop(0, '#040711');
      skyGrad.addColorStop(0.55, '#0b132b');
      skyGrad.addColorStop(1, '#1d1836');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Twinkling Stars
      stars.forEach((s) => {
        const twinkle = Math.sin((frame + s.phase) * 0.06) > 0.2;
        ctx.fillStyle = twinkle ? '#fef08a' : '#64748b';
        ctx.fillRect(s.x, s.y, s.size, s.size);
      });

      // Premiere Searchlight Beams sweeping the night sky
      if (!reducedMotion) {
        ctx.save();
        const beamAngle1 = Math.sin(frame * 0.022) * 0.28;
        const beamAngle2 = -Math.sin(frame * 0.018 + 1.2) * 0.28;

        ctx.fillStyle = 'rgba(253, 224, 71, 0.06)';
        ctx.beginPath();
        ctx.moveTo(75, 148);
        ctx.lineTo(75 + Math.sin(beamAngle1 - 0.14) * 190, 0);
        ctx.lineTo(75 + Math.sin(beamAngle1 + 0.14) * 190, 0);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(305, 148);
        ctx.lineTo(305 + Math.sin(beamAngle2 - 0.14) * 190, 0);
        ctx.lineTo(305 + Math.sin(beamAngle2 + 0.14) * 190, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Warm Golden Full Moon
      const moonX = 58;
      const moonY = 34;
      const moonHalo = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, 30);
      moonHalo.addColorStop(0, 'rgba(251, 191, 36, 0.32)');
      moonHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonHalo;
      ctx.fillRect(moonX - 32, moonY - 32, 64, 64);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(moonX - 8, moonY - 8, 16, 16);
      ctx.fillRect(moonX - 10, moonY - 6, 20, 12);
      ctx.fillRect(moonX - 6, moonY - 10, 12, 20);

      // Distant City Skyline & Warm Streetlights
      ctx.fillStyle = '#090d1a';
      for (let bx = 0; bx < W; bx += 22) {
        const bh = 28 + ((bx * 17) % 32);
        ctx.fillRect(bx, 148 - bh, 18, bh);
        ctx.fillStyle = '#fde047';
        if (bx < 90 || bx > 280) {
          ctx.fillRect(bx + 4, 148 - bh + 6, 2, 3);
          ctx.fillRect(bx + 10, 148 - bh + 12, 2, 3);
        }
        ctx.fillStyle = '#090d1a';
      }

      // 2. THE GRAND RETRO CINEMA PALACE ("GRAND CINE OLHINHOS")
      const cx = 98;
      const cy = 20;
      const cw = 184;

      // Art Deco Stepped Facade Wings & Central Tower
      ctx.fillStyle = '#161224';
      ctx.fillRect(cx, cy + 28, cw, 100);
      ctx.fillStyle = '#1e1630';
      ctx.fillRect(cx + 34, cy + 8, cw - 68, 120);
      ctx.fillRect(cx + 56, cy - 2, cw - 112, 12);

      // Gold Art Deco Vertical Finials & Trim
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx, cy + 26, cw, 2);
      ctx.fillRect(cx + 34, cy + 6, cw - 68, 2);
      ctx.fillRect(cx + 8, cy + 32, 3, 96);
      ctx.fillRect(cx + cw - 11, cy + 32, 3, 96);
      ctx.fillRect(cx + 42, cy + 12, 3, 62);
      ctx.fillRect(cx + cw - 45, cy + 12, 3, 62);

      // Illuminated Neon Film Reel Crest at Top of Tower
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(182, cy + 12, 16, 16);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(185, cy + 15, 3, 3);
      ctx.fillRect(192, cy + 15, 3, 3);
      ctx.fillRect(185, cy + 22, 3, 3);
      ctx.fillRect(192, cy + 22, 3, 3);

      // Grand Illuminated Cinema Marquee above the entrance!
      const mqX = cx + 18;
      const mqY = cy + 54;
      const mqW = cw - 36;
      const mqH = 24;

      // Marquee Outer Gold Frame
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(mqX - 2, mqY - 2, mqW + 4, mqH + 4);
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(mqX + 2, mqY + 2, mqW - 4, mqH - 4);

      // Chasing Golden Marquee Bulbs around the border
      for (let bx = mqX; bx <= mqX + mqW - 2; bx += 6) {
        const lit = (Math.floor(frame / 8) + bx) % 2 === 0;
        ctx.fillStyle = lit ? '#fbbf24' : '#92400e';
        ctx.fillRect(bx, mqY - 2, 2, 2);
        ctx.fillRect(bx, mqY + mqH, 2, 2);
      }

      // Pixel Marquee Bars inside the glowing white board ("CINE OLHINHOS • EM CARTAZ")
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(mqX + 14, mqY + 6, mqW - 28, 3);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(mqX + 26, mqY + 12, mqW - 52, 2);
      ctx.fillRect(mqX + 36, mqY + 16, mqW - 72, 2);

      // Left & Right "EM CARTAZ" Illuminated Poster Display Cases on the Facade
      [cx + 16, cx + cw - 42].forEach((pxBox, idx) => {
        const pyBox = cy + 88;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(pxBox, pyBox, 26, 34);
        ctx.fillStyle = '#090d16';
        ctx.fillRect(pxBox + 2, pyBox + 2, 22, 30);
        // Mini pixel poster art inside display case
        ctx.fillStyle = idx === 0 ? '#0284c7' : '#d97706';
        ctx.fillRect(pxBox + 4, pyBox + 4, 18, 26);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(pxBox + 7, pyBox + 8, 12, 8);
      });

      // Grand Cinema Double Velvet & Brass Doors (Center X = 190)
      const doorX = 172;
      const doorY = cy + 84;
      const doorW = 36;
      const doorH = 44;

      // Warm Golden & Crimson Cinema Lobby Glow behind the doors
      const lobbyGlow = ctx.createLinearGradient(doorX, doorY, doorX, doorY + doorH);
      lobbyGlow.addColorStop(0, '#78350f');
      lobbyGlow.addColorStop(0.5, '#d97706');
      lobbyGlow.addColorStop(1, '#fef08a');
      ctx.fillStyle = lobbyGlow;
      ctx.fillRect(doorX, doorY, doorW, doorH);

      const openPx = isEnteringRef.current
        ? Math.min(32, Math.floor(enterProgress * 0.48))
        : isDoorHoveredRef.current
        ? 6
        : 0;

      const halfDoor = Math.max(2, Math.floor((doorW - openPx) / 2));
      // Plush Burgundy & Brass Theater Doors
      ctx.fillStyle = '#581c28';
      ctx.fillRect(doorX, doorY, halfDoor, doorH);
      ctx.fillRect(doorX + doorW - halfDoor, doorY, halfDoor, doorH);
      ctx.fillStyle = '#fbbf24';
      if (halfDoor > 6) {
        ctx.fillRect(doorX + 3, doorY + 4, halfDoor - 5, 14);
        ctx.fillRect(doorX + doorW - halfDoor + 2, doorY + 4, halfDoor - 5, 14);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(doorX + 4, doorY + 5, halfDoor - 7, 12);
        ctx.fillRect(doorX + doorW - halfDoor + 3, doorY + 5, halfDoor - 7, 12);
      }
      // Brass push bars
      ctx.fillStyle = '#fde047';
      ctx.fillRect(doorX + halfDoor - 4, doorY + 23, 3, 2);
      ctx.fillRect(doorX + doorW - halfDoor + 1, doorY + 23, 3, 2);

      // 3. Walk of Fame Sidewalk & Premiere Red Carpet Runner
      ctx.fillStyle = '#0f1420';
      ctx.fillRect(0, 148, W, H - 148);

      // Sidewalk tiles & Golden Walk of Fame Stars
      ctx.fillStyle = '#1e2536';
      for (let tx = 10; tx < W; tx += 36) {
        ctx.fillRect(tx, 152, 32, 54);
        if (tx < 120 || tx > 240) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(tx + 14, 172, 4, 4);
          ctx.fillStyle = '#1e2536';
        }
      }

      // Plush Red Carpet leading from bottom of screen to the Cinema Doors
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(148, 148, 84, 62);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(154, 148, 72, 62);
      // Gold carpet borders
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(150, 148, 2, 62);
      ctx.fillRect(228, 148, 2, 62);

      // Gold Stanchions & Velvet Ropes on both sides of the Red Carpet
      [144, 234].forEach((sx) => {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx, 154, 2, 12);
        ctx.fillRect(sx, 176, 2, 14);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(sx, 160, 2, 18);
      });

      // 4. PIXEL ART CALDAS & ANINHA STANDING ON THE RED CARPET!
      const walkUpOffset = isEnteringRef.current ? Math.min(28, enterProgress * 0.36) : 0;
      const coupleScaleAlpha =
        isEnteringRef.current && enterProgress > 75
          ? Math.max(0, 1 - (enterProgress - 75) / 25)
          : 1;

      const coupleX = 190;
      const coupleY = Math.round(176 - walkUpOffset);

      ctx.save();
      ctx.globalAlpha = coupleScaleAlpha;

      const coupleGlow = ctx.createRadialGradient(
        coupleX,
        coupleY - 16,
        4,
        coupleX,
        coupleY - 16,
        56
      );
      coupleGlow.addColorStop(0, 'rgba(251, 191, 36, 0.38)');
      coupleGlow.addColorStop(0.5, 'rgba(220, 38, 38, 0.14)');
      coupleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coupleGlow;
      ctx.fillRect(coupleX - 58, coupleY - 72, 116, 90);

      const animState = {
        frame,
        isWalking: isEnteringRef.current,
        facing: 'right' as const,
        isScared: false,
        isLookingBack: false,
        isHoldingHands: true,
        blink: frame % 100 > 95,
      };

      drawAninhaPixelSprite(ctx, coupleX - 8, coupleY, coupleConfig.her, animState);
      drawCaldasPixelSprite(
        ctx,
        coupleX + 8,
        coupleY,
        coupleConfig.him,
        animState,
        coupleConfig.lanternColor
      );

      const heartBob = Math.sin(frame * 0.08) * 1.5;
      drawPixelHeart(ctx, coupleX - 1, coupleY - 39 + heartBob, '#dc2626');

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [coupleConfig, reducedMotion]);

  const handleEnterCinema = () => {
    if (isEnteringCinema) return;
    setIsEnteringCinema(true);

    soundEngine.startAmbient();
    soundEngine.playRomanticChime();

    setTimeout(() => {
      onEnterNight();
    }, reducedMotion ? 400 : 1900);
  };

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEngine.startAmbient();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#040711] overflow-hidden select-none flex flex-col justify-between">
      {/* Full-Screen Pixel Art Scene: Caldas & Aninha in front of Grand Cine Olhinhos */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={handleEnterCinema}
        onMouseMove={() => setIsDoorHovered(true)}
        className={`absolute inset-0 w-full h-full object-cover pixelated transition-transform duration-[1900ms] ease-in-out cursor-pointer ${
          isEnteringCinema ? 'scale-[1.65] brightness-110' : 'scale-100'
        }`}
      />

      <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-30" />
      <div className="pointer-events-none absolute inset-0 vignette-heavy opacity-75" />

      {/* Top HUD Bar */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-4 flex items-center justify-end">
        <button
          onClick={handleToggleAudio}
          className="px-3 py-1.5 bg-black/80 hover:bg-amber-950/60 border border-amber-500/60 text-amber-100 font-vt text-base flex items-center gap-2 transition cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-amber-400" />
              <span>Som: OFF</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Som: ON</span>
            </>
          )}
        </button>
      </div>

      {/* Upper-Center Title & Subtitle */}
      <div
        className={`relative z-10 max-w-3xl mx-auto px-4 pt-2 text-center pointer-events-none transition-opacity duration-700 ${
          isEnteringCinema ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="bg-[#090d1a]/88 backdrop-blur-[2px] border-2 border-amber-500/80 px-6 sm:px-10 py-5 shadow-[0_0_55px_rgba(0,0,0,0.95)] space-y-2.5">
          <div className="font-pixel text-[9px] sm:text-[10px] text-amber-400 tracking-[0.25em] uppercase">
            ★ GRAND CINE OLHINHOS • SESSÃO EXCLUSIVA ★
          </div>
          <h1 className="font-gothic text-xl sm:text-3xl md:text-4xl text-white tracking-wider leading-snug">
            Uma Lista de Filmes para Aninha
          </h1>
          <p className="font-serif-horror italic text-base sm:text-xl text-amber-300 tracking-wide">
            Feito com carinho! - Caldas
          </p>
        </div>
      </div>

      {/* Bottom Interactive Prompt to Enter the Cinema */}
      <div
        className={`relative z-10 pb-7 sm:pb-10 px-4 flex flex-col items-center gap-3 transition-opacity duration-500 ${
          isEnteringCinema ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={handleEnterCinema}
          onMouseEnter={() => {
            setIsDoorHovered(true);
            soundEngine.playRomanticChime();
          }}
          onMouseLeave={() => setIsDoorHovered(false)}
          className="group px-8 py-4 bg-[#450a14]/95 hover:bg-[#7f1d1d] border-2 border-amber-400 text-white font-pixel text-xs sm:text-sm tracking-[0.2em] uppercase shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:shadow-[0_0_55px_rgba(251,191,36,0.9)] transition-all flex items-center gap-3 cursor-pointer"
        >
          <Film className="w-5 h-5 text-amber-300 group-hover:scale-110 transition-transform" />
          <span>ENTRAR NO CINEMA</span>
        </button>

        <span className="px-3 py-1 bg-black/80 border border-amber-900/60 font-vt text-sm sm:text-base text-amber-100 tracking-widest">
          Clique nas portas do cinema ou no botão acima para entrar com {coupleConfig.him.name} &lt;3
        </span>
      </div>
    </div>
  );
};
