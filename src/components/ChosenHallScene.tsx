import React, { useEffect, useRef, useState } from 'react';
import {
  ChosenMovieRecord,
  CoupleConfig,
  MovieTemplate,
} from '../types/horror';
import {
  drawAninhaPixelSprite,
  drawCaldasPixelSprite,
  drawPixelHeart,
} from '../utils/pixelSprites';
import { isHorrorMovie } from '../utils/horrorAiAnalyzer';
import { soundEngine } from '../utils/soundEngine';
import {
  ArrowLeft,
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flame,
  Heart,
  Skull,
  Trash2,
  Star,
} from 'lucide-react';

interface ChosenHallSceneProps {
  chosenRecords: ChosenMovieRecord[];
  coupleConfig: CoupleConfig;
  reducedMotion: boolean;
  onBackToCorridor: () => void;
  onInspectMovie: (movie: MovieTemplate) => void;
  onRemoveRecord: (recordId: string) => void;
}

const VIEW_W = 420;
const VIEW_H = 215;
const FIRST_FRAME_X = 185;
const FRAME_SPACING = 140;

export const ChosenHallScene: React.FC<ChosenHallSceneProps> = ({
  chosenRecords,
  coupleConfig,
  reducedMotion,
  onBackToCorridor,
  onInspectMovie,
  onRemoveRecord,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const worldWidth = Math.max(
    520,
    FIRST_FRAME_X + Math.max(1, chosenRecords.length) * FRAME_SPACING + 120
  );

  // Start the couple near the newest chosen movie (or by the fireplace if empty)
  const initialX =
    chosenRecords.length > 0
      ? FIRST_FRAME_X + (chosenRecords.length - 1) * FRAME_SPACING
      : 150;

  const coupleXRef = useRef<number>(initialX);
  const targetXRef = useRef<number>(initialX);
  const cameraXRef = useRef<number>(Math.max(0, initialX - VIEW_W / 2));
  const isWalkingRef = useRef<boolean>(false);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const [activeIdx, setActiveIdx] = useState<number>(
    Math.max(0, chosenRecords.length - 1)
  );
  const activeIdxRef = useRef<number>(activeIdx);
  activeIdxRef.current = activeIdx;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hoveredIdxRef = useRef<number | null>(null);
  hoveredIdxRef.current = hoveredIdx;

  const [hoveredExitDoor, setHoveredExitDoor] = useState<boolean>(false);
  const hoveredExitDoorRef = useRef<boolean>(false);
  hoveredExitDoorRef.current = hoveredExitDoor;

  const posterCacheRef = useRef<Record<string, HTMLImageElement>>({});

  // Cache poster images for chosen movies
  useEffect(() => {
    chosenRecords.forEach((rec) => {
      const url = rec.movie.customPosterUrl;
      if (url && !posterCacheRef.current[url]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url === '/couple-reference.jpg' ? './couple-reference.jpg' : url;
        posterCacheRef.current[url] = img;
      }
    });
  }, [chosenRecords]);

  // Keep activeIdx within bounds when movies are added or removed
  useEffect(() => {
    if (chosenRecords.length > 0) {
      const clamped = Math.min(activeIdx, chosenRecords.length - 1);
      setActiveIdx(clamped);
      const dest = FIRST_FRAME_X + clamped * FRAME_SPACING;
      targetXRef.current = dest;
    } else {
      setActiveIdx(0);
      targetXRef.current = 150;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenRecords.length]);

  // Keyboard walking inside the Trophy Room
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      } else if (e.key === 'Enter' || e.key === ' ') {
        const rec = chosenRecords[activeIdxRef.current];
        if (rec) {
          e.preventDefault();
          onInspectMovie(rec.movie);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const rec = chosenRecords[activeIdxRef.current];
        if (rec) {
          e.preventDefault();
          handleRemoveWithSound(rec.recordId);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenRecords, onInspectMovie]);

  const handleRemoveWithSound = (recordId: string) => {
    soundEngine.playVhsStatic(0.2, 0.16);
    onRemoveRecord(recordId);
  };

  const walkToFrame = (idx: number, openModal: boolean = false) => {
    if (chosenRecords.length === 0) return;
    const clamped = Math.max(0, Math.min(chosenRecords.length - 1, idx));
    const dest = FIRST_FRAME_X + clamped * FRAME_SPACING;
    targetXRef.current = dest;
    setActiveIdx(clamped);
    soundEngine.playRomanticChime();
    if (openModal) {
      onInspectMovie(chosenRecords[clamped].movie);
    }
  };

  // Main 2D Pixel Art Trophy Hall Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;

      // 1. Update Couple Position
      if (keysRef.current.left) {
        coupleXRef.current = Math.max(65, coupleXRef.current - 1.6);
        targetXRef.current = coupleXRef.current;
        isWalkingRef.current = true;
      } else if (keysRef.current.right) {
        coupleXRef.current = Math.min(worldWidth - 65, coupleXRef.current + 1.6);
        targetXRef.current = coupleXRef.current;
        isWalkingRef.current = true;
      } else if (Math.abs(targetXRef.current - coupleXRef.current) > 2) {
        const diff = targetXRef.current - coupleXRef.current;
        const speed = Math.min(2.5, Math.max(1.1, Math.abs(diff) * 0.06));
        coupleXRef.current += Math.sign(diff) * speed;
        isWalkingRef.current = true;
      } else {
        isWalkingRef.current = false;
      }

      if (isWalkingRef.current && frame % 16 === 0) {
        soundEngine.playFootstep();
      }

      if (chosenRecords.length > 0) {
        const nearest = Math.max(
          0,
          Math.min(
            chosenRecords.length - 1,
            Math.round((coupleXRef.current - FIRST_FRAME_X) / FRAME_SPACING)
          )
        );
        if (nearest !== activeIdxRef.current) {
          setActiveIdx(nearest);
        }
      }

      const desiredCamX = Math.max(
        0,
        Math.min(worldWidth - VIEW_W, coupleXRef.current - VIEW_W / 2)
      );
      cameraXRef.current += (desiredCamX - cameraXRef.current) * 0.12;
      const camX = Math.round(cameraXRef.current);

      // ======================================================================
      // 1. GOTHIC TROPHY SANCTUARY WALLS & STONE ARCHES
      // ======================================================================
      ctx.fillStyle = '#0c0814';
      ctx.fillRect(0, 0, VIEW_W, 148);

      // Subtle Gothic Stone Brick & Velvet Panels
      ctx.fillStyle = '#140d21';
      for (let wx = -(camX % 36); wx < VIEW_W; wx += 36) {
        ctx.fillRect(wx + 2, 14, 30, 92);
        ctx.fillStyle = '#1d122e';
        ctx.fillRect(wx + 6, 20, 22, 80);
        ctx.fillStyle = '#140d21';
      }

      // Gold & Crimson Ceiling Border
      ctx.fillStyle = '#1c1018';
      ctx.fillRect(0, 0, VIEW_W, 12);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 12, VIEW_W, 2);

      // Dark Carved Wainscoting
      ctx.fillStyle = '#120b12';
      ctx.fillRect(0, 108, VIEW_W, 40);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 108, VIEW_W, 2);
      ctx.fillRect(0, 146, VIEW_W, 2);

      // ======================================================================
      // 2. FLOOR & ROYAL BURGUNDY/GOLD SANCTUARY CARPET
      // ======================================================================
      ctx.fillStyle = '#09060c';
      ctx.fillRect(0, 148, VIEW_W, VIEW_H - 148);

      ctx.fillStyle = '#2e0714';
      ctx.fillRect(0, 156, VIEW_W, 38);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(0, 156, VIEW_W, 2);
      ctx.fillRect(0, 192, VIEW_W, 2);

      // ======================================================================
      // 3. LEFT ENTRANCE ARCHWAY (Back to Main Corridor) & COZY FIREPLACE!
      // ======================================================================
      const doorSX = Math.round(32 - camX);
      if (doorSX > -50 && doorSX < VIEW_W) {
        ctx.fillStyle = '#26141e';
        ctx.fillRect(doorSX, 74, 38, 74);
        ctx.strokeStyle = hoveredExitDoorRef.current ? '#fbbf24' : '#78350f';
        ctx.strokeRect(doorSX, 74, 38, 74);
        ctx.fillStyle = '#140910';
        ctx.fillRect(doorSX + 5, 80, 28, 68);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(doorSX + 12, 64, 14, 6);
      }

      // Cozy Gothic Fireplace at x = 105!
      const fireSX = Math.round(92 - camX);
      if (fireSX > -60 && fireSX < VIEW_W) {
        ctx.fillStyle = '#27202c';
        ctx.fillRect(fireSX, 92, 42, 56);
        ctx.fillStyle = '#3f3446';
        ctx.fillRect(fireSX - 4, 88, 50, 6);
        ctx.fillStyle = '#070508';
        ctx.fillRect(fireSX + 8, 110, 26, 38);
        const fShift = Math.floor(frame / 5) % 3;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(fireSX + 12, 126 - fShift, 18, 20 + fShift);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(fireSX + 15, 130 + fShift, 12, 16 - fShift);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(fireSX + 18, 136, 6, 10);
        const fireGlow = ctx.createRadialGradient(
          fireSX + 21,
          138,
          4,
          fireSX + 21,
          138,
          55
        );
        fireGlow.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
        fireGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fireGlow;
        ctx.fillRect(fireSX - 34, 90, 110, 100);
        drawPixelHeart(ctx, fireSX + 21, 78, '#ef4444');
      }

      // ======================================================================
      // 4. CHOSEN MOVIE TROPHY PAINTINGS ON THE WALL
      // ======================================================================
      if (chosenRecords.length === 0) {
        const emptySX = Math.round(FIRST_FRAME_X - camX);
        const fw = 56;
        const fh = 76;
        const fx = emptySX - Math.floor(fw / 2);
        const fy = 26;
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.strokeRect(fx, fy, fw, fh);
        ctx.fillStyle = '#0b0712';
        ctx.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);
        drawPixelHeart(ctx, emptySX, fy + Math.floor(fh / 2), '#991b1b');
      } else {
        chosenRecords.forEach((rec, idx) => {
          const worldFX = FIRST_FRAME_X + idx * FRAME_SPACING;
          const screenX = Math.round(worldFX - camX);
          if (screenX < -70 || screenX > VIEW_W + 70) return;

          const isCurrent = idx === activeIdxRef.current;
          const isHovered = idx === hoveredIdxRef.current;
          const isHighlighted = isCurrent || isHovered;

          const fw = 56;
          const fh = 76;
          const fx = screenX - Math.floor(fw / 2);
          const fy = 24;

          if (isHighlighted) {
            const spot = ctx.createRadialGradient(
              screenX,
              fy + 25,
              4,
              screenX,
              fy + 38,
              60
            );
            spot.addColorStop(0, 'rgba(251, 191, 36, 0.38)');
            spot.addColorStop(0.55, 'rgba(220, 38, 38, 0.16)');
            spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = spot;
            ctx.fillRect(screenX - 60, fy - 12, 120, 120);
          }

          ctx.fillStyle = '#b45309';
          ctx.fillRect(screenX - 11, fy - 6, 22, 3);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(screenX - 8, fy - 3, 16, 2);

          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(fx + 3, fy + 3, fw, fh);

          ctx.fillStyle = isHighlighted ? '#fbbf24' : '#b45309';
          ctx.fillRect(fx, fy, fw, fh);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(fx, fy, 4, 4);
          ctx.fillRect(fx + fw - 4, fy, 4, 4);
          ctx.fillRect(fx, fy + fh - 4, 4, 4);
          ctx.fillRect(fx + fw - 4, fy + fh - 4, 4, 4);

          ctx.fillStyle = '#14050a';
          ctx.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);

          const ix = fx + 5;
          const iy = fy + 5;
          const iw = fw - 10;
          const ih = fh - 10;
          const cached = rec.movie.customPosterUrl
            ? posterCacheRef.current[rec.movie.customPosterUrl]
            : undefined;

          if (cached && cached.complete && cached.naturalWidth > 0) {
            ctx.drawImage(cached, ix, iy, iw, ih);
          } else {
            ctx.fillStyle = '#240812';
            ctx.fillRect(ix, iy, iw, ih);
            drawPixelHeart(ctx, screenX, iy + Math.floor(ih / 2), '#ef4444');
          }

          ctx.fillStyle = '#dc2626';
          ctx.fillRect(fx + fw - 9, fy + fh - 9, 7, 7);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(fx + fw - 7, fy + fh - 7, 3, 3);

          ctx.fillStyle = isHighlighted ? '#451a03' : '#1c120c';
          ctx.fillRect(screenX - 20, fy + fh + 3, 40, 9);
          ctx.strokeStyle = isHighlighted ? '#fbbf24' : '#78350f';
          ctx.strokeRect(screenX - 20, fy + fh + 3, 40, 9);
          drawPixelHeart(ctx, screenX, fy + fh + 7, '#ef4444');
        });
      }

      // ======================================================================
      // 5. PIXEL ART CALDAS & ANINHA WALKING TOGETHER IN THE TROPHY ROOM
      // ======================================================================
      const coupleSX = Math.round(coupleXRef.current - camX);
      const coupleSY = 176;

      const aura = ctx.createRadialGradient(
        coupleSX + 6,
        coupleSY - 18,
        4,
        coupleSX,
        coupleSY - 18,
        62
      );
      aura.addColorStop(0, 'rgba(245, 158, 11, 0.34)');
      aura.addColorStop(0.55, 'rgba(220, 38, 38, 0.14)');
      aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = aura;
      ctx.fillRect(coupleSX - 62, coupleSY - 78, 124, 96);

      const animState = {
        frame,
        isWalking: isWalkingRef.current,
        facing: 'right' as const,
        isScared: false,
        isLookingBack: false,
        isHoldingHands: true,
        blink: frame % 105 > 100,
      };

      drawAninhaPixelSprite(ctx, coupleSX - 8, coupleSY, coupleConfig.her, animState);
      drawCaldasPixelSprite(
        ctx,
        coupleSX + 8,
        coupleSY,
        coupleConfig.him,
        animState,
        coupleConfig.lanternColor
      );

      const heartBob = Math.sin(frame * 0.08) * 1.5;
      drawPixelHeart(ctx, coupleSX - 1, coupleSY - 39 + heartBob, '#dc2626');

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [chosenRecords, coupleConfig, reducedMotion, worldWidth]);

  const getWorldCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const viewX = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const viewY = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    const worldX = viewX + cameraXRef.current;
    return { viewX, viewY, worldX };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { viewY, worldX } = getWorldCoords(e);
    setHoveredExitDoor(worldX >= 28 && worldX <= 74 && viewY >= 70 && viewY <= 150);

    let found: number | null = null;
    if (viewY >= 20 && viewY <= 112) {
      chosenRecords.forEach((_, idx) => {
        const px = FIRST_FRAME_X + idx * FRAME_SPACING;
        if (Math.abs(worldX - px) <= 30) {
          found = idx;
        }
      });
    }
    setHoveredIdx(found);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { viewY, worldX } = getWorldCoords(e);

    if (worldX >= 28 && worldX <= 74 && viewY >= 70 && viewY <= 150) {
      soundEngine.playDoorCreak();
      onBackToCorridor();
      return;
    }

    if (viewY >= 20 && viewY <= 112) {
      for (let idx = 0; idx < chosenRecords.length; idx++) {
        const px = FIRST_FRAME_X + idx * FRAME_SPACING;
        if (Math.abs(worldX - px) <= 32) {
          walkToFrame(idx, true);
          return;
        }
      }
    }

    targetXRef.current = Math.max(65, Math.min(worldWidth - 65, worldX));
  };

  const activeRecord = chosenRecords[activeIdx] || null;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 pt-2 pb-12 select-none space-y-6">
      {/* 2D PIXEL ART CHOSEN MOVIES HALL STAGE */}
      <div className="relative border-2 border-amber-700/80 bg-[#08050d] shadow-[0_0_70px_rgba(0,0,0,0.95),0_0_35px_rgba(217,119,6,0.22)] overflow-hidden">
        {/* Top Banner */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#120b1d] border-b border-amber-800/60">
          <div className="flex items-center gap-2.5">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-amber-300 tracking-wider uppercase">
              SALA VIP DO CINEMA // FILMES JÁ ESCOLHIDOS ({chosenRecords.length}{' '}
              {chosenRecords.length === 1 ? 'SESSÃO' : 'SESSÕES'})
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playDoorCreak();
              onBackToCorridor();
            }}
            className="px-3 py-1 bg-[#260912] hover:bg-[#420d1d] border border-red-600/80 text-red-100 font-vt text-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Voltar ao Foyer do Cinema</span>
          </button>
        </div>

        {/* Pixel Art Room Canvas */}
        <div className="relative w-full aspect-[420/215] max-h-[500px] bg-[#08050d]">
          <canvas
            ref={canvasRef}
            width={VIEW_W}
            height={VIEW_H}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              setHoveredIdx(null);
              setHoveredExitDoor(false);
            }}
            onClick={handleCanvasClick}
            className={`w-full h-full object-cover pixelated ${
              hoveredIdx !== null || hoveredExitDoor
                ? 'cursor-pointer'
                : 'cursor-crosshair'
            }`}
          />

          <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-35" />

          {hoveredExitDoor && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-black/90 border border-amber-500 text-amber-200 font-vt text-base">
              Porta para o Corredor Principal de Escolha
            </div>
          )}

          {hoveredIdx !== null && chosenRecords[hoveredIdx] && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-black/90 border border-amber-400 text-amber-200 font-vt text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>
                Sessão #{chosenRecords[hoveredIdx].sessionNumber}:{' '}
                <strong>{chosenRecords[hoveredIdx].movie.title}</strong> (
                {chosenRecords[hoveredIdx].chosenAtFormatted})
              </span>
            </div>
          )}

          {/* Left / Right Walk Arrows */}
          {chosenRecords.length > 1 && (
            <>
              <button
                onClick={() => walkToFrame(activeIdx - 1)}
                disabled={activeIdx <= 0}
                className="absolute left-1.5 sm:left-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2.5 bg-black/80 hover:bg-amber-950/90 disabled:opacity-20 border border-amber-700/70 text-amber-200 transition cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => walkToFrame(activeIdx + 1)}
                disabled={activeIdx >= chosenRecords.length - 1}
                className="absolute right-1.5 sm:right-2.5 top-1/2 -translate-y-1/2 p-1.5 sm:p-2.5 bg-black/80 hover:bg-amber-950/90 disabled:opacity-20 border border-amber-700/70 text-amber-200 transition cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Details of Active Chosen Movie (Clean Side-by-Side Layout on Mobile & Desktop) */}
        {activeRecord ? (
          <>
            <div className="bg-[#0d0814] border-t-2 border-amber-800/70 p-3 sm:p-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4">
                <div className="flex flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                  <div
                    onClick={() => onInspectMovie(activeRecord.movie)}
                    className="w-18 sm:w-24 aspect-[2/3] border-2 border-amber-500 bg-black p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0 cursor-pointer overflow-hidden"
                  >
                    {activeRecord.movie.customPosterUrl ? (
                      <img
                        src={activeRecord.movie.customPosterUrl}
                        alt={activeRecord.movie.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-950/30 flex items-center justify-center font-pixel text-[8px] text-amber-300 text-center p-1">
                        {activeRecord.movie.title}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-vt tracking-wider uppercase">
                      <span className="px-1.5 py-0.5 bg-amber-950/90 border border-amber-600/80 text-amber-200 flex items-center gap-1">
                        <Award className="w-3 h-3 text-amber-400" />
                        SESSÃO #{activeRecord.sessionNumber}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#f5c518] text-black font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-black text-black" />
                        {activeRecord.movie.imdbRating || '7.2'}
                      </span>
                      <span className="text-amber-300/90 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {activeRecord.chosenAtFormatted}
                      </span>
                    </div>

                    <h2 className="font-gothic text-lg sm:text-3xl text-white truncate">
                      {activeRecord.movie.title} ({activeRecord.movie.year})
                    </h2>

                    <p className="font-serif-horror text-xs sm:text-sm text-zinc-300 line-clamp-2">
                      {activeRecord.movie.synopsis}
                    </p>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 shrink-0 pt-1 lg:pt-0 border-t border-amber-950/60 lg:border-t-0">
                  <button
                    onClick={() => onInspectMovie(activeRecord.movie)}
                    className="flex-1 lg:flex-initial px-4 py-2.5 bg-amber-900/60 hover:bg-amber-800/80 border border-amber-500 text-amber-100 font-pixel text-[9px] sm:text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ficha do Filme</span>
                  </button>

                  <button
                    onClick={() => handleRemoveWithSound(activeRecord.recordId)}
                    className="px-3.5 py-2.5 bg-[#3b0912] hover:bg-red-800 border border-red-500/80 text-red-100 font-pixel text-[9px] sm:text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Remover este filme da Sala VIP"
                  >
                    <Trash2 className="w-4 h-4 text-red-300" />
                    <span className="hidden sm:inline">Remover</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Clean Strip of Chosen Movies */}
            <div className="bg-[#07040b] border-t border-amber-950/70 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
              <span className="font-pixel text-[8px] text-amber-500/80 uppercase tracking-wider shrink-0 mr-1">
                Sessões ({chosenRecords.length}):
              </span>
              {chosenRecords.map((rec, idx) => {
                const isCurrent = idx === activeIdx;
                return (
                  <button
                    key={rec.recordId}
                    onClick={() => walkToFrame(idx, false)}
                    className={`px-2.5 py-1 border font-vt text-xs sm:text-sm flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                      isCurrent
                        ? 'bg-[#3b1a08] border-amber-400 text-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                        : 'bg-[#110918] border-zinc-800 text-zinc-400 hover:border-amber-700 hover:text-zinc-200'
                    }`}
                  >
                    <Award
                      className={`w-3 h-3 ${
                        isCurrent ? 'text-amber-400' : 'text-amber-700'
                      }`}
                    />
                    <span>
                      #{rec.sessionNumber} {rec.movie.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-[#0d0814] border-t-2 border-amber-800/70 p-6 text-center space-y-3">
            <p className="font-gothic text-xl sm:text-2xl text-amber-200">
              O Salão dos Filmes Escolhidos Está Vazio no Momento
            </p>
            <p className="font-serif-horror italic text-base text-zinc-400 max-w-xl mx-auto">
              Sempre que vocês escolherem um filme no corredor principal e completarem o ritual, ele ficará eternizado aqui em um quadro dourado com a data da sessão de vocês!
            </p>
            <button
              onClick={onBackToCorridor}
              className="px-6 py-3 bg-[#6b0913] hover:bg-[#991b1b] border border-red-500 text-white font-pixel text-[10px] uppercase tracking-widest inline-flex items-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>Ir ao Corredor Escolher Nosso Filme</span>
            </button>
          </div>
        )}
      </div>

      {/* ALL CHOSEN MOVIES TROPHY WALL GRID BELOW */}
      {chosenRecords.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-amber-900/50 pb-2">
            <h3 className="font-gothic text-lg sm:text-2xl text-amber-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Coleção Completa de Filmes Já Escolhidos ({chosenRecords.length})</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {chosenRecords.map((rec, idx) => (
              <div
                key={rec.recordId}
                onClick={() => walkToFrame(idx, true)}
                className={`group relative bg-[#0c0712] border-2 p-2.5 transition cursor-pointer flex flex-col justify-between ${
                  idx === activeIdx
                    ? 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]'
                    : 'border-amber-900/60 hover:border-amber-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-vt text-amber-400 mb-1.5">
                    <span>SESSÃO #{rec.sessionNumber}</span>
                    {isHorrorMovie(rec.movie) ? (
                      <span className="flex items-center gap-0.5 text-red-400">
                        <Skull className="w-3 h-3" />
                        {rec.movie.fearLevel}/5
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-amber-300">
                        <Heart className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {rec.movie.fearLevel}/5
                      </span>
                    )}
                  </div>

                  <div className="aspect-[2/3] w-full bg-black border border-amber-700/60 overflow-hidden mb-2 relative">
                    {rec.movie.customPosterUrl ? (
                      <img
                        src={rec.movie.customPosterUrl}
                        alt={rec.movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-pixel text-[8px] text-amber-300 p-2 text-center">
                        {rec.movie.title}
                      </div>
                    )}
                  </div>

                  <h4 className="font-gothic text-sm sm:text-base text-white truncate">
                    {rec.movie.title}
                  </h4>
                </div>

                <div className="pt-2 mt-2 border-t border-amber-950/80 space-y-2">
                  <div className="text-[11px] font-vt text-zinc-400">
                    Escolhido em: {rec.chosenAtFormatted}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveWithSound(rec.recordId);
                    }}
                    className="w-full py-1.5 px-2 bg-[#2b0810] hover:bg-red-800 border border-red-700/80 text-red-200 hover:text-white font-vt text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Remover este filme do Salão dos Escolhidos"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover do Salão</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
