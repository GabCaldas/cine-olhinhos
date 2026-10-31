import React, { useEffect, useRef, useState } from 'react';
import { CoupleConfig } from '../types/horror';
import {
  drawAninhaPixelSprite,
  drawCaldasPixelSprite,
  drawPixelHeart,
  drawStickRune,
} from '../utils/pixelSprites';
import { soundEngine } from '../utils/soundEngine';
import { Volume2, VolumeX, DoorOpen } from 'lucide-react';

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
  const [isEnteringMansion, setIsEnteringMansion] = useState<boolean>(false);
  const [isDoorHovered, setIsDoorHovered] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());

  const isEnteringRef = useRef<boolean>(false);
  isEnteringRef.current = isEnteringMansion;

  const isDoorHoveredRef = useRef<boolean>(false);
  isDoorHoveredRef.current = isDoorHovered;

  // Full-screen Pixel Art Mansion Exterior with Caldas & Aninha standing in front of the door!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let enterProgress = 0; // 0 -> 100 as doors open and couple walks inside

    const rainDrops = Array.from({ length: 95 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 2.8 + Math.random() * 1.6,
      len: 4 + Math.floor(Math.random() * 4),
    }));

    const fogBands = Array.from({ length: 12 }, (_, i) => ({
      x: i * 38,
      y: 138 + (i % 3) * 14,
      w: 62 + (i % 4) * 16,
      h: 11 + (i % 2) * 6,
      speed: 0.14 + (i % 3) * 0.05,
    }));

    const render = () => {
      frame++;
      if (isEnteringRef.current) {
        enterProgress = Math.min(100, enterProgress + 1.15);
      }

      const isLightning = !reducedMotion && (frame % 260 === 0 || frame % 260 === 3);

      // 1. Night Sky & Blood Moon
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 155);
      skyGrad.addColorStop(0, isLightning ? '#3f1521' : '#040307');
      skyGrad.addColorStop(0.55, '#100811');
      skyGrad.addColorStop(1, '#1a0f18');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Crimson Moon
      const moonX = 72;
      const moonY = 36;
      const moonHalo = ctx.createRadialGradient(moonX, moonY, 5, moonX, moonY, 34);
      moonHalo.addColorStop(0, 'rgba(185, 28, 28, 0.35)');
      moonHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonHalo;
      ctx.fillRect(moonX - 36, moonY - 36, 72, 72);

      ctx.fillStyle = '#dfd6ce';
      ctx.fillRect(moonX - 9, moonY - 9, 18, 18);
      ctx.fillRect(moonX - 11, moonY - 7, 22, 14);
      ctx.fillRect(moonX - 7, moonY - 11, 14, 22);
      ctx.fillStyle = '#b8aba0';
      ctx.fillRect(moonX - 5, moonY - 4, 4, 3);
      ctx.fillRect(moonX + 2, moonY + 2, 5, 4);

      // Distant Dead Forest Silhouette
      ctx.fillStyle = '#090c0b';
      for (let tx = 0; tx < W; tx += 9) {
        const th = 34 + ((tx * 19) % 26);
        ctx.fillRect(tx, 152 - th, 7, th);
      }

      // 2. The Imposing Victorian Mansion directly behind the couple
      const mx = 116;
      const my = 22;

      // Mansion Wings & Central Tower
      ctx.fillStyle = '#120f17';
      ctx.fillRect(mx, my + 30, 148, 96);
      ctx.fillRect(mx - 14, my + 38, 28, 88);
      ctx.fillRect(mx + 134, my + 38, 28, 88);
      ctx.fillRect(mx + 42, my + 8, 64, 118);

      // Steep Gothic Roofs
      ctx.fillStyle = '#1d1421';
      for (let r = 0; r < 22; r++) {
        ctx.fillRect(mx + 36 + r, my + 8 - r, 76 - r * 2, 1);
      }
      for (let r = 0; r < 15; r++) {
        ctx.fillRect(mx - 16 + r, my + 38 - r, 32 - r * 2, 1);
        ctx.fillRect(mx + 132 + r, my + 38 - r, 32 - r * 2, 1);
      }

      // Upper Windows with eerie warm/crimson light & passing shadow
      const winXList = [mx + 12, mx + 64, mx + 116];
      winXList.forEach((wx, idx) => {
        const wy = my + 48;
        ctx.fillStyle = idx === 1 ? '#5c1916' : '#1e1926';
        ctx.fillRect(wx, wy, 18, 24);
        // Shadow figure passing 2nd floor center window
        if (idx === 1 && frame % 180 > 110) {
          const sx = wx + 3 + Math.floor(((frame % 180) - 110) / 7);
          ctx.fillStyle = '#050307';
          ctx.fillRect(sx, wy + 5, 5, 19);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(sx + 1, wy + 7, 1, 1);
          ctx.fillRect(sx + 3, wy + 7, 1, 1);
        }
        ctx.fillStyle = '#09070c';
        ctx.fillRect(wx + 8, wy, 2, 24);
        ctx.fillRect(wx, wy + 11, 18, 2);
      });

      // Mansion Grand Entrance Porch & Steps
      ctx.fillStyle = '#211a28';
      ctx.fillRect(mx + 34, my + 80, 80, 5); // Porch roof
      ctx.fillRect(mx + 38, my + 85, 5, 42); // Left column
      ctx.fillRect(mx + 105, my + 85, 5, 42); // Right column

      // Grand Mansion Double Oak Doors (Center X = 190!)
      const doorX = 172;
      const doorY = my + 86;
      const doorW = 36;
      const doorH = 42;

      // Glowing red/amber mansion interior corridor behind the doors!
      const interiorGlow = ctx.createLinearGradient(doorX, doorY, doorX, doorY + doorH);
      interiorGlow.addColorStop(0, '#450a0a');
      interiorGlow.addColorStop(0.6, '#991b1b');
      interiorGlow.addColorStop(1, '#d97706');
      ctx.fillStyle = interiorGlow;
      ctx.fillRect(doorX, doorY, doorW, doorH);

      // Calculate how wide open the doors are (hover = ajar 4px, entering = fully open 32px)
      const openPx = isEnteringRef.current
        ? Math.min(32, Math.floor(enterProgress * 0.48))
        : isDoorHoveredRef.current
        ? 6
        : 0;

      const halfDoor = Math.max(2, Math.floor((doorW - openPx) / 2));
      // Left & Right heavy oak doors
      ctx.fillStyle = '#361e12';
      ctx.fillRect(doorX, doorY, halfDoor, doorH);
      ctx.fillRect(doorX + doorW - halfDoor, doorY, halfDoor, doorH);
      // Door wood panels & brass knockers
      ctx.fillStyle = '#24130b';
      if (halfDoor > 6) {
        ctx.fillRect(doorX + 3, doorY + 4, halfDoor - 5, 14);
        ctx.fillRect(doorX + 3, doorY + 22, halfDoor - 5, 16);
        ctx.fillRect(doorX + doorW - halfDoor + 2, doorY + 4, halfDoor - 5, 14);
        ctx.fillRect(doorX + doorW - halfDoor + 2, doorY + 22, halfDoor - 5, 16);
      }
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(doorX + halfDoor - 3, doorY + 20, 2, 3);
      ctx.fillRect(doorX + doorW - halfDoor + 1, doorY + 20, 2, 3);

      // Flickering Porch Lanterns on both sides of the door
      const lanternFlicker = frame % 85 !== 0;
      if (lanternFlicker) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(doorX - 8, doorY + 8, 3, 6);
        ctx.fillRect(doorX + doorW + 5, doorY + 8, 3, 6);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
        ctx.fillRect(doorX - 18, doorY - 2, 24, 26);
        ctx.fillRect(doorX + doorW - 6, doorY - 2, 24, 26);
      }

      // Gnarled Trees & Stick Runes framing the mansion
      ctx.fillStyle = '#0a080d';
      [18, 44, 72, 308, 336, 360].forEach((tx, idx) => {
        const th = 86 + (idx % 2) * 18;
        ctx.fillRect(tx, 154 - th, 7, th);
        ctx.fillRect(tx - 9, 154 - th + 18, 22, 3);
      });
      const sway = Math.sin(frame * 0.05) * 1.2;
      drawStickRune(ctx, 62, 102, sway);
      drawStickRune(ctx, 322, 98, -sway);

      // 3. Stone Steps & Courtyard Path leading to the Mansion Door
      ctx.fillStyle = '#080a09';
      ctx.fillRect(0, 148, W, H - 148);

      // Stone steps right in front of the door
      ctx.fillStyle = '#1f1b27';
      ctx.fillRect(156, 148, 68, 5);
      ctx.fillRect(148, 153, 84, 5);
      // Cobblestone path where Caldas & Aninha stand
      ctx.fillStyle = '#15121b';
      ctx.fillRect(138, 158, 104, 52);
      ctx.fillStyle = '#231e2c';
      for (let py = 162; py < 205; py += 9) {
        for (let px = 144; px < 232; px += 16) {
          ctx.fillRect(px + (py % 18 === 0 ? 5 : 0), py, 10, 4);
        }
      }

      // 4. PIXEL ART CALDAS & ANINHA STANDING IN FRONT OF THE MANSION DOOR!
      const walkUpOffset = isEnteringRef.current ? Math.min(28, enterProgress * 0.36) : 0;
      const coupleScaleAlpha =
        isEnteringRef.current && enterProgress > 75
          ? Math.max(0, 1 - (enterProgress - 75) / 25)
          : 1;

      const cx = 190;
      const cy = Math.round(176 - walkUpOffset);

      ctx.save();
      ctx.globalAlpha = coupleScaleAlpha;

      // Warm lantern glow around Caldas & Aninha
      const coupleGlow = ctx.createRadialGradient(cx, cy - 16, 4, cx, cy - 16, 56);
      coupleGlow.addColorStop(0, 'rgba(245, 158, 11, 0.36)');
      coupleGlow.addColorStop(0.5, 'rgba(185, 28, 28, 0.14)');
      coupleGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coupleGlow;
      ctx.fillRect(cx - 58, cy - 72, 116, 90);

      const animState = {
        frame,
        isWalking: isEnteringRef.current,
        facing: 'right' as const,
        isScared: isLightning,
        isLookingBack: !isEnteringRef.current && frame % 220 > 185,
        isHoldingHands: true,
        blink: frame % 100 > 95,
      };

      // Aninha on left, Caldas on right, holding hands in front of the mansion door!
      drawAninhaPixelSprite(ctx, cx - 8, cy, coupleConfig.her, animState);
      drawCaldasPixelSprite(
        ctx,
        cx + 8,
        cy,
        coupleConfig.him,
        animState,
        coupleConfig.lanternColor
      );

      // Floating crimson heart above their joined hands
      const heartBob = Math.sin(frame * 0.08) * 1.5;
      drawPixelHeart(ctx, cx - 1, cy - 39 + heartBob, '#dc2626');

      ctx.restore();

      // 5. Rolling Fog & Rain
      ctx.fillStyle = 'rgba(148, 163, 184, 0.09)';
      fogBands.forEach((f) => {
        if (!reducedMotion) f.x = (f.x + f.speed) % (W + 60);
        ctx.fillRect(Math.round(f.x - 50), f.y, f.w, f.h);
      });

      if (!reducedMotion) {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.3)';
        rainDrops.forEach((r) => {
          r.y += r.speed;
          r.x -= 0.4;
          if (r.y > H) {
            r.y = -6;
            r.x = Math.random() * W;
          }
          if (r.x < 0) r.x = W;
          ctx.fillRect(Math.round(r.x), Math.round(r.y), 1, r.len);
        });
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [coupleConfig, reducedMotion]);

  const handleEnterMansion = () => {
    if (isEnteringMansion) return;
    setIsEnteringMansion(true);

    soundEngine.startAmbient();
    soundEngine.playDoorCreak();
    soundEngine.playHeartbeat(0.7);

    setTimeout(() => {
      onEnterNight();
    }, reducedMotion ? 400 : 2100);
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
    <div className="fixed inset-0 z-50 bg-[#040306] overflow-hidden select-none flex flex-col justify-between">
      {/* Full-Screen Pixel Art Scene: Caldas & Aninha in front of the Mansion Door */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onClick={handleEnterMansion}
        onMouseMove={() => setIsDoorHovered(true)}
        className={`absolute inset-0 w-full h-full object-cover pixelated transition-transform duration-[2100ms] ease-in-out cursor-pointer ${
          isEnteringMansion ? 'scale-[1.65] brightness-110' : 'scale-100'
        }`}
      />

      {/* Scanlines & Atmospheric Vignette */}
      <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-45" />
      <div className="pointer-events-none absolute inset-0 vignette-heavy" />

      {/* Top HUD Bar */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-4 flex items-center justify-end">
        <button
          onClick={handleToggleAudio}
          className="px-3 py-1.5 bg-black/80 hover:bg-red-950/60 border border-red-900/60 text-zinc-200 font-vt text-base flex items-center gap-2 transition cursor-pointer"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-red-400" />
              <span>Som: OFF</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-red-400" />
              <span>Som: ON</span>
            </>
          )}
        </button>
      </div>

      {/* Upper-Center Title & Subtitle Requested by Caldas */}
      <div
        className={`relative z-10 max-w-3xl mx-auto px-4 pt-2 text-center pointer-events-none transition-opacity duration-700 ${
          isEnteringMansion ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="bg-black/75 backdrop-blur-[2px] border-2 border-red-900/80 px-6 sm:px-10 py-5 shadow-[0_0_55px_rgba(0,0,0,0.95)] space-y-3">
          <h1 className="font-gothic text-xl sm:text-3xl md:text-4xl text-white glitch-text tracking-wider leading-snug">
            Uma Lista de Terror para Aninha
          </h1>
          <p className="font-serif-horror italic text-base sm:text-xl text-red-400 tracking-wide">
            Feito com carinho! - Caldas
          </p>
        </div>
      </div>

      {/* Bottom Interactive Prompt to Enter the Mansion */}
      <div
        className={`relative z-10 pb-7 sm:pb-10 px-4 flex flex-col items-center gap-3 transition-opacity duration-500 ${
          isEnteringMansion ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={handleEnterMansion}
          onMouseEnter={() => {
            setIsDoorHovered(true);
            soundEngine.playHeartbeat(0.45);
          }}
          onMouseLeave={() => setIsDoorHovered(false)}
          className="group px-8 py-4 bg-[#1c060b]/95 hover:bg-[#450a17] border-2 border-red-600 text-white font-pixel text-xs sm:text-sm tracking-[0.2em] uppercase shadow-[0_0_35px_rgba(220,38,38,0.6)] hover:shadow-[0_0_55px_rgba(239,68,68,0.95)] transition-all flex items-center gap-3 cursor-pointer"
        >
          <DoorOpen className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>ENTRAR NA MANSÃO</span>
        </button>

        <span className="px-3 py-1 bg-black/80 border border-zinc-800 font-vt text-sm sm:text-base text-zinc-300 tracking-widest">
          Clique na porta da mansão ou no botão acima para entrar com {coupleConfig.him.name} &lt;3
        </span>
      </div>
    </div>
  );
};
