import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { CoupleConfig, EasterEggId, MovieTemplate } from '../types/horror';
import {
  drawAninhaPixelSprite,
  drawCaldasPixelSprite,
  drawGhostButlerSprite,
  drawGhostfaceSprite,
  drawJasonMaskSprite,
  drawJigsawBillySprite,
  drawMinionPixelSprite,
} from '../utils/pixelSprites';
import { EASTER_EGGS } from '../data/easterEggs';
import { getMovieStreamingOffers } from '../utils/movieAutoFill';
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
    900,
    FIRST_PAINTING_X + visibleMovies.length * PAINTING_SPACING + 140
  );

  const coupleXRef = useRef<number>(FIRST_PAINTING_X);
  const targetXRef = useRef<number>(FIRST_PAINTING_X);
  const cameraXRef = useRef<number>(0);
  const isWalkingRef = useRef<boolean>(false);
  const isScaredRef = useRef<boolean>(false);
  const isLookingBackRef = useRef<boolean>(false);
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

  // Walk once when Arthur guides the couple to a specific movie, then immediately clear target so movement never locks!
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

  // Tracks which architectural secret is currently in its "triggered/animated" state (timestamp ms)
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

  // Contextual Mansion Furniture & Architectural Secrets (Integrated naturally between the paintings!)
  const getCorridorProps = useCallback((): CorridorProp[] => {
    return [
      {
        id: 'jason_mask',
        x: 72,
        y: 56,
        w: 24,
        h: 32,
        promptLabel: 'Panóplia de madeira na parede... [Clique para tocar]',
      },
      {
        id: 'ghostface',
        x: FIRST_PAINTING_X + 64,
        y: 34,
        w: 32,
        h: 112,
        promptLabel: 'Janela com cortina de veludo e telefone antigo... [Clique para espiar]',
      },
      {
        id: 'hidden_minion',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 1 + 66,
        y: 120,
        w: 26,
        h: 28,
        promptLabel: 'Portinhola solta no rodapé... algo brilha lá dentro [Clique para abrir]',
      },
      {
        id: 'pennywise_balloon',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 2 + 66,
        y: 96,
        w: 26,
        h: 56,
        promptLabel: 'Ralo de ferro no assoalho com um fio vermelho... [Clique para olhar]',
      },
      {
        id: 'jigsaw_billy',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 3 + 60,
        y: 66,
        w: 34,
        h: 82,
        promptLabel: 'Porta da despensa entreaberta com corrente... [Clique para empurrar]',
      },
      {
        id: 'shining_twins',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 4 + 64,
        y: 52,
        w: 28,
        h: 54,
        promptLabel: 'Espelho veneziano embaçado na parede... [Clique para olhar o reflexo]',
      },
      {
        id: 'cursed_portrait',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 5 + 66,
        y: 44,
        w: 26,
        h: 52,
        promptLabel: 'Pintura a óleo antiga sobre o candelabro... [Clique para observar]',
      },
      {
        id: 'crt_tv',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 6 + 60,
        y: 102,
        w: 30,
        h: 46,
        promptLabel: 'Televisão antiga sobre o aparador... [Clique para ligar]',
      },
      {
        id: 'secret_vhs',
        x: FIRST_PAINTING_X + PAINTING_SPACING * 6 + 102,
        y: 58,
        w: 26,
        h: 90,
        promptLabel: 'Relógio de pêndulo parado às 03:33... [Clique para abrir a base]',
      },
    ];
  }, []);

  const handleTriggerProp = useCallback(
    (id: EasterEggId) => {
      const info = EASTER_EGGS[id];
      triggeredPropsRef.current[id] = Date.now() + 6500; // Animate in-scene for 6.5 seconds
      onDiscoverEgg(id);

      setEventMessage({
        title: info.title,
        location: info.location,
        text: info.discoveryText,
      });

      if (id === 'hidden_minion') {
        soundEngine.playMinionSound();
      } else if (id === 'crt_tv') {
        soundEngine.playVhsStatic(0.32, 0.22);
      } else if (id === 'ghostface') {
        soundEngine.playPhoneRing();
      } else if (id === 'jigsaw_billy' || id === 'secret_vhs') {
        soundEngine.playDoorCreak();
        soundEngine.playHeartbeat(0.65);
      } else {
        soundEngine.playHeartbeat(0.75);
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
          soundEngine.playVhsStatic(0.15, 0.15);
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
    soundEngine.playHeartbeat(0.35);

    if (openImmediately || Math.abs(coupleXRef.current - destX) < 28) {
      onSelectMovie(visibleMovies[clampedIdx]);
    }
  };

  // Autonomous haunting events
  useEffect(() => {
    const timer = setInterval(() => {
      const r = Math.random();
      if (r < 0.35) {
        isLookingBackRef.current = true;
        setTimeout(() => {
          isLookingBackRef.current = false;
        }, 2200);
      } else if (r < 0.6 && !reducedMotion) {
        isScaredRef.current = true;
        soundEngine.playThunder();
        setTimeout(() => {
          isScaredRef.current = false;
        }, 1400);
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [reducedMotion]);

  // Main 60FPS 2D Pixel Art Mansion Corridor Loop
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

      const isThunder = isScaredRef.current && frame % 4 < 2;

      // ======================================================================
      // 1. MANSION CORRIDOR WALLS, DAMASK WALLPAPER & WAINSCOTING
      // ======================================================================
      ctx.fillStyle = isThunder ? '#2b0d16' : '#11060b';
      ctx.fillRect(0, 0, VIEW_W, 148);

      ctx.fillStyle = '#190910';
      for (let wx = -(camX % 24); wx < VIEW_W; wx += 24) {
        ctx.fillRect(wx, 12, 10, 96);
        ctx.fillStyle = '#220c16';
        ctx.fillRect(wx + 4, 24, 2, 78);
        ctx.fillStyle = '#190910';
      }

      ctx.fillStyle = '#231317';
      ctx.fillRect(0, 0, VIEW_W, 11);
      ctx.fillStyle = '#381e24';
      ctx.fillRect(0, 11, VIEW_W, 2);

      // Dark Mahogany Wainscoting
      ctx.fillStyle = '#170e0c';
      ctx.fillRect(0, 108, VIEW_W, 40);
      ctx.fillStyle = '#291915';
      ctx.fillRect(0, 108, VIEW_W, 3);
      ctx.fillRect(0, 145, VIEW_W, 3);
      for (let px = -(camX % 32); px < VIEW_W; px += 32) {
        ctx.strokeStyle = '#241512';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 4, 114, 24, 28);
      }

      // ======================================================================
      // 2. HARDWOOD FLOOR & PLUSH BLOOD-RED VELVET CARPET RUNNER
      // ======================================================================
      ctx.fillStyle = '#0d0808';
      ctx.fillRect(0, 148, VIEW_W, VIEW_H - 148);

      ctx.fillStyle = '#3b0810';
      ctx.fillRect(0, 156, VIEW_W, 38);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 156, VIEW_W, 2);
      ctx.fillRect(0, 192, VIEW_W, 2);
      ctx.fillStyle = '#540b17';
      for (let cx = -(camX % 28); cx < VIEW_W; cx += 28) {
        ctx.fillRect(cx + 6, 164, 14, 6);
        ctx.fillRect(cx + 10, 172, 6, 12);
      }

      // Entrance Double Oak Door at Left End
      const entranceSX = Math.round(24 - camX);
      if (entranceSX > -50 && entranceSX < VIEW_W) {
        ctx.fillStyle = '#2e190f';
        ctx.fillRect(entranceSX, 74, 34, 74);
        ctx.strokeStyle = '#4a2919';
        ctx.strokeRect(entranceSX, 74, 34, 74);
      }

      // ======================================================================
      // 2.5 ARTHUR, O CURADOR FANTASMA DA MANSÃO (AGENTE IA EM PIXEL ART)
      // ======================================================================
      const butlerWorldX = 112;
      const butlerSX = Math.round(butlerWorldX - camX);
      if (butlerSX > -40 && butlerSX < VIEW_W + 40) {
        // Antique wooden curator lectern / pedestal beside Arthur
        ctx.fillStyle = '#24140e';
        ctx.fillRect(butlerSX - 10, 134, 8, 20);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(butlerSX - 12, 132, 12, 3);
        // Open guestbook on lectern
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
      // 3. CONTEXTUAL MANSION ARCHITECTURE & INTERACTIVE HORROR SECRETS
      // ======================================================================
      const props = getCorridorProps();
      props.forEach((prop) => {
        const sx = Math.round(prop.x - camX);
        if (sx + prop.w < -40 || sx > VIEW_W + 40) return;

        const isHovered = hoveredPropRef.current === prop.id;
        const isActive = (triggeredPropsRef.current[prop.id] || 0) > now;
        const isNear = Math.abs(coupleXRef.current - (prop.x + prop.w / 2)) < 42;
        const showEffect = isActive || isHovered;

        if (prop.id === 'jason_mask') {
          // 1. Antique Wooden Wall Trophy Plaque (Panóplia de Parede)
          ctx.fillStyle = '#2b170e';
          ctx.fillRect(sx + 2, prop.y + 2, 20, 24);
          ctx.strokeStyle = isHovered ? '#d97706' : '#4a2919';
          ctx.strokeRect(sx + 2, prop.y + 2, 20, 24);
          // Crossed machete handle & blade behind the plaque
          ctx.fillStyle = showEffect ? '#e2e8f0' : '#64748b';
          ctx.fillRect(sx - 1, prop.y + 22, 26, 2);
          drawJasonMaskSprite(ctx, sx + 6, prop.y + 7, showEffect);
        } else if (prop.id === 'ghostface') {
          // 2. Tall Gothic Window with Heavy Velvet Curtains & Rotary Phone Table
          // Window frame & night sky outside
          ctx.fillStyle = '#070b14';
          ctx.fillRect(sx + 3, prop.y + 2, 26, 68);
          ctx.strokeStyle = '#291915';
          ctx.strokeRect(sx + 3, prop.y + 2, 26, 68);
          // Window muntins
          ctx.fillStyle = '#1c1210';
          ctx.fillRect(sx + 15, prop.y + 2, 2, 68);
          ctx.fillRect(sx + 3, prop.y + 34, 26, 2);

          // If triggered or hovered, the right curtain opens and the figure peeks inside!
          if (showEffect) {
            drawGhostfaceSprite(ctx, sx + 11, prop.y + 28, true);
          } else if (isNear && frame % 160 > 125) {
            // Subtle pale mask glimpse in the dark glass when walking past
            ctx.fillStyle = 'rgba(241, 245, 249, 0.25)';
            ctx.fillRect(sx + 14, prop.y + 38, 4, 6);
          }

          // Heavy Burgundy Velvet Drapes on left & right of the window
          const curtainOpenOffset = showEffect ? 7 : 0;
          ctx.fillStyle = '#450a0a';
          ctx.fillRect(sx + 1, prop.y, 9, 74); // Left drape
          ctx.fillRect(sx + 18 + curtainOpenOffset, prop.y, 11 - Math.min(6, curtainOpenOffset), 74); // Right drape
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(sx + 3, prop.y + 2, 2, 70);
          // Brass curtain rod
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx - 1, prop.y - 2, 34, 2);

          // Small side table with vintage rotary phone below window
          ctx.fillStyle = '#24140e';
          ctx.fillRect(sx + 4, prop.y + 84, 24, 28);
          ctx.fillStyle = '#09090b';
          ctx.fillRect(sx + 10, prop.y + 78, 12, 6); // Phone base
          const phoneShake = showEffect && frame % 4 < 2 ? -1 : 0;
          ctx.fillStyle = showEffect ? '#ef4444' : '#27272a';
          ctx.fillRect(sx + 8, prop.y + 76 + phoneShake, 16, 2); // Receiver
        } else if (prop.id === 'hidden_minion') {
          // 3. Recessed Wooden Baseboard Service Hatch (Alçapão no Rodapé)
          ctx.fillStyle = '#070406';
          ctx.fillRect(sx + 3, prop.y + 4, 20, 22); // Dark wall niche cavity
          ctx.strokeStyle = '#3b231a';
          ctx.strokeRect(sx + 3, prop.y + 4, 20, 22);

          if (showEffect) {
            // Hatch swung open to the side + Minion popping out with banana!
            ctx.fillStyle = '#241512';
            ctx.fillRect(sx + 23, prop.y + 4, 6, 22);
            drawMinionPixelSprite(ctx, sx + 8, prop.y + 7, frame, true);
          } else {
            // Wooden panel mostly closed, leaving a 4px dark gap where two silver goggles peek out!
            ctx.fillStyle = '#1f120f';
            ctx.fillRect(sx + 4, prop.y + 11, 18, 14);
            // Tiny goggle eyes glinting in the dark crack
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(sx + 9, prop.y + 6, 3, 3);
            ctx.fillRect(sx + 13, prop.y + 6, 3, 3);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(sx + 10, prop.y + 7, 1, 1);
            ctx.fillRect(sx + 14, prop.y + 7, 1, 1);
          }
        } else if (prop.id === 'pennywise_balloon') {
          // 4. Iron Floor Drainage Grate built into the floorboards + Red String
          const grateY = 146;
          ctx.fillStyle = '#040305';
          ctx.fillRect(sx + 3, grateY, 20, 7);
          ctx.fillStyle = '#27272a';
          for (let gx = 5; gx < 21; gx += 4) {
            ctx.fillRect(sx + gx, grateY, 1, 7);
          }

          // Glowing yellow eyes inside the dark grate when near, hovered, or active
          if (showEffect || (isNear && frame % 90 > 45)) {
            ctx.fillStyle = '#facc15';
            ctx.fillRect(sx + 9, grateY + 3, 2, 2);
            ctx.fillRect(sx + 15, grateY + 3, 2, 2);
          }

          if (showEffect) {
            // The red balloon rises up from the grate into the corridor!
            const floatY = Math.round(Math.sin(frame * 0.08) * 3);
            const by = prop.y + 6 + floatY;
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(sx + 13, by + 11, 1, grateY - (by + 11));
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(sx + 9, by + 1, 9, 9);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(sx + 10, by, 7, 11);
            ctx.fillStyle = '#fecaca';
            ctx.fillRect(sx + 11, by + 2, 2, 2);
          } else {
            // Subtle clue: red string tied to the grate with a deflated/low knot
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(sx + 12, grateY - 5, 2, 5);
            ctx.fillRect(sx + 11, grateY - 7, 4, 2);
          }
        } else if (prop.id === 'jigsaw_billy') {
          // 5. Chained Ajar Pantry/Service Door built into the corridor wall
          const doorX = sx + 3;
          const doorY = prop.y + 6;
          const doorW = 28;
          const doorH = 76;

          // Pitch-black interior room behind the door
          ctx.fillStyle = '#040204';
          ctx.fillRect(doorX, doorY, doorW, doorH);

          // Red light spilling onto the floorboards from inside the room
          ctx.fillStyle = showEffect ? 'rgba(220, 38, 38, 0.35)' : 'rgba(185, 28, 28, 0.16)';
          ctx.fillRect(doorX, doorY + doorH - 4, doorW, 8);

          if (showEffect) {
            // Door swung open wide, revealing the tricycle puppet rolling out of the dark room!
            ctx.fillStyle = '#24140e';
            ctx.fillRect(doorX, doorY, 8, doorH); // Open door leaf
            drawJigsawBillySprite(ctx, doorX + 11, doorY + 52, true);
          } else {
            // Heavy oak door almost closed (only a 4px dark vertical crack on the right)
            ctx.fillStyle = '#24140e';
            ctx.fillRect(doorX, doorY, doorW - 4, doorH);
            ctx.strokeStyle = '#3b2116';
            ctx.strokeRect(doorX + 3, doorY + 5, doorW - 10, 28);
            ctx.strokeRect(doorX + 3, doorY + 38, doorW - 10, 32);
            // Iron chain across the door gap
            ctx.fillStyle = '#52525b';
            ctx.fillRect(doorX + doorW - 9, doorY + 36, 9, 2);
            // Two tiny red eyes gleaming in the 4px crack!
            if (frame % 110 > 60) {
              ctx.fillStyle = '#ef4444';
              ctx.fillRect(doorX + doorW - 3, doorY + 55, 1, 1);
              ctx.fillRect(doorX + doorW - 1, doorY + 55, 1, 1);
            }
          }
          // Door frame molding
          ctx.strokeStyle = '#3d2217';
          ctx.strokeRect(doorX, doorY, doorW, doorH);
        } else if (prop.id === 'shining_twins') {
          // 6. Ornate Gilded Venetian Wall Mirror
          ctx.fillStyle = '#855d33';
          ctx.fillRect(sx + 2, prop.y + 2, 24, 48);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(sx + 4, prop.y, 20, 2);
          // Mirror glass surface
          ctx.fillStyle = showEffect ? '#131c2e' : '#0f1420';
          ctx.fillRect(sx + 5, prop.y + 5, 18, 42);

          if (showEffect || (isNear && frame % 180 > 140)) {
            // The two identical figures in pale blue dresses appear inside the mirror reflection!
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(sx + 8, prop.y + 25, 5, 14);
            ctx.fillRect(sx + 15, prop.y + 25, 5, 14);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(sx + 9, prop.y + 20, 3, 5);
            ctx.fillRect(sx + 16, prop.y + 20, 3, 5);
            // Joined hands
            ctx.fillRect(sx + 13, prop.y + 29, 2, 2);
          } else {
            // Normal mirror reflection streaks
            ctx.fillStyle = 'rgba(255,255,255,0.07)';
            ctx.fillRect(sx + 8, prop.y + 9, 2, 30);
            ctx.fillRect(sx + 12, prop.y + 14, 1, 22);
          }
        } else if (prop.id === 'cursed_portrait') {
          // 7. Antique Oil Portrait above a Double Candle Sconce
          ctx.save();
          if (showEffect) {
            // Frame tilts crookedly when triggered!
            ctx.translate(sx + 13, prop.y + 20);
            ctx.rotate(0.09);
            ctx.translate(-(sx + 13), -(prop.y + 20));
          }
          ctx.fillStyle = '#4a3219';
          ctx.fillRect(sx + 3, prop.y + 2, 20, 32);
          ctx.fillStyle = '#09070a';
          ctx.fillRect(sx + 5, prop.y + 4, 16, 28);

          if (showEffect) {
            // Veiled pale figure with glowing yellow eyes staring out of the canvas
            ctx.fillStyle = '#020204';
            ctx.fillRect(sx + 7, prop.y + 7, 12, 24);
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(sx + 10, prop.y + 10, 6, 9);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(sx + 11, prop.y + 13, 1, 2);
            ctx.fillRect(sx + 14, prop.y + 13, 1, 2);
          } else {
            // Somber 19th-century bust silhouette
            ctx.fillStyle = '#27272a';
            ctx.fillRect(sx + 10, prop.y + 11, 6, 7);
            ctx.fillRect(sx + 8, prop.y + 18, 10, 12);
          }
          ctx.restore();

          // Candle sconce underneath the portrait
          ctx.fillStyle = '#78350f';
          ctx.fillRect(sx + 9, prop.y + 39, 8, 3);
          ctx.fillStyle = showEffect ? '#ef4444' : '#f59e0b';
          ctx.fillRect(sx + 10, prop.y + 36, 2, 3);
          ctx.fillRect(sx + 14, prop.y + 36, 2, 3);
        } else if (prop.id === 'crt_tv') {
          // 8. Carved Sideboard Cabinet with Vintage CRT Television
          ctx.fillStyle = '#24150e';
          ctx.fillRect(sx + 2, prop.y + 20, 26, 26);
          ctx.strokeStyle = '#3b2217';
          ctx.strokeRect(sx + 4, prop.y + 23, 22, 20);
          // Vintage CRT TV Box & Antenna
          ctx.fillStyle = '#18181b';
          ctx.fillRect(sx + 4, prop.y + 4, 22, 16);
          ctx.fillStyle = '#52525b';
          ctx.fillRect(sx + 11, prop.y, 1, 4);
          ctx.fillRect(sx + 18, prop.y, 1, 4);

          if (showEffect) {
            // Static & the cursed stone well ring + dark hair spilling over the screen frame!
            ctx.fillStyle = '#090d16';
            ctx.fillRect(sx + 6, prop.y + 6, 16, 12);
            ctx.strokeStyle = '#f8fafc';
            ctx.strokeRect(sx + 11, prop.y + 8, 6, 6);
            ctx.fillStyle = '#020204';
            ctx.fillRect(sx + 12, prop.y + 12, 4, 12);
            // Water puddle on the floor
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.fillRect(sx + 6, prop.y + 45, 16, 2);
          } else {
            // Dormant dark glass tube with tiny red standby LED
            ctx.fillStyle = '#090a0f';
            ctx.fillRect(sx + 6, prop.y + 6, 16, 12);
            ctx.fillStyle = frame % 60 < 30 ? '#ef4444' : '#450a0a';
            ctx.fillRect(sx + 23, prop.y + 16, 1, 1);
          }
        } else if (prop.id === 'secret_vhs') {
          // 9. Tall Grandfather Clock stopped at 03:33 with secret base compartment
          const gx = sx + 4;
          const gy = prop.y;
          ctx.fillStyle = '#26140c';
          ctx.fillRect(gx, gy, 18, 90);
          ctx.strokeStyle = '#452617';
          ctx.strokeRect(gx, gy, 18, 90);

          // Clock face at top
          ctx.fillStyle = '#d6d3d1';
          ctx.fillRect(gx + 3, gy + 5, 12, 12);
          ctx.fillStyle = '#09090b';
          ctx.fillRect(gx + 8, gy + 7, 1, 4);
          ctx.fillRect(gx + 8, gy + 11, 4, 1);

          // Lower pendulum compartment
          ctx.fillStyle = '#090507';
          ctx.fillRect(gx + 3, gy + 24, 12, 56);

          if (showEffect || discoveredEggs.includes('secret_vhs')) {
            // Open compartment revealing the Brass Pendulum & Hidden VHS #00!
            ctx.fillStyle = '#d97706';
            ctx.fillRect(gx + 8, gy + 26, 2, 26);
            ctx.fillRect(gx + 6, gy + 50, 6, 6);
            // VHS Tape #00 resting on the bottom shelf inside the clock
            ctx.fillStyle = '#09090b';
            ctx.fillRect(gx + 4, gy + 68, 10, 6);
            ctx.fillStyle = discoveredEggs.includes('secret_vhs') ? '#22c55e' : '#ef4444';
            ctx.fillRect(gx + 5, gy + 70, 8, 2);
          } else {
            // Closed wooden pendulum door with glowing red keyhole
            ctx.fillStyle = '#1e100a';
            ctx.fillRect(gx + 3, gy + 24, 12, 56);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(gx + 12, gy + 52, 2, 2);
          }
        }
      });

      // ======================================================================
      // 4. THE MOVIE PAINTINGS (QUADROS DOS FILMES NA PAREDE DA MANSÃO)
      // ======================================================================
      visibleMovies.forEach((movie, idx) => {
        const worldFrameX = FIRST_PAINTING_X + idx * PAINTING_SPACING;
        const screenX = Math.round(worldFrameX - camX);

        if (screenX < -70 || screenX > VIEW_W + 70) return;

        const isCurrent = idx === activePaintingIdxRef.current;
        const isHovered = idx === hoveredPaintingIdxRef.current;
        const isHighlighted = isCurrent || isHovered;

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
            56
          );
          spotGrad.addColorStop(0, 'rgba(245, 158, 11, 0.34)');
          spotGrad.addColorStop(0.55, 'rgba(185, 28, 28, 0.14)');
          spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = spotGrad;
          ctx.fillRect(screenX - 58, fy - 12, 116, 116);
        }

        ctx.fillStyle = '#78350f';
        ctx.fillRect(screenX - 10, fy - 7, 20, 3);
        ctx.fillStyle = isHighlighted ? '#fde68a' : '#d97706';
        ctx.fillRect(screenX - 7, fy - 4, 14, 2);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(fx + 3, fy + 3, fw, fh);

        ctx.fillStyle = movie.isSecret
          ? '#991b1b'
          : isHighlighted
          ? '#d97706'
          : '#5c4023';
        ctx.fillRect(fx, fy, fw, fh);

        ctx.fillStyle = isHighlighted ? '#fef08a' : '#855d33';
        ctx.fillRect(fx, fy, 4, 4);
        ctx.fillRect(fx + fw - 4, fy, 4, 4);
        ctx.fillRect(fx, fy + fh - 4, 4, 4);
        ctx.fillRect(fx + fw - 4, fy + fh - 4, 4, 4);

        ctx.fillStyle = '#090508';
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
          ctx.fillStyle = isHighlighted
            ? 'rgba(10, 4, 8, 0.12)'
            : 'rgba(10, 4, 8, 0.38)';
          ctx.fillRect(ix, iy, iw, ih);
        } else {
          ctx.fillStyle = '#170810';
          ctx.fillRect(ix, iy, iw, ih);
          ctx.fillStyle = isHighlighted ? '#dc2626' : '#7f1d1d';
          ctx.fillRect(ix + 12, iy + 14, iw - 24, ih - 28);
        }

        // Brass Number Plaque below the Painting
        ctx.fillStyle = isHighlighted ? '#450a0a' : '#1c1210';
        ctx.fillRect(screenX - 18, fy + fh + 3, 36, 8);
        ctx.strokeStyle = isHighlighted ? '#ef4444' : '#5c4023';
        ctx.strokeRect(screenX - 18, fy + fh + 3, 36, 8);

        for (let s = 0; s < 5; s++) {
          ctx.fillStyle = s < movie.fearLevel ? '#ef4444' : '#27272a';
          ctx.fillRect(screenX - 10 + s * 4, fy + fh + 6, 2, 2);
        }

        // Flickering Wall Sconces
        const sconceX = screenX - Math.floor(PAINTING_SPACING / 2);
        if (sconceX > 10 && sconceX < VIEW_W - 10) {
          ctx.fillStyle = '#442b1d';
          ctx.fillRect(sconceX - 2, 58, 4, 10);
          const flameFlicker = (frame + idx * 17) % 9 !== 0;
          ctx.fillStyle = flameFlicker ? '#f59e0b' : '#dc2626';
          ctx.fillRect(sconceX - 1, 54, 2, 4);
        }
      });

      // ======================================================================
      // 5. PIXEL ART COUPLE — ANINHA & CALDAS WALKING TOGETHER IN THE GALLERY
      // ======================================================================
      const coupleScreenX = Math.round(coupleXRef.current - camX);
      const coupleScreenY = 176;

      const lanternGrad = ctx.createRadialGradient(
        coupleScreenX + 8,
        coupleScreenY - 18,
        4,
        coupleScreenX,
        coupleScreenY - 18,
        64
      );
      lanternGrad.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
      lanternGrad.addColorStop(0.55, 'rgba(185, 28, 28, 0.12)');
      lanternGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lanternGrad;
      ctx.fillRect(coupleScreenX - 64, coupleScreenY - 80, 128, 100);

      const animState = {
        frame,
        isWalking: isWalkingRef.current,
        facing: 'right' as const,
        isScared: isScaredRef.current,
        isLookingBack: isLookingBackRef.current,
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

      // Dust motes in the lantern light
      ctx.fillStyle = 'rgba(254, 243, 199, 0.18)';
      for (let m = 0; m < 18; m++) {
        const mx = (m * 67 + Math.floor(frame * 0.15)) % VIEW_W;
        const my = 25 + ((m * 31 + Math.floor(Math.sin(frame * 0.03 + m) * 6)) % 140);
        ctx.fillRect(mx, my, 1, 1);
      }

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

    // Check if hovering over Arthur (The Ghost Butler AI Agent at x = 112)
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

    // 0. Check if clicked on Arthur (The Ghost Butler AI Agent at x = 112)
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

    // 2. Check if clicked on an architectural secret / interactive mansion object
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

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-6 pt-2 pb-10 select-none space-y-4">
      <div className="relative border-2 border-[#3d0e18] bg-[#060307] shadow-[0_0_70px_rgba(0,0,0,0.95),0_0_30px_rgba(153,27,27,0.28)] overflow-hidden">
        {/* Top Corridor Guidance Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-[#0d060b] border-b border-[#330d16] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="font-pixel text-[9px] sm:text-[10px] text-red-400 tracking-wider uppercase">
              INTERIOR DA MANSÃO // GALERIA DOS QUADROS
            </span>
          </div>

          <div className="font-vt text-sm text-zinc-300 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                soundEngine.playRomanticChime();
                onOpenButlerAgent();
              }}
              className="px-2.5 py-0.5 bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-200 font-vt text-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              <span>🕯️ Falar com George</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playDoorCreak();
                onEnterChosenHall();
              }}
              className="px-2.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 text-amber-200 font-vt text-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Entrar na Sala dos Filmes Escolhidos ({chosenCount}) →</span>
            </button>
          </div>
        </div>

        {/* Pixel Art Corridor Canvas */}
        <div className="relative w-full aspect-[420/215] max-h-[500px] bg-[#060307]">
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

          <div className="pointer-events-none absolute inset-0 crt-scanlines opacity-35" />

          {hoveredButler && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-black/92 border border-cyan-400 text-cyan-200 font-vt text-base tracking-wide flex items-center gap-2 shadow-xl">
              <Bot className="w-4 h-4 text-cyan-400 animate-bounce" />
              <span>
                🕯️ <strong>George, o Mordomo Fantasma</strong> — Clique para conversar, pedir sugestões ou gerenciar os quadros!
              </span>
            </div>
          )}

          {hoveredPaintingIdx !== null && visibleMovies[hoveredPaintingIdx] && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-black/90 border border-amber-500/80 text-amber-200 font-vt text-base tracking-wide flex items-center gap-2 shadow-xl">
              <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>
                Clique para examinar:{' '}
                <strong>{visibleMovies[hoveredPaintingIdx].title}</strong> (
                {visibleMovies[hoveredPaintingIdx].year})
              </span>
            </div>
          )}

          {hoveredProp && (
            <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-black/90 border border-red-700 text-red-200 font-vt text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-red-500" />
              <span>
                {getCorridorProps().find((p) => p.id === hoveredProp)?.promptLabel}
              </span>
            </div>
          )}

          {/* In-Scene RPG Investigation Overlay when an architectural secret is triggered */}
          {eventMessage && (
            <div className="absolute bottom-3 left-3 right-28 sm:right-36 bg-black/92 border-2 border-red-700/90 px-4 py-2.5 shadow-[0_0_30px_rgba(0,0,0,0.95)] flex items-start justify-between gap-3 animate-fadeIn">
              <div className="space-y-0.5">
                <div className="font-pixel text-[8px] sm:text-[9px] text-amber-400 uppercase tracking-wider">
                  {eventMessage.location} // {eventMessage.title}
                </div>
                <p className="font-serif-horror italic text-sm sm:text-base text-zinc-100 leading-snug">
                  {eventMessage.text}
                </p>
              </div>
              <button
                onClick={() => setEventMessage(null)}
                className="text-xs font-vt text-red-300 hover:text-white uppercase tracking-wider shrink-0 cursor-pointer"
              >
                [X]
              </button>
            </div>
          )}

          <button
            onClick={() => walkToPainting(activePaintingIdx - 1)}
            disabled={activePaintingIdx <= 0}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/80 hover:bg-red-950/90 disabled:opacity-25 border border-red-800/70 text-red-200 transition cursor-pointer"
            title="Quadro Anterior (←)"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button
            onClick={() => walkToPainting(activePaintingIdx + 1)}
            disabled={activePaintingIdx >= visibleMovies.length - 1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/80 hover:bg-red-950/90 disabled:opacity-25 border border-red-800/70 text-red-200 transition cursor-pointer"
            title="Próximo Quadro (→)"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/80 border border-zinc-800 px-2.5 py-1">
            <Footprints className="w-3.5 h-3.5 text-red-400 mr-1" />
            <button
              onMouseDown={() => (keysRef.current.left = true)}
              onMouseUp={() => (keysRef.current.left = false)}
              onMouseLeave={() => (keysRef.current.left = false)}
              onTouchStart={() => (keysRef.current.left = true)}
              onTouchEnd={() => (keysRef.current.left = false)}
              className="px-2.5 py-0.5 bg-zinc-900 hover:bg-red-950 border border-zinc-700 text-zinc-200 font-pixel text-[10px] cursor-pointer"
            >
              ◄
            </button>
            <button
              onMouseDown={() => (keysRef.current.right = true)}
              onMouseUp={() => (keysRef.current.right = false)}
              onMouseLeave={() => (keysRef.current.right = false)}
              onTouchStart={() => (keysRef.current.right = true)}
              onTouchEnd={() => (keysRef.current.right = false)}
              className="px-2.5 py-0.5 bg-zinc-900 hover:bg-red-950 border border-zinc-700 text-zinc-200 font-pixel text-[10px] cursor-pointer"
            >
              ►
            </button>
          </div>
        </div>

        {/* ACTIVE PAINTING HUD PANEL */}
        {currentMovie ? (
          <div className="bg-[#0b060c] border-t-2 border-[#3d0e18] p-4 sm:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  onClick={() => onSelectMovie(currentMovie)}
                  className="relative w-20 sm:w-24 aspect-[2/3] border-2 border-amber-600/80 bg-black p-0.5 shadow-[0_0_25px_rgba(217,119,6,0.3)] shrink-0 cursor-pointer group overflow-hidden"
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
                    <div className="w-full h-full bg-red-950/40 flex items-center justify-center font-pixel text-[8px] text-red-300 text-center p-1">
                      {currentMovie.title}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-vt tracking-widest uppercase">
                    <span className="px-2 py-0.5 bg-red-950/80 border border-red-800/70 text-red-300">
                      {currentMovie.tapeNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      IMDb {currentMovie.imdbRating || '7.2'}/10
                    </span>
                    <span className="text-amber-400">{currentMovie.subgenre}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300">
                      {currentMovie.year} ({currentMovie.duration})
                    </span>
                    <span className="flex items-center gap-1 text-red-400 ml-1">
                      <Activity className="w-3.5 h-3.5 animate-pulse" />
                      {currentMovie.bpm} BPM
                    </span>
                  </div>

                  <h2 className="font-gothic text-xl sm:text-3xl text-white glitch-text">
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
                    soundEngine.playVhsStatic(0.18, 0.15);
                    onSelectMovie(currentMovie);
                  }}
                  className="px-4 py-2.5 bg-[#1e0b14] hover:bg-[#331020] border border-amber-600/70 text-amber-200 font-pixel text-[10px] tracking-wider uppercase flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Examinar Quadro (Detalhes)</span>
                </button>

                <button
                  onClick={() => onDirectConfirmMovie(currentMovie)}
                  className="px-4 py-3 bg-[#6b0913] hover:bg-[#991b1b] border-2 border-red-500 text-white font-pixel text-[10px] tracking-wider uppercase shadow-[0_0_25px_rgba(220,38,38,0.45)] flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                  <span>Escolher Este Filme</span>
                </button>

                {onRemoveMovieFromWall && !currentMovie.isSecret && (
                  <button
                    onClick={() => {
                      soundEngine.playDoorCreak();
                      onRemoveMovieFromWall(currentMovie.id);
                    }}
                    className="px-4 py-2 bg-[#16070a] hover:bg-red-950/90 border border-red-900/70 hover:border-red-500 text-red-300 hover:text-white font-vt text-sm tracking-wider uppercase flex items-center justify-center gap-1.5 transition cursor-pointer"
                    title="Excluir este quadro da parede do corredor"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Excluir Quadro da Parede</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0b060c] border-t-2 border-[#3d0e18] p-6 text-center space-y-3">
            <div className="font-gothic text-xl sm:text-2xl text-amber-200">
              A Parede da Galeria está Vazia
            </div>
            <p className="font-serif-horror text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
              Todos os quadros foram retirados da parede. Converse com o Mordomo George para escolher e pendurar novos filmes na galeria!
            </p>
            <button
              onClick={() => {
                soundEngine.playRomanticChime();
                onOpenButlerAgent();
              }}
              className="px-5 py-2.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-200 font-pixel text-[10px] uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>🕯️ Falar com George para Pendurar Quadros</span>
            </button>
          </div>
        )}

        {/* Quick Corridor Mini-Map Strip */}
        <div className="bg-[#060307] border-t border-[#260b12] px-3.5 py-2.5 flex items-center gap-2 overflow-x-auto">
          <span className="font-pixel text-[8px] text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
            Quadros do Corredor ({visibleMovies.length}):
          </span>
          {visibleMovies.length === 0 && (
            <span className="font-vt text-sm text-zinc-500 italic">
              Nenhum quadro pendurado — você tem controle total para adicionar novos com o George!
            </span>
          )}
          {visibleMovies.map((m, idx) => {
            const isCurrent = idx === activePaintingIdx;
            return (
              <div
                key={m.id}
                className={`border font-vt text-sm flex items-center shrink-0 transition ${
                  isCurrent
                    ? 'bg-[#3b0a14] border-amber-500 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : 'bg-[#0e070c] border-zinc-800 text-zinc-400 hover:border-red-800 hover:text-zinc-200'
                }`}
              >
                <button
                  onClick={() => walkToPainting(idx, isCurrent)}
                  className="px-2.5 py-1 flex items-center gap-1.5 cursor-pointer"
                >
                  <Skull
                    className={`w-3 h-3 ${
                      isCurrent ? 'text-amber-400' : 'text-red-700'
                    }`}
                  />
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
