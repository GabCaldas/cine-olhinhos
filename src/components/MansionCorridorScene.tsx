import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CoupleConfig, EasterEggId, MovieTemplate } from '../types/horror';
import {
  drawAninhaPixelSprite,
  drawCaldasPixelSprite,
  drawGhostButlerSprite,
  drawMinionPixelSprite,
  drawFantasticMrFoxSprite,
  drawMegamindSprite,
  drawEeaaoRocksSprite,
  drawWildRobotSprite,
  drawTotoroSprite,
  drawTeenBeachSprite,
  drawPitchPerfectSprite,
  drawPixelHeart,
} from '../utils/pixelSprites';
import { EASTER_EGGS } from '../data/easterEggs';
import { getMovieStreamingOffers } from '../utils/movieAutoFill';
import { isHorrorMovie } from '../utils/horrorAiAnalyzer';
import { soundEngine } from '../utils/soundEngine';
import {
  Eye,
  Flame,
  Skull,
  Footprints,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Activity,
  Star,
  Bot,
  Trash2,
  Tv,
  Film,
  Clapperboard,
} from 'lucide-react';

interface MansionCorridorSceneProps {
  movies: MovieTemplate[];
  chosenCount: number;
  coupleConfig: CoupleConfig;
  reducedMotion: boolean;
  discoveredEggs: EasterEggId[];
  agentTargetMovieId?: string | null;
  onClearAgentTarget?: () => void;
  onDiscoverEgg: (id: EasterEggId) => void;
  onSelectMovie: (movie: MovieTemplate) => void;
  onDirectConfirmMovie: (movie: MovieTemplate) => void;
  onRemoveMovieFromWall?: (movieId: string) => void;
  onEnterChosenHall: () => void;
  onOpenButlerAgent: () => void;
}

const VIEW_W = 420;
const VIEW_H = 215;
const FIRST_PAINTING_X = 160;
const PAINTING_SPACING = 150;

interface CorridorProp {
  id: EasterEggId;
  x: number;
  y: number;
  w: number;
  h: number;
  promptLabel: string;
}

export const MansionCorridorScene: React.FC<MansionCorridorSceneProps> = ({
  movies,
  chosenCount,
  coupleConfig,
  reducedMotion,
  discoveredEggs,
  agentTargetMovieId,
  onClearAgentTarget,
  onDiscoverEgg,
  onSelectMovie,
  onDirectConfirmMovie,
  onRemoveMovieFromWall,
  onEnterChosenHall,
  onOpenButlerAgent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const visibleMovies = useMemo(
    () =>
      movies.filter(
        (m) => !m.isSecret || discoveredEggs.includes('secret_vhs')
      ),
    [movies, discoveredEggs]
  );

  const worldWidth = Math.max(
    1180,
    FIRST_PAINTING_X + visibleMovies.length * PAINTING_SPACING + 160
  );

  const coupleXRef = useRef<number>(FIRST_PAINTING_X);
  const targetXRef = useRef<number>(FIRST_PAINTING_X);
  const cameraXRef = useRef<number>(0);
  const isWalkingRef = useRef<boolean>(false);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });

  const [activePaintingIdx, setActivePaintingIdx] = useState<number>(0);
  const activePaintingIdxRef = useRef<number>(0);
  activePaintingIdxRef.current = activePaintingIdx;

  const [hoveredPaintingIdx, setHoveredPaintingIdx] = useState<number | null>(null);
  const hoveredPaintingIdxRef = useRef<number | null>(null);
  hoveredPaintingIdxRef.current = hoveredPaintingIdx;

  const [hoveredProp, setHoveredProp] = useState<EasterEggId | null>(null);
  const hoveredPropRef = useRef<EasterEggId | null>(null);
  hoveredPropRef.current = hoveredProp;

  const [hoveredButler, setHoveredButler] = useState<boolean>(false);
  const hoveredButlerRef = useRef<boolean>(false);
  hoveredButlerRef.current = hoveredButler;

  // Walk once when George guides the couple to a specific movie, then clear target so movement never locks
  useEffect(() => {
    if (!agentTargetMovieId) return;
    const idx = visibleMovies.findIndex((m) => m.id === agentTargetMovieId);
    if (idx >= 0) {
      const destX = FIRST_PAINTING_X + idx * PAINTING_SPACING;
      targetXRef.current = destX;
      setActivePaintingIdx(idx);
    }
    if (onClearAgentTarget) {
      onClearAgentTarget();
    }
  }, [agentTargetMovieId, visibleMovies, onClearAgentTarget]);

  // Keep activePaintingIdx and targetXRef in bounds if a painting is removed from the wall
  useEffect(() => {
    if (visibleMovies.length > 0 && activePaintingIdx >= visibleMovies.length) {
      const lastIdx = visibleMovies.length - 1;
      setActivePaintingIdx(lastIdx);
      const maxDestX = FIRST_PAINTING_X + lastIdx * PAINTING_SPACING;
      targetXRef.current = Math.min(targetXRef.current, maxDestX);
    }
  }, [visibleMovies.length, activePaintingIdx]);

  // Tracks which cinema Easter Egg is currently in its triggered/animated state
  const triggeredPropsRef = useRef<Record<string, number>>({});

  const [eventMessage, setEventMessage] = useState<{
    title: string;
    location: string;
    text: string;
  } | null>(null);

  const posterImagesRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    visibleMovies.forEach((m) => {
      if (m.customPosterUrl && !posterImagesRef.current[m.customPosterUrl]) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src =
          m.customPosterUrl === '/couple-reference.jpg'
            ? './couple-reference.jpg'
            : m.customPosterUrl;
        posterImagesRef.current[m.customPosterUrl] = img;
      }
    });
  }, [visibleMovies]);

  // 9 Interactive Cinema Easter Eggs placed along the Grand Cine Olhinhos Gallery!
  const getCorridorProps = useCallback((): CorridorProp[] => {
    return [
      {
        id: 'hidden_minion',
        x: 68,
        y: 94,
        w: 28,
        h: 54,
        promptLabel: 'Máquina de Pipoca Retrô... tem alguém lá dentro! [Clique para abrir]',
      },
      {
        id: 'fantastic_mr_fox',
        x: FIRST_PAINTING_X + 64,
        y: 102,
        w: 30,
        h: 46,
        promptLabel: 'Adega de Cidra Dourada & Cauda de Raposa... [Clique para assobiar]',
      },
      {
        id: 'megamind',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 1 + 64,
        y: 80,
        w: 30,
        h: 68,
        promptLabel: 'Gerador de Raios Azuis & Capa Negra... [Clique para APRESENTAÇÃO!]',
      },
      {
        id: 'eeaao_rocks',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 2 + 62,
        y: 106,
        w: 32,
        h: 42,
        promptLabel: 'Pedestal do Multiverso: Duas Pedras no Deserto... [Clique para observar]',
      },
      {
        id: 'wild_robot',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 3 + 62,
        y: 96,
        w: 32,
        h: 52,
        promptLabel: 'Jardim Iluminado: Unidade ROZZUM 7134 & Bico-Vivo... [Clique para ativar]',
      },
      {
        id: 'totoro',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 4 + 62,
        y: 86,
        w: 32,
        h: 62,
        promptLabel: 'Ponto de Ônibus & Guarda-Chuva Vermelho... [Clique para chamar Totoro]',
      },
      {
        id: 'teen_beach',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 5 + 62,
        y: 96,
        w: 32,
        h: 52,
        promptLabel: 'Prancha de Surf Anos 60 & Jaqueta Biker... [Clique para pegar onda]',
      },
      {
        id: 'pitch_perfect',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 6 + 60,
        y: 104,
        w: 30,
        h: 44,
        promptLabel: 'Copo Azul & Microfone das Barden Bellas... [Clique para o Cup Song!]',
      },
      {
        id: 'secret_vhs',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 6 + 102,
        y: 64,
        w: 28,
        h: 84,
        promptLabel: 'Projetor Cinematográfico 35mm Dourado... [Clique para abrir a Bobina #00]',
      },
    ];
  }, []);

  const handleTriggerProp = useCallback(
    (id: EasterEggId) => {
      const info = EASTER_EGGS[id];
      triggeredPropsRef.current[id] = Date.now() + 6500;
      onDiscoverEgg(id);

      setEventMessage({
        title: info.title,
        location: info.location,
        text: info.discoveryText,
      });

      if (id === 'hidden_minion') {
        soundEngine.playMinionSound();
      } else if (id === 'fantastic_mr_fox') {
        soundEngine.playMrFoxWhistleClick();
      } else if (id === 'megamind') {
        soundEngine.playMegamindSynth();
      } else if (id === 'eeaao_rocks') {
        soundEngine.playEeaaoRocksChime();
      } else if (id === 'wild_robot') {
        soundEngine.playWildRobotChime();
      } else if (id === 'totoro') {
        soundEngine.playTotoroMelody();
      } else if (id === 'teen_beach') {
        soundEngine.playTeenBeachSurf();
      } else if (id === 'pitch_perfect') {
        soundEngine.playPitchPerfectCupSong();
      } else {
        soundEngine.playRomanticChime();
      }
    },
    [onDiscoverEgg]
  );

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      } else if (e.key === 'Enter' || e.key === ' ') {
        const currentMovie = visibleMovies[activePaintingIdxRef.current];
        if (currentMovie) {
          e.preventDefault();
          soundEngine.playRomanticChime();
          onSelectMovie(currentMovie);
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
  }, [onSelectMovie, visibleMovies]);

  const walkToPainting = (idx: number, openImmediately: boolean = false) => {
    const clampedIdx = Math.max(0, Math.min(visibleMovies.length - 1, idx));
    const destX = FIRST_PAINTING_X + clampedIdx * PAINTING_SPACING;
    targetXRef.current = destX;
    setActivePaintingIdx(clampedIdx);
    soundEngine.playFootstep();

    if (openImmediately || Math.abs(coupleXRef.current - destX) < 28) {
      onSelectMovie(visibleMovies[clampedIdx]);
    }
  };

  // Main 60FPS 2D Pixel Art Grand Cinema Lobby & Gallery Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      frame++;
      const now = Date.now();

      if (keysRef.current.left) {
        coupleXRef.current = Math.max(70, coupleXRef.current - 1.65);
        targetXRef.current = coupleXRef.current;
        isWalkingRef.current = true;
      } else if (keysRef.current.right) {
        coupleXRef.current = Math.min(worldWidth - 70, coupleXRef.current + 1.65);
        targetXRef.current = coupleXRef.current;
        isWalkingRef.current = true;
      } else if (Math.abs(targetXRef.current - coupleXRef.current) > 2) {
        const diff = targetXRef.current - coupleXRef.current;
        const speed = Math.min(2.6, Math.max(1.2, Math.abs(diff) * 0.06));
        coupleXRef.current += Math.sign(diff) * speed;
        isWalkingRef.current = true;
      } else {
        isWalkingRef.current = false;
      }

      if (isWalkingRef.current && frame % 15 === 0) {
        soundEngine.playFootstep();
      }

      if (visibleMovies.length > 0) {
        const nearestIdx = Math.max(
          0,
          Math.min(
            visibleMovies.length - 1,
            Math.round((coupleXRef.current - FIRST_PAINTING_X) / PAINTING_SPACING)
          )
        );
        if (nearestIdx !== activePaintingIdxRef.current) {
          setActivePaintingIdx(nearestIdx);
        }
      }

      const desiredCamX = Math.max(
        0,
        Math.min(worldWidth - VIEW_W, coupleXRef.current - VIEW_W / 2)
      );
      cameraXRef.current += (desiredCamX - cameraXRef.current) * 0.12;
      const camX = Math.round(cameraXRef.current);

      // ======================================================================
      // 1. GRAND CINEMA ART DECO WALLS, VELVET DRAPES & WAINSCOTING
      // ======================================================================
      ctx.fillStyle = '#0a0f1f';
      ctx.fillRect(0, 0, VIEW_W, 148);

      // Royal Navy & Burgundy Cinema Wall Panels
      ctx.fillStyle = '#11182d';
      for (let wx = -(camX % 28); wx < VIEW_W; wx += 28) {
        ctx.fillRect(wx + 2, 14, 22, 92);
        ctx.fillStyle = '#19223d';
        ctx.fillRect(wx + 6, 22, 14, 76);
        ctx.fillStyle = '#11182d';
      }

      // Gold Art Deco Ceiling Molding
      ctx.fillStyle = '#450a14';
      ctx.fillRect(0, 0, VIEW_W, 11);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, 11, VIEW_W, 2);

      // Warm Walnut & Gold Cinema Wainscoting
      ctx.fillStyle = '#1c1218';
      ctx.fillRect(0, 108, VIEW_W, 40);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 108, VIEW_W, 2);
      ctx.fillRect(0, 146, VIEW_W, 2);
      for (let px = -(camX % 32); px < VIEW_W; px += 32) {
        ctx.strokeStyle = '#3b211e';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 4, 114, 24, 28);
      }

      // ======================================================================
      // 2. POLISHED FLOOR & STAR-SPANGLED GRAND CINEMA CARPET RUNNER
      // ======================================================================
      ctx.fillStyle = '#090c15';
      ctx.fillRect(0, 148, VIEW_W, VIEW_H - 148);

      // Plush Crimson & Gold Cinema Runner
      ctx.fillStyle = '#58111e';
      ctx.fillRect(0, 156, VIEW_W, 38);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(0, 156, VIEW_W, 2);
      ctx.fillRect(0, 192, VIEW_W, 2);
      // Golden stars woven into the cinema carpet
      ctx.fillStyle = '#d97706';
      for (let cx = -(camX % 32); cx < VIEW_W; cx += 32) {
        ctx.fillRect(cx + 12, 173, 4, 4);
        ctx.fillRect(cx + 13, 172, 2, 6);
        ctx.fillRect(cx + 11, 174, 6, 2);
      }

      // Cinema Lobby Velvet Double Entrance Doors at Left End
      const entranceSX = Math.round(22 - camX);
      if (entranceSX > -50 && entranceSX < VIEW_W) {
        ctx.fillStyle = '#581c28';
        ctx.fillRect(entranceSX, 74, 34, 74);
        ctx.strokeStyle = '#fbbf24';
        ctx.strokeRect(entranceSX, 74, 34, 74);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(entranceSX + 5, 82, 10, 22);
        ctx.fillRect(entranceSX + 19, 82, 10, 22);
      }

      // ======================================================================
      // 2.5 REVIVED GEORGE: O CONCIERGE & CURADOR CINÉFILO (EM PIXEL ART)
      // ======================================================================
      const butlerWorldX = 112;
      const butlerSX = Math.round(butlerWorldX - camX);
      if (butlerSX > -40 && butlerSX < VIEW_W + 40) {
        // Golden Cinema Concierge Podium beside George
        ctx.fillStyle = '#450a14';
        ctx.fillRect(butlerSX - 10, 134, 8, 20);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(butlerSX - 12, 132, 12, 3);
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(butlerSX - 11, 130, 10, 2);

        drawGhostButlerSprite(
          ctx,
          butlerSX,
          152,
          frame,
          hoveredButlerRef.current
        );
      }

      // ======================================================================
      // 3. THE 9 INTERACTIVE CINEMA EASTER EGGS IN THE LOBBY
      // ======================================================================
      const props = getCorridorProps();
      props.forEach((prop) => {
        const sx = Math.round(prop.x - camX);
        if (sx + prop.w < -40 || sx > VIEW_W + 40) return;

        const isHovered = hoveredPropRef.current === prop.id;
        const isActive = (triggeredPropsRef.current[prop.id] || 0) > now;
        const showEffect = isActive || isHovered;

        if (prop.id === 'hidden_minion') {
          // 1. Vintage Red & Gold Cinema Popcorn Machine Cart (with Minion inside!)
          const pxCart = sx + 2;
          const pyCart = prop.y;
          // Lower Red & Gold Cart Base
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(pxCart, pyCart + 28, 24, 24);
          ctx.strokeStyle = '#fbbf24';
          ctx.strokeRect(pxCart, pyCart + 28, 24, 24);
          // Glass Kettle Chamber
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.fillRect(pxCart + 2, pyCart + 6, 20, 22);
          ctx.strokeStyle = '#fbbf24';
          ctx.strokeRect(pxCart + 2, pyCart + 6, 20, 22);
          // Red & White Striped Canopy Roof
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(pxCart, pyCart + 2, 24, 4);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pxCart + 5, pyCart + 2, 4, 4);
          ctx.fillRect(pxCart + 15, pyCart + 2, 4, 4);
          // Heap of golden buttered popcorn at the bottom of the glass
          ctx.fillStyle = '#fde047';
          ctx.fillRect(pxCart + 3, pyCart + 22, 18, 5);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(pxCart + 5, pyCart + 20, 14, 3);

          if (showEffect) {
            // Minion pops right out of the popcorn kettle holding a banana!
            drawMinionPixelSprite(ctx, pxCart + 7, pyCart + 6, frame, true);
          } else {
            // Two silver goggle eyes peeking out from the popcorn heap!
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(pxCart + 8, pyCart + 17, 3, 3);
            ctx.fillRect(pxCart + 13, pyCart + 17, 3, 3);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pxCart + 9, pyCart + 18, 1, 1);
            ctx.fillRect(pxCart + 14, pyCart + 18, 1, 1);
          }
        } else if (prop.id === 'fantastic_mr_fox') {
          // 2. Fantastic Mr. Fox & Golden Apple Cider Display Crate
          ctx.fillStyle = '#451a03';
          ctx.fillRect(sx + 2, prop.y + 26, 26, 20);
          ctx.strokeStyle = isHovered ? '#fbbf24' : '#78350f';
          ctx.strokeRect(sx + 2, prop.y + 26, 26, 20);
          // Sparkling Apple Cider bottles on crate
          ctx.fillStyle = '#facc15';
          ctx.fillRect(sx + 6, prop.y + 20, 3, 6);
          ctx.fillRect(sx + 11, prop.y + 20, 3, 6);
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(sx + 7, prop.y + 18, 1, 2);
          ctx.fillRect(sx + 12, prop.y + 18, 1, 2);

          drawFantasticMrFoxSprite(ctx, sx + 12, prop.y + 6, frame, showEffect);
        } else if (prop.id === 'megamind') {
          // 3. Megamind & His Blue Lightning Presentation Stage
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(sx + 3, prop.y + 10, 24, 56);
          ctx.strokeStyle = showEffect ? '#38bdf8' : '#1e3a8a';
          ctx.strokeRect(sx + 3, prop.y + 10, 24, 56);

          if (showEffect) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
            ctx.fillRect(sx - 4, prop.y, 38, 68);
          }
          drawMegamindSprite(ctx, sx + 9, prop.y + 26, frame, showEffect);
        } else if (prop.id === 'eeaao_rocks') {
          // 4. Everything Everywhere All at Once — The Two Rocks on a Museum Pedestal
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(sx + 4, prop.y + 22, 24, 20);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(sx + 2, prop.y + 20, 28, 2);
          drawEeaaoRocksSprite(ctx, sx + 2, prop.y + 2, frame, showEffect);
        } else if (prop.id === 'wild_robot') {
          // 5. The Wild Robot (Roz & Bico-Vivo) in an Illuminated Planter Box
          ctx.fillStyle = '#14532d';
          ctx.fillRect(sx + 2, prop.y + 34, 28, 16);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(sx + 4, prop.y + 31, 24, 4);
          // Wildflowers
          ctx.fillStyle = '#facc15';
          ctx.fillRect(sx + 6, prop.y + 29, 2, 2);
          ctx.fillStyle = '#f472b6';
          ctx.fillRect(sx + 22, prop.y + 29, 2, 2);
          drawWildRobotSprite(ctx, sx + 8, prop.y + 13, frame, showEffect);
        } else if (prop.id === 'totoro') {
          // 6. My Neighbor Totoro — Retro Japanese Bus Stop Sign & Totoro
          // Bus stop pole & blue/white round sign
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(sx + 4, prop.y + 16, 1, 44);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(sx + 1, prop.y + 8, 7, 7);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(sx + 2, prop.y + 10, 5, 3);
          drawTotoroSprite(ctx, sx + 10, prop.y + 26, frame, showEffect);
        } else if (prop.id === 'teen_beach') {
          // 7. Teen Beach Movie — 60s Surfboard & Biker Jacket Display
          drawTeenBeachSprite(ctx, sx + 3, prop.y + 14, frame, showEffect);
        } else if (prop.id === 'pitch_perfect') {
          // 8. Pitch Perfect — Cup Song Counter & Barden Bellas Mic
          drawPitchPerfectSprite(ctx, sx + 2, prop.y + 14, frame, showEffect);
        } else if (prop.id === 'secret_vhs') {
          // 9. Vintage 35mm Golden Film Projector holding Secret Reel #00!
          const gx = sx + 4;
          const gy = prop.y + 8;
          // Projector Pedestal Stand
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(gx + 2, gy + 30, 16, 46);
          ctx.strokeStyle = '#fbbf24';
          ctx.strokeRect(gx + 2, gy + 30, 16, 46);

          // Projector Body & Lens
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(gx + 3, gy + 14, 14, 16);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(gx + 17, gy + 18, 4, 6); // Brass lens

          // Two 35mm Film Reels on top of projector
          const reelSpin = showEffect || discoveredEggs.includes('secret_vhs');
          ctx.fillStyle = reelSpin ? '#fbbf24' : '#64748b';
          ctx.fillRect(gx + 1, gy + 2, 8, 8);
          ctx.fillRect(gx + 11, gy + 4, 8, 8);
          ctx.fillStyle = '#090d16';
          ctx.fillRect(gx + 4, gy + 5, 2, 2);
          ctx.fillRect(gx + 14, gy + 7, 2, 2);

          // Projector light beam & Secret Golden Reel #00 compartment
          if (reelSpin) {
            ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
            ctx.fillRect(gx + 21, gy + 15, 20, 12);
            // Open compartment revealing Golden Reel #00 & Heart
            ctx.fillStyle = '#090d16';
            ctx.fillRect(gx + 5, gy + 38, 10, 28);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(gx + 6, gy + 48, 8, 8);
            drawPixelHeart(ctx, gx + 10, gy + 42, '#ef4444');
          } else {
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(gx + 13, gy + 50, 2, 2);
          }
        }
      });

      // ======================================================================
      // 4. THE MOVIE SHOWCASE FRAMES ("EM CARTAZ" NA GALERIA DO CINEMA)
      // ======================================================================
      visibleMovies.forEach((movie, idx) => {
        const worldFrameX = FIRST_PAINTING_X + idx * PAINTING_SPACING;
        const screenX = Math.round(worldFrameX - camX);

        if (screenX < -70 || screenX > VIEW_W + 70) return;

        const isCurrent = idx === activePaintingIdxRef.current;
        const isHovered = idx === hoveredPaintingIdxRef.current;
        const isHighlighted = isCurrent || isHovered;
        const movieIsHorror = isHorrorMovie(movie);

        const fw = 54;
        const fh = 74;
        const fx = screenX - Math.floor(fw / 2);
        const fy = 26;

        if (isHighlighted) {
          const spotGrad = ctx.createRadialGradient(
            screenX,
            fy + 25,
            4,
            screenX,
            fy + 38,
            58
          );
          spotGrad.addColorStop(
            0,
            movieIsHorror ? 'rgba(239, 68, 68, 0.34)' : 'rgba(251, 191, 36, 0.38)'
          );
          spotGrad.addColorStop(
            0.55,
            movieIsHorror ? 'rgba(185, 28, 28, 0.14)' : 'rgba(56, 189, 248, 0.14)'
          );
          spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = spotGrad;
          ctx.fillRect(screenX - 58, fy - 12, 116, 116);
        }

        // Brass Cinema Spotlight Bar above Poster
        ctx.fillStyle = '#b45309';
        ctx.fillRect(screenX - 12, fy - 7, 24, 3);
        ctx.fillStyle = isHighlighted ? '#fef08a' : '#fbbf24';
        ctx.fillRect(screenX - 8, fy - 4, 16, 2);

        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(fx + 3, fy + 3, fw, fh);

        // Outer Cinema Frame
        ctx.fillStyle = movie.isSecret
          ? '#e11d48'
          : isHighlighted
          ? '#fbbf24'
          : '#b45309';
        ctx.fillRect(fx, fy, fw, fh);

        // Corner gold studs
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(fx, fy, 4, 4);
        ctx.fillRect(fx + fw - 4, fy, 4, 4);
        ctx.fillRect(fx, fy + fh - 4, 4, 4);
        ctx.fillRect(fx + fw - 4, fy + fh - 4, 4, 4);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);

        const ix = fx + 5;
        const iy = fy + 5;
        const iw = fw - 10;
        const ih = fh - 10;

        const cachedImg = movie.customPosterUrl
          ? posterImagesRef.current[movie.customPosterUrl]
          : undefined;

        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.drawImage(cachedImg, ix, iy, iw, ih);
          if (!isHighlighted) {
            ctx.fillStyle = 'rgba(9, 13, 22, 0.22)';
            ctx.fillRect(ix, iy, iw, ih);
          }
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(ix, iy, iw, ih);
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(ix + 12, iy + 14, iw - 24, ih - 28);
        }

        // Brass Plaque below the Poster Frame
        ctx.fillStyle = isHighlighted ? '#451a03' : '#0f172a';
        ctx.fillRect(screenX - 18, fy + fh + 3, 36, 8);
        ctx.strokeStyle = isHighlighted ? '#fbbf24' : '#78350f';
        ctx.strokeRect(screenX - 18, fy + fh + 3, 36, 8);

        for (let s = 0; s < 5; s++) {
          ctx.fillStyle =
            s < movie.fearLevel
              ? movieIsHorror
                ? '#ef4444'
                : '#fbbf24'
              : '#334155';
          ctx.fillRect(screenX - 10 + s * 4, fy + fh + 6, 2, 2);
        }

        // Warm Art Deco Wall Sconces between posters
        const sconceX = screenX - Math.floor(PAINTING_SPACING / 2);
        if (sconceX > 10 && sconceX < VIEW_W - 10) {
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sconceX - 2, 56, 4, 10);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(sconceX - 3, 52, 6, 4);
        }
      });

      // ======================================================================
      // 5. PIXEL ART COUPLE — ANINHA & CALDAS WALKING TOGETHER IN THE CINEMA
      // ======================================================================
      const coupleScreenX = Math.round(coupleXRef.current - camX);
      const coupleScreenY = 176;

      const lanternGrad = ctx.createRadialGradient(
        coupleScreenX + 4,
        coupleScreenY - 18,
        4,
        coupleScreenX,
        coupleScreenY - 18,
        62
      );
      lanternGrad.addColorStop(0, 'rgba(251, 191, 36, 0.30)');
      lanternGrad.addColorStop(0.55, 'rgba(220, 38, 38, 0.10)');
      lanternGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lanternGrad;
      ctx.fillRect(coupleScreenX - 64, coupleScreenY - 80, 128, 100);

      const animState = {
        frame,
        isWalking: isWalkingRef.current,
        facing: 'right' as const,
        isScared: false,
        isLookingBack: false,
        isHoldingHands: true,
        blink: frame % 105 > 100,
      };

      drawAninhaPixelSprite(
        ctx,
        coupleScreenX - 8,
        coupleScreenY,
        coupleConfig.her,
        animState
      );
      drawCaldasPixelSprite(
        ctx,
        coupleScreenX + 8,
        coupleScreenY,
        coupleConfig.him,
        animState,
        coupleConfig.lanternColor
      );

      const heartBob = Math.sin(frame * 0.08) * 1.5;
      drawPixelHeart(ctx, coupleScreenX - 1, coupleScreenY - 39 + heartBob, '#dc2626');

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [coupleConfig, discoveredEggs, getCorridorProps, reducedMotion, visibleMovies, worldWidth]);

  const getWorldCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const viewX = ((e.clientX - rect.left) / rect.width) * VIEW_W;
    const viewY = ((e.clientY - rect.top) / rect.height) * VIEW_H;
    const worldX = viewX + cameraXRef.current;
    return { viewX, viewY, worldX };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { viewY, worldX } = getWorldCoords(e);

    // Check if hovering over George (at x = 112)
    const isOverButler =
      worldX >= 100 && worldX <= 132 && viewY >= 112 && viewY <= 160;
    setHoveredButler(isOverButler);
    if (isOverButler) {
      setHoveredPaintingIdx(null);
      setHoveredProp(null);
      return;
    }

    let foundPainting: number | null = null;
    if (viewY >= 20 && viewY <= 112) {
      visibleMovies.forEach((_, idx) => {
        const px = FIRST_PAINTING_X + idx * PAINTING_SPACING;
        if (Math.abs(worldX - px) <= 28) {
          foundPainting = idx;
        }
      });
    }
    setHoveredPaintingIdx(foundPainting);

    if (foundPainting === null) {
      const hitProp = getCorridorProps().find(
        (p) =>
          worldX >= p.x &&
          worldX <= p.x + p.w &&
          viewY >= p.y &&
          viewY <= p.y + p.h
      );
      setHoveredProp(hitProp ? hitProp.id : null);
    } else {
      setHoveredProp(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { viewY, worldX } = getWorldCoords(e);

    // 0. Check if clicked on George (at x = 112)
    if (worldX >= 100 && worldX <= 132 && viewY >= 112 && viewY <= 160) {
      targetXRef.current = 128;
      soundEngine.playRomanticChime();
      onOpenButlerAgent();
      return;
    }

    // 1. Check if clicked on a Movie Painting on the wall
    if (viewY >= 20 && viewY <= 114) {
      for (let idx = 0; idx < visibleMovies.length; idx++) {
        const px = FIRST_PAINTING_X + idx * PAINTING_SPACING;
        if (Math.abs(worldX - px) <= 28) {
          walkToPainting(idx, true);
          return;
        }
      }
    }

    // 2. Check if clicked on an interactive Cinema Easter Egg
    const hitProp = getCorridorProps().find(
      (p) =>
        worldX >= p.x &&
        worldX <= p.x + p.w &&
        viewY >= p.y &&
        viewY <= p.y + p.h
    );
    if (hitProp) {
      targetXRef.current = Math.max(70, Math.min(worldWidth - 70, hitProp.x + hitProp.w / 2));
      handleTriggerProp(hitProp.id);
      return;
    }

    // 3. Walk to clicked X
    targetXRef.current = Math.max(70, Math.min(worldWidth - 70, worldX));
  };

  const currentMovie = visibleMovies[activePaintingIdx] || visibleMovies[0];
  const currentIsHorror = currentMovie ? isHorrorMovie(currentMovie) : false;

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 pt-2 pb-10 select-none space-y-4">
      <div className="relative border-2 border-amber-600/80 bg-[#070b16] shadow-[0_0_70px_rgba(0,0,0,0.95),0_0_30px_rgba(245,158,11,0.22)] overflow-hidden">
        {/* Top Cinema Lobby Guidance Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#0d1326] border-b border-amber-700/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-amber-300 tracking-wider uppercase">
              GRAND CINE OLHINHOS // GALERIA &quot;EM CARTAZ&quot;
            </span>
          </div>

          <div className="font-vt text-sm text-zinc-200 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                soundEngine.playRomanticChime();
                onOpenButlerAgent();
              }}
              className="px-2.5 py-0.5 bg-amber-950/90 hover:bg-amber-900 border border-amber-400/80 text-amber-100 font-vt text-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)] transition cursor-pointer"
            >
              <Clapperboard className="w-3.5 h-3.5 text-amber-300" />
              <span>🎬 Falar com George (Concierge)</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playRomanticChime();
                onEnterChosenHall();
              }}
              className="px-2.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/80 text-rose-100 font-vt text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sala VIP dos Escolhidos ({chosenCount}) →</span>
            </button>
          </div>
        </div>

        {/* Pixel Art Cinema Lobby Canvas */}
        <div className="relative w-full aspect-[420/215] max-h-[500px] bg-[#070b16]">
          <canvas
            ref={canvasRef}
            width={VIEW_W}
            height={VIEW_H}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              setHoveredPaintingIdx(null);
              setHoveredProp(null);
              setHoveredButler(false);
            }}
            onClick={handleCanvasClick}
            className={`w-full h-full object-cover pixelated ${
              hoveredPaintingIdx !== null || hoveredProp !== null || hoveredButler
                ? 'cursor-pointer'
                : 'cursor-crosshair'
            }`}
          />

          <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-20" />

          {hoveredButler && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-black/92 border border-amber-400 text-amber-200 font-vt text-base tracking-wide flex items-center gap-2 shadow-xl">
              <Bot className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                🎬 <strong>George, o Concierge Cinéfilo</strong> — Clique para pedir sugestões, saber onde assistir ou gerenciar os cartazes!
              </span>
            </div>
          )}

          {hoveredPaintingIdx !== null && visibleMovies[hoveredPaintingIdx] && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-black/90 border border-amber-400 text-amber-200 font-vt text-base tracking-wide flex items-center gap-2 shadow-xl">
              <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                Clique para abrir:{' '}
                <strong>{visibleMovies[hoveredPaintingIdx].title}</strong> (
                {visibleMovies[hoveredPaintingIdx].year})
              </span>
            </div>
          )}

          {hoveredProp && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-black/90 border border-amber-500 text-amber-200 font-vt text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {getCorridorProps().find((p) => p.id === hoveredProp)?.promptLabel}
              </span>
            </div>
          )}

          {/* In-Scene RPG Discovery Overlay when a Cinema Easter Egg is triggered */}
          {eventMessage && (
            <div className="absolute bottom-3 left-3 right-28 sm:right-36 bg-[#090d1a]/95 border-2 border-amber-400 px-4 py-2.5 shadow-[0_0_30px_rgba(0,0,0,0.95)] flex items-start justify-between gap-3 animate-fadeIn">
              <div className="space-y-0.5">
                <div className="font-pixel text-[8px] sm:text-[9px] text-amber-300 uppercase tracking-wider">
                  ★ {eventMessage.location} // {eventMessage.title}
                </div>
                <p className="font-serif-horror italic text-sm sm:text-base text-zinc-100 leading-snug">
                  {eventMessage.text}
                </p>
              </div>
              <button
                onClick={() => setEventMessage(null)}
                className="text-xs font-vt text-amber-300 hover:text-white uppercase tracking-wider shrink-0 cursor-pointer"
              >
                [X]
              </button>
            </div>
          )}

          <button
            onClick={() => walkToPainting(activePaintingIdx - 1)}
            disabled={activePaintingIdx <= 0}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/80 hover:bg-amber-950/90 disabled:opacity-25 border border-amber-600/70 text-amber-200 transition cursor-pointer"
            title="Cartaz Anterior (←)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={() => walkToPainting(activePaintingIdx + 1)}
            disabled={activePaintingIdx >= visibleMovies.length - 1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/80 hover:bg-amber-950/90 disabled:opacity-25 border border-amber-600/70 text-amber-200 transition cursor-pointer"
            title="Próximo Cartaz (→)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 border border-amber-900/60 px-2.5 py-1">
            <Footprints className="w-3.5 h-3.5 text-amber-400 mr-1" />
            <button
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              onMouseLeave={() => (keysRef.current.left = false)}
              onTouchStart={() => (keysRef.current.left = true)}
              onTouchEnd={() => (keysRef.current.left = false)}
              className="px-2.5 py-0.5 bg-zinc-900 hover:bg-amber-950 border border-zinc-700 text-zinc-200 font-pixel text-[10px] cursor-pointer"
            >
              ◄
            </button>
            <button
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              onMouseLeave={() => (keysRef.current.right = false)}
              onTouchStart={() => (keysRef.current.right = true)}
              onTouchEnd={() => (keysRef.current.right = false)}
              className="px-2.5 py-0.5 bg-zinc-900 hover:bg-amber-950 border border-zinc-700 text-zinc-200 font-pixel text-[10px] cursor-pointer"
            >
              ►
            </button>
          </div>
        </div>

        {/* ACTIVE MOVIE HUD PANEL (Hybrid: Terror Template vs. Cinema Template) */}
        {currentMovie ? (
          <div className="bg-[#090d1a] border-t-2 border-amber-600/70 p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  onClick={() => onSelectMovie(currentMovie)}
                  className="relative w-20 sm:w-24 aspect-[2/3] border-2 border-amber-400 bg-black p-0.5 shadow-[0_0_25px_rgba(245,158,11,0.3)] shrink-0 cursor-pointer group overflow-hidden"
                >
                  {currentMovie.customPosterUrl ? (
                    <img
                      src={
                        currentMovie.customPosterUrl === '/couple-reference.jpg'
                          ? './couple-reference.jpg'
                          : currentMovie.customPosterUrl
                      }
                      alt={currentMovie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-950/40 flex items-center justify-center font-pixel text-[8px] text-amber-300 text-center p-1">
                      {currentMovie.title}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-vt tracking-widest uppercase">
                    <span
                      className={`px-2 py-0.5 border ${
                        currentIsHorror
                          ? 'bg-red-950/80 border-red-700/80 text-red-200'
                          : 'bg-amber-950/80 border-amber-600/80 text-amber-200'
                      }`}
                    >
                      {currentMovie.tapeNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-[#f5c518] text-black font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-black text-black" />
                      IMDb {currentMovie.imdbRating || '7.2'}/10
                    </span>
                    <span className="text-amber-300">{currentMovie.subgenre}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300">
                      {currentMovie.year} ({currentMovie.duration})
                    </span>

                    {currentIsHorror ? (
                      <span className="flex items-center gap-1 text-red-400 ml-1">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        Terrômetro: {currentMovie.bpm} BPM ({currentMovie.fearLevel}/5)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-300 ml-1">
                        <Film className="w-3.5 h-3.5 text-amber-400" />
                        Cinêmetro VIP ★ {currentMovie.fearLevel}/5
                      </span>
                    )}
                  </div>

                  <h2 className="font-gothic text-xl sm:text-3xl text-white">
                    {currentMovie.title}
                  </h2>

                  <p className="font-serif-horror text-sm sm:text-base text-zinc-300 line-clamp-2 max-w-2xl">
                    {currentMovie.synopsis}
                  </p>

                  {/* Streaming & Rental Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="font-pixel text-[8px] text-cyan-300 uppercase tracking-wider flex items-center gap-1 mr-1">
                      <Tv className="w-3 h-3 text-cyan-400" />
                      <span>Onde assistir:</span>
                    </span>
                    {getMovieStreamingOffers(currentMovie).map((offer, idx) => {
                      const isSub = offer.type === 'subscription';
                      return (
                        <span
                          key={`${offer.platform}-${idx}`}
                          className={`px-2 py-0.5 font-vt text-xs border flex items-center gap-1 ${
                            isSub
                              ? 'bg-emerald-950/50 border-emerald-600/70 text-emerald-200'
                              : 'bg-amber-950/50 border-amber-600/70 text-amber-200'
                          }`}
                        >
                          <span>{isSub ? '🟢' : '🟡'}</span>
                          <strong>{offer.platform}:</strong>
                          <span>
                            {isSub
                              ? 'Incluso na assinatura'
                              : offer.priceInfo || 'Aluguel Digital'}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5 justify-end">
                <button
                  onClick={() => {
                    soundEngine.playRomanticChime();
                    onSelectMovie(currentMovie);
                  }}
                  className="px-4 py-2.5 bg-[#161f38] hover:bg-[#1f2d52] border border-amber-500/80 text-amber-200 font-pixel text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Ficha do Filme &amp; Streaming</span>
                </button>

                <button
                  onClick={() => onDirectConfirmMovie(currentMovie)}
                  className={`px-4 py-3 border-2 text-white font-pixel text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 transition cursor-pointer ${
                    currentIsHorror
                      ? 'bg-[#6b0913] hover:bg-[#991b1b] border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.45)]'
                      : 'bg-amber-700 hover:bg-amber-600 border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.45)]'
                  }`}
                >
                  {currentIsHorror ? (
                    <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  ) : (
                    <Film className="w-4 h-4 text-amber-200" />
                  )}
                  <span>Escolher Este Filme</span>
                </button>

                {onRemoveMovieFromWall && !currentMovie.isSecret && (
                  <button
                    onClick={() => {
                      soundEngine.playDoorCreak();
                      onRemoveMovieFromWall(currentMovie.id);
                    }}
                    className="px-4 py-2 bg-[#160b12] hover:bg-red-950/90 border border-red-900/70 hover:border-red-500 text-red-300 hover:text-white font-vt text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Retirar este cartaz da galeria"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Excluir Quadro da Galeria</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#090d1a] border-t-2 border-amber-600/70 p-6 text-center space-y-3">
            <div className="font-gothic text-xl sm:text-2xl text-amber-200">
              A Galeria do Cinema está Vazia
            </div>
            <p className="font-serif-horror text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
              Todos os cartazes foram retirados. Converse com o Concierge George para adicionar qualquer filme novo (de qualquer gênero!) na parede!
            </p>
            <button
              onClick={() => {
                soundEngine.playRomanticChime();
                onOpenButlerAgent();
              }}
              className="px-5 py-2.5 bg-amber-900 hover:bg-amber-800 border border-amber-400 text-amber-100 font-pixel text-[10px] uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Clapperboard className="w-4 h-4 text-amber-300" />
              <span>🎬 Falar com George para Adicionar Filmes</span>
            </button>
          </div>
        )}

        {/* Quick Corridor Mini-Map Strip */}
        <div className="bg-[#050811] border-t border-amber-900/50 px-3.5 py-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="font-pixel text-[8px] text-amber-400/90 uppercase tracking-wider shrink-0 mr-1">
            Em Cartaz ({visibleMovies.length}):
          </span>
          {visibleMovies.length === 0 && (
            <span className="font-vt text-sm text-zinc-500 italic">
              Nenhum cartaz pendurado — adicione novos filmes com o George!
            </span>
          )}
          {visibleMovies.map((m, idx) => {
            const isCurrent = idx === activePaintingIdx;
            const mHorror = isHorrorMovie(m);
            return (
              <div
                key={m.id}
                className={`border font-vt text-sm flex items-center shrink-0 transition ${
                  isCurrent
                    ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-[#0c1222] border-zinc-800 text-zinc-400 hover:border-amber-600 hover:text-zinc-200'
                }`}
              >
                <button
                  onClick={() => walkToPainting(idx, isCurrent)}
                  className="px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                >
                  {mHorror ? (
                    <Skull
                      className={`w-3 h-3 ${
                        isCurrent ? 'text-red-400' : 'text-red-600'
                      }`}
                    />
                  ) : (
                    <Film
                      className={`w-3 h-3 ${
                        isCurrent ? 'text-amber-300' : 'text-amber-500'
                      }`}
                    />
                  )}
                  <span>
                    {idx + 1}. {m.title}
                  </span>
                </button>
                {onRemoveMovieFromWall && !m.isSecret && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playDoorCreak();
                      onRemoveMovieFromWall(m.id);
                    }}
                    className="px-1.5 py-1 border-l border-zinc-800/80 text-red-400 hover:text-white hover:bg-red-900/80 transition cursor-pointer"
                    title={`Excluir "${m.title}" da parede`}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
