import { CoupleConfig, HerAppearance, HimAppearance } from '../types/horror';

export interface CharacterAnimState {
  frame: number;
  isWalking: boolean;
  facing: 'left' | 'right';
  isScared: boolean;
  isLookingBack: boolean;
  isHoldingHands: boolean;
  blink: boolean;
}

// Helper to draw a crisp integer pixel rectangle
function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// Shade/tint hex color slightly for pixel art highlights & shadows
export function adjustHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const num = parseInt(clean, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Draws Aninha ("Olhinhos") in 2D Pixel Art
 */
export function drawAninhaPixelSprite(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  her: HerAppearance,
  anim: CharacterAnimState
) {
  const breath = !anim.isWalking && Math.floor(anim.frame / 28) % 2 === 1 ? 1 : 0;
  const shiver = anim.isScared ? (anim.frame % 2 === 0 ? -1 : 1) : 0;
  const walkBob = anim.isWalking ? (Math.floor(anim.frame / 6) % 2 === 0 ? -1 : 0) : 0;

  const x = Math.round(baseX + shiver);
  const y = Math.round(baseY + breath + walkBob);

  const hairMain = her.hairColor;
  const hairHighlight = adjustHex(her.hairColor, 26);
  const hairShadow = adjustHex(her.hairColor, -12);
  const skinMain = her.skinColor;
  const skinShadow = adjustHex(her.skinColor, -22);
  const coatMain = her.coatColor;
  const coatHighlight = adjustHex(her.coatColor, 22);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(x - 6, baseY + 1, 14, 3);

  // Back layer of long hair
  if (her.hairStyle === 'aninha_bangs_long' || her.hairStyle === 'long_wavy') {
    px(ctx, x - 6, y - 25, 14, 15, hairShadow);
  }

  // Legs & Boots (Walk cycle)
  const step = anim.isWalking ? Math.floor(anim.frame / 6) % 4 : 0;
  const leftLegY = step === 1 ? -1 : 0;
  const rightLegY = step === 3 ? -1 : 0;

  px(ctx, x - 3, y - 8 + leftLegY, 3, 6, '#15141b');
  px(ctx, x + 2, y - 8 + rightLegY, 3, 6, '#15141b');
  px(ctx, x - 3, y - 2 + leftLegY, 3, 2, '#09090c');
  px(ctx, x + 2, y - 2 + rightLegY, 3, 2, '#09090c');

  // Coat / Torso (Black Jacket)
  px(ctx, x - 5, y - 19, 12, 12, coatMain);
  px(ctx, x - 4, y - 19, 2, 11, coatHighlight);

  // Blue Scarf / Inner Collar detail
  px(ctx, x - 1, y - 19, 4, 3, her.scarfColor);
  px(ctx, x, y - 16, 2, 3, adjustHex(her.scarfColor, -25));

  // Silver chain shoulder bag strap across her black jacket
  if (her.hasChainBag) {
    px(ctx, x - 4, y - 18, 1, 1, '#cbd5e1');
    px(ctx, x - 3, y - 17, 1, 1, '#94a3b8');
    px(ctx, x - 2, y - 16, 1, 1, '#cbd5e1');
    px(ctx, x - 1, y - 15, 1, 1, '#94a3b8');
    px(ctx, x, y - 14, 1, 1, '#cbd5e1');
    px(ctx, x + 1, y - 13, 1, 1, '#94a3b8');
    px(ctx, x + 2, y - 12, 1, 1, '#cbd5e1');
    px(ctx, x + 3, y - 11, 3, 3, '#0b0b0f');
    px(ctx, x + 4, y - 11, 1, 1, '#cbd5e1');
  }

  // Outer Arm (left side)
  px(ctx, x - 6, y - 18, 2, 8, coatMain);
  px(ctx, x - 6, y - 10, 2, 2, skinMain);

  // Inner Arm (reaching toward Caldas on the right when holding hands!)
  if (anim.isHoldingHands) {
    px(ctx, x + 6, y - 17, 3, 6, coatMain);
    px(ctx, x + 8, y - 13, 3, 2, skinMain);
  } else {
    px(ctx, x + 6, y - 18, 2, 8, coatMain);
    px(ctx, x + 6, y - 10, 2, 2, skinMain);
  }

  // Neck
  px(ctx, x, y - 21, 2, 2, skinShadow);

  // Head & Face
  px(ctx, x - 4, y - 30, 10, 9, skinMain);
  px(ctx, x - 4, y - 22, 10, 1, skinShadow);

  // Subtle rosy cheeks
  px(ctx, x - 3, y - 24, 1, 1, '#d98a82');
  px(ctx, x + 4, y - 24, 1, 1, '#d98a82');

  // Expressive Eyes + Winged Eyeliner
  const eyeShift = anim.isLookingBack ? -1 : 0;
  if (!anim.blink) {
    px(ctx, x - 3 + eyeShift, y - 27, 3, 1, '#18131a');
    px(ctx, x + 2 + eyeShift, y - 27, 3, 1, '#18131a');
    px(ctx, x - 2 + eyeShift, y - 26, 2, 2, '#141015');
    px(ctx, x + 2 + eyeShift, y - 26, 2, 2, '#141015');
    px(ctx, x - 1 + eyeShift, y - 26, 1, 1, '#ffffff');
    px(ctx, x + 3 + eyeShift, y - 26, 1, 1, '#ffffff');
    px(ctx, x - 3 + eyeShift, y - 26, 1, 1, '#09070a');
  } else {
    px(ctx, x - 2, y - 25, 2, 1, '#18131a');
    px(ctx, x + 2, y - 25, 2, 1, '#18131a');
  }

  // Smile / Scared Mouth
  if (anim.isScared) {
    px(ctx, x, y - 23, 2, 2, '#991b1b');
  } else {
    px(ctx, x - 1, y - 23, 4, 1, '#b85d68');
  }

  // Hair Top & Signature Straight Bangs
  px(ctx, x - 5, y - 33, 12, 4, hairMain);
  px(ctx, x - 3, y - 32, 6, 1, hairHighlight);

  if (her.hairStyle === 'aninha_bangs_long' || her.hairStyle === 'bob_bangs') {
    px(ctx, x - 4, y - 29, 10, 2, hairMain);
    px(ctx, x - 2, y - 29, 2, 1, hairHighlight);
    px(ctx, x + 2, y - 29, 1, 1, hairHighlight);
  } else {
    px(ctx, x - 4, y - 29, 4, 2, hairMain);
    px(ctx, x + 3, y - 29, 3, 2, hairMain);
  }

  const sideLength = her.hairStyle === 'bob_bangs' ? 9 : 16;
  px(ctx, x - 6, y - 30, 2, sideLength, hairMain);
  px(ctx, x + 5, y - 30, 2, sideLength, hairMain);
  if (her.hairStyle === 'braided_goth') {
    px(ctx, x - 6, y - 16, 2, 5, hairShadow);
    px(ctx, x + 5, y - 16, 2, 5, hairShadow);
  }

  if (her.hasEarring) {
    px(ctx, x - 5, y - 25, 1, 2, her.earringColor);
    px(ctx, x - 5, y - 24, 1, 1, '#ffffff');
  }
}

/**
 * Draws Caldas in 2D Pixel Art
 */
export function drawCaldasPixelSprite(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  him: HimAppearance,
  anim: CharacterAnimState,
  lanternColor: string
) {
  const breath = !anim.isWalking && Math.floor((anim.frame + 10) / 28) % 2 === 1 ? 1 : 0;
  const shiver = anim.isScared ? (anim.frame % 2 === 0 ? 1 : -1) : 0;
  const walkBob = anim.isWalking ? (Math.floor(anim.frame / 6) % 2 === 0 ? -1 : 0) : 0;

  const x = Math.round(baseX + shiver);
  const y = Math.round(baseY + breath + walkBob);

  const hairMain = him.hairColor;
  const hairHighlight = adjustHex(him.hairColor, 28);
  const skinMain = him.skinColor;
  const skinShadow = adjustHex(him.skinColor, -24);
  const jacketMain = him.jacketColor;
  const jacketHighlight = adjustHex(him.jacketColor, 28);
  const beardColor = adjustHex(him.hairColor, 10);

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(x - 6, baseY + 1, 15, 3);

  // Legs & Boots
  const step = anim.isWalking ? Math.floor(anim.frame / 6) % 4 : 0;
  const leftLegY = step === 3 ? -1 : 0;
  const rightLegY = step === 1 ? -1 : 0;

  px(ctx, x - 4, y - 9 + leftLegY, 3, 7, '#1b1c24');
  px(ctx, x + 2, y - 9 + rightLegY, 3, 7, '#1b1c24');
  px(ctx, x - 4, y - 2 + leftLegY, 3, 2, '#0a0a0e');
  px(ctx, x + 2, y - 2 + rightLegY, 3, 2, '#0a0a0e');

  // Torso: Black Leather Jacket + Crisp White Crew-Neck T-Shirt inside
  px(ctx, x - 5, y - 21, 13, 12, jacketMain);
  px(ctx, x - 1, y - 20, 4, 11, him.shirtColor);
  px(ctx, x - 1, y - 11, 4, 2, adjustHex(him.shirtColor, -25));
  px(ctx, x - 4, y - 21, 3, 4, jacketHighlight);
  px(ctx, x + 3, y - 21, 3, 4, jacketHighlight);
  px(ctx, x - 2, y - 19, 1, 9, '#94a3b8');

  // Inner Arm (Left side — reaching out to hold Aninha's hand!)
  if (anim.isHoldingHands) {
    px(ctx, x - 7, y - 19, 3, 6, jacketMain);
    px(ctx, x - 8, y - 14, 3, 2, skinMain);
  } else {
    px(ctx, x - 7, y - 20, 2, 9, jacketMain);
    px(ctx, x - 7, y - 11, 2, 2, skinMain);
  }

  // Outer Arm (Right side)
  px(ctx, x + 7, y - 20, 2, 8, jacketMain);
  px(ctx, x + 8, y - 14, 2, 2, skinMain);

  // Warm Lantern / Cinema Light in his right hand
  if (him.hasLantern) {
    const sway = anim.isWalking ? (step % 2 === 0 ? 1 : -1) : 0;
    const lx = x + 9 + sway;
    const ly = y - 12;
    px(ctx, lx, ly, 1, 2, '#78716c');
    px(ctx, lx - 1, ly + 2, 3, 1, '#292524');
    px(ctx, lx - 1, ly + 3, 3, 4, lanternColor);
    px(ctx, lx, ly + 4, 1, 2, '#fef3c7');
    px(ctx, lx - 1, ly + 7, 3, 1, '#292524');
  }

  // Neck
  px(ctx, x, y - 22, 3, 2, skinShadow);

  // Head & Face
  px(ctx, x - 4, y - 32, 11, 10, skinMain);

  // Beard / Stubble
  if (him.beardStyle === 'short_stubble') {
    ctx.fillStyle = 'rgba(28, 22, 28, 0.58)';
    ctx.fillRect(x - 4, y - 25, 11, 3);
    ctx.fillRect(x - 2, y - 26, 7, 1);
  } else if (him.beardStyle === 'full_beard') {
    px(ctx, x - 4, y - 26, 11, 5, beardColor);
  }

  if (anim.isScared) {
    px(ctx, x, y - 25, 2, 2, '#7f1d1d');
  } else {
    px(ctx, x - 1, y - 25, 5, 1, '#f8fafc');
  }

  // Eyes & Thick Eyebrows
  const eyeShift = anim.isLookingBack ? 1 : 0;
  px(ctx, x - 3 + eyeShift, y - 29, 3, 1, hairMain);
  px(ctx, x + 3 + eyeShift, y - 29, 3, 1, hairMain);

  if (!anim.blink) {
    px(ctx, x - 2 + eyeShift, y - 28, 2, 2, '#141016');
    px(ctx, x + 3 + eyeShift, y - 28, 2, 2, '#141016');
    px(ctx, x - 2 + eyeShift, y - 28, 1, 1, '#ffffff');
    px(ctx, x + 3 + eyeShift, y - 28, 1, 1, '#ffffff');
  } else {
    px(ctx, x - 2, y - 27, 2, 1, '#141016');
    px(ctx, x + 3, y - 27, 2, 1, '#141016');
  }

  // Wavy / Tousled Dark Hair
  px(ctx, x - 5, y - 35, 13, 4, hairMain);
  if (him.hairStyle === 'wavy_short' || him.hairStyle === 'messy_curls') {
    px(ctx, x - 3, y - 36, 3, 1, hairMain);
    px(ctx, x + 2, y - 36, 4, 1, hairMain);
    px(ctx, x - 2, y - 34, 3, 1, hairHighlight);
    px(ctx, x + 3, y - 34, 2, 1, hairHighlight);
    px(ctx, x - 4, y - 31, 3, 2, hairMain);
    px(ctx, x + 1, y - 31, 2, 1, hairMain);
    px(ctx, x + 5, y - 31, 2, 2, hairMain);
  } else if (him.hairStyle === 'slick_back') {
    px(ctx, x - 4, y - 35, 11, 3, hairHighlight);
  }
  px(ctx, x - 5, y - 31, 1, 4, hairMain);
  px(ctx, x + 7, y - 31, 1, 4, hairMain);
}

/**
 * Draws a crisp Pixel Art Heart
 */
export function drawPixelHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  color: string = '#dc2626'
) {
  const x = Math.round(cx - 3);
  const y = Math.round(cy - 3);
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y, 2, 1);
  ctx.fillRect(x + 4, y, 2, 1);
  ctx.fillRect(x, y + 1, 7, 2);
  ctx.fillRect(x + 1, y + 3, 5, 1);
  ctx.fillRect(x + 2, y + 4, 3, 1);
  ctx.fillRect(x + 3, y + 5, 1, 1);
  ctx.fillStyle = '#fecaca';
  ctx.fillRect(x + 1, y + 1, 1, 1);
}

/**
 * EASTER EGG #1: Draws a Pixel Art Minion popping out of the Cinema Popcorn Machine!
 */
export function drawMinionPixelSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isHovered: boolean
) {
  const peek = isHovered ? -2 : Math.sin(frame * 0.05) > 0.6 ? -1 : 0;
  const mx = Math.round(x);
  const my = Math.round(y + peek);

  // Yellow pill body
  px(ctx, mx + 1, my, 8, 1, '#eab308');
  px(ctx, mx, my + 1, 10, 13, '#facc15');
  px(ctx, mx, my + 1, 2, 12, '#fde047');

  // Spiky black hair strands on top
  px(ctx, mx + 3, my - 2, 1, 2, '#09090b');
  px(ctx, mx + 5, my - 3, 1, 3, '#09090b');
  px(ctx, mx + 7, my - 2, 1, 2, '#09090b');

  // Black goggle strap
  px(ctx, mx, my + 4, 10, 2, '#18181b');

  // Silver Goggles (Two eyes)
  px(ctx, mx + 1, my + 3, 4, 4, '#94a3b8');
  px(ctx, mx + 5, my + 3, 4, 4, '#94a3b8');
  px(ctx, mx + 2, my + 4, 2, 2, '#ffffff');
  px(ctx, mx + 6, my + 4, 2, 2, '#ffffff');
  const pupilShift = Math.floor(frame / 40) % 2;
  px(ctx, mx + 2 + pupilShift, my + 4, 1, 1, '#451a03');
  px(ctx, mx + 6 + pupilShift, my + 4, 1, 1, '#451a03');

  // Smile
  px(ctx, mx + 3, my + 8, 4, 1, '#18181b');

  // Blue Denim Overalls
  px(ctx, mx + 1, my + 10, 8, 5, '#1d4ed8');
  px(ctx, mx, my + 9, 2, 2, '#1e40af');
  px(ctx, mx + 8, my + 9, 2, 2, '#1e40af');
  px(ctx, mx + 4, my + 11, 2, 2, '#172554');

  // Black gloves & boots
  px(ctx, mx - 1, my + 11, 1, 2, '#09090b');
  px(ctx, mx + 10, my + 11, 1, 2, '#09090b');
  px(ctx, mx + 2, my + 15, 2, 2, '#09090b');
  px(ctx, mx + 6, my + 15, 2, 2, '#09090b');

  // Tiny pixel Banana above him when active!
  if (isHovered) {
    px(ctx, mx + 3, my - 7, 4, 2, '#fde047');
    px(ctx, mx + 2, my - 6, 2, 2, '#eab308');
  }
}

/**
 * EASTER EGG #2: Draws Fantastic Mr. Fox (O Fantástico Sr. Raposo)
 * In his mustard/amber corduroy suit with bushy tail, golden apple cider & whistle click-click!
 */
export function drawFantasticMrFoxSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isActive: boolean
) {
  const fx = Math.round(x);
  const fy = Math.round(y + (isActive && frame % 12 < 6 ? -1 : 0));

  // Bushy Orange Tail with White Tip sticking out to the left
  px(ctx, fx - 5, fy + 10, 6, 4, '#ea580c');
  px(ctx, fx - 7, fy + 9, 3, 3, '#fef3c7');

  // Legs
  px(ctx, fx + 2, fy + 15, 2, 5, '#78350f');
  px(ctx, fx + 6, fy + 15, 2, 5, '#78350f');

  // Mustard / Corduroy Suit Jacket & White Shirt
  px(ctx, fx + 1, fy + 7, 8, 8, '#b45309');
  px(ctx, fx + 2, fy + 7, 6, 7, '#d97706');
  px(ctx, fx + 4, fy + 7, 2, 5, '#fef3c7'); // Shirt
  px(ctx, fx + 4, fy + 8, 2, 3, '#991b1b'); // Tie

  // Fox Head & Pointy Ears
  px(ctx, fx + 1, fy, 8, 7, '#ea580c');
  px(ctx, fx + 1, fy - 3, 2, 3, '#c2410c'); // Left ear
  px(ctx, fx + 7, fy - 3, 2, 3, '#c2410c'); // Right ear
  px(ctx, fx + 1, fy + 4, 8, 3, '#ffedd5'); // Cream cheeks/snout
  px(ctx, fx + 8, fy + 3, 3, 2, '#ea580c'); // Pointed snout
  px(ctx, fx + 10, fy + 3, 1, 1, '#09090b'); // Black nose

  // Clever eyes
  px(ctx, fx + 3, fy + 2, 1, 2, '#09090b');
  px(ctx, fx + 6, fy + 2, 1, 2, '#09090b');

  if (isActive) {
    // Holding a sparkling Golden Apple Cider bottle & musical whistle notes (*fi-fiu click-click*)
    px(ctx, fx + 10, fy + 7, 3, 6, '#facc15');
    px(ctx, fx + 11, fy + 5, 1, 2, '#dc2626');
    const noteBob = Math.floor(frame / 6) % 3;
    px(ctx, fx + 12, fy - 2 - noteBob, 2, 2, '#fde047');
    px(ctx, fx + 15, fy - 4 - noteBob, 2, 2, '#fbbf24');
  }
}

/**
 * EASTER EGG #3: Draws Megamind (Megamente)
 * Giant blue head, black goatee, dramatic high-collared black cape & blue lightning!
 */
export function drawMegamindSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isActive: boolean
) {
  const floatY = isActive ? Math.round(Math.sin(frame * 0.12) * 2) : 0;
  const mx = Math.round(x);
  const my = Math.round(y + floatY);

  // Dramatic High-Collar Black Cape
  px(ctx, mx - 2, my + 6, 16, 4, '#18181b'); // Spiky high collar
  px(ctx, mx, my + 8, 12, 13, '#09090b'); // Black suit & cape
  px(ctx, mx + 2, my + 9, 8, 11, '#1e293b');
  // Blue lightning chest emblem
  px(ctx, mx + 5, my + 11, 2, 4, '#38bdf8');

  // Iconic Giant Blue Cranium!
  px(ctx, mx + 1, my - 4, 10, 8, '#0284c7');
  px(ctx, mx, my - 3, 12, 6, '#0ea5e9');
  px(ctx, mx + 2, my - 4, 4, 2, '#7dd3fc'); // Forehead shine
  px(ctx, mx + 2, my + 3, 8, 5, '#0284c7'); // Lower face

  // Bright Green Eyes & Raised Eyebrows
  px(ctx, mx + 3, my + 3, 2, 2, '#ffffff');
  px(ctx, mx + 7, my + 3, 2, 2, '#ffffff');
  px(ctx, mx + 4, my + 3, 1, 2, '#22c55e');
  px(ctx, mx + 7, my + 3, 1, 2, '#22c55e');
  px(ctx, mx + 2, my + 2, 3, 1, '#09090b');
  px(ctx, mx + 7, my + 2, 3, 1, '#09090b');

  // Pointy Black Goatee
  px(ctx, mx + 5, my + 6, 2, 3, '#09090b');

  if (isActive) {
    // Dehydration Ray Gun + Electric Blue Lightning Bolts!
    px(ctx, mx + 12, my + 10, 4, 2, '#94a3b8');
    px(ctx, mx + 15, my + 9, 2, 4, '#38bdf8');
    if (frame % 4 < 2) {
      px(ctx, mx - 4, my - 6, 2, 5, '#38bdf8');
      px(ctx, mx + 14, my - 5, 2, 5, '#7dd3fc');
    }
  }
}

/**
 * EASTER EGG #4: Draws the Two Rocks from Everything Everywhere All at Once
 * With Googly Eyes when active!
 */
export function drawEeaaoRocksSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isActive: boolean
) {
  const rx = Math.round(x);
  const ry = Math.round(y);

  // Desert Canyon Ground Base
  px(ctx, rx, ry + 14, 28, 5, '#b45309');
  px(ctx, rx + 2, ry + 15, 24, 3, '#92400e');

  // Left Rock (Joy / Evelyn Rock — gets the Googly Eyes!)
  const rockShift = isActive ? Math.round(Math.sin(frame * 0.08) * 1) : 0;
  const lx = rx + 3 + rockShift;
  px(ctx, lx + 1, ry + 6, 9, 8, '#78716c');
  px(ctx, lx, ry + 8, 11, 6, '#57534e');
  px(ctx, lx + 2, ry + 6, 5, 2, '#a8a29e'); // Rock highlight

  // Right Rock (Silent companion rock)
  px(ctx, rx + 17, ry + 7, 8, 7, '#57534e');
  px(ctx, rx + 16, ry + 9, 10, 5, '#44403c');
  px(ctx, rx + 18, ry + 7, 4, 2, '#78716c');

  // Googly Eyes on the Left Rock!
  if (isActive || frame % 140 > 105) {
    // Two white plastic circles with jiggling black pupils
    const pShift = frame % 16 < 8 ? 0 : 1;
    px(ctx, lx + 2, ry + 8, 3, 3, '#ffffff');
    px(ctx, lx + 6, ry + 8, 3, 3, '#ffffff');
    px(ctx, lx + 3, ry + 9 + pShift, 1, 1, '#09090b');
    px(ctx, lx + 7, ry + 9 + (1 - pShift), 1, 1, '#09090b');
  }

  // Yellow Cinema Subtitle Bar above the rocks when triggered: "Just be a rock."
  if (isActive) {
    px(ctx, rx + 2, ry - 2, 24, 4, 'rgba(0,0,0,0.8)');
    px(ctx, rx + 4, ry - 1, 20, 2, '#facc15');
  }
}

/**
 * EASTER EGG #5: Draws Roz & Brightbill from The Wild Robot (Robô Selvagem)
 */
export function drawWildRobotSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isActive: boolean
) {
  const rx = Math.round(x);
  const ry = Math.round(y);

  // Mossy Torso & Metallic Shoulders
  px(ctx, rx + 2, ry + 9, 10, 10, '#64748b');
  px(ctx, rx + 3, ry + 9, 8, 9, '#94a3b8');
  // Green forest moss on left shoulder
  px(ctx, rx + 2, ry + 9, 4, 3, '#16a34a');
  px(ctx, rx + 3, ry + 11, 2, 2, '#22c55e');

  // Spherical Robot Head (ROZZUM 7134)
  px(ctx, rx + 2, ry, 10, 8, '#cbd5e1');
  px(ctx, rx + 1, ry + 1, 12, 6, '#94a3b8');
  px(ctx, rx + 3, ry, 5, 2, '#f8fafc'); // Metallic dome highlight

  // Glowing Optical Ring Eyes
  const eyeColor = isActive ? '#38bdf8' : '#fef08a';
  px(ctx, rx + 3, ry + 2, 3, 3, '#0f172a');
  px(ctx, rx + 8, ry + 2, 3, 3, '#0f172a');
  px(ctx, rx + 4, ry + 3, 1, 1, eyeColor);
  px(ctx, rx + 9, ry + 3, 1, 1, eyeColor);

  // Little Gosling Bico-Vivo (Brightbill) perched on her right shoulder!
  const flap = isActive && frame % 8 < 4 ? -1 : 0;
  px(ctx, rx + 11, ry + 6 + flap, 4, 3, '#a16207'); // Gosling body
  px(ctx, rx + 13, ry + 4 + flap, 3, 3, '#ca8a04'); // Head
  px(ctx, rx + 16, ry + 5 + flap, 2, 1, '#f97316'); // Orange bill

  // Orange Monarch Butterfly fluttering near Roz's hand when active!
  if (isActive) {
    const by = ry + 3 + Math.round(Math.sin(frame * 0.2) * 2);
    px(ctx, rx - 3, by, 2, 2, '#f97316');
    px(ctx, rx - 1, by + 1, 1, 2, '#09090b');
    px(ctx, rx, by, 2, 2, '#fb923c');
  }
}

/**
 * EASTER EGG #6: Draws My Neighbor Totoro (Meu Amigo Totoro) with Umbrella & Soot Sprites
 */
export function drawTotoroSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isActive: boolean
) {
  const bounce = isActive ? Math.round(Math.abs(Math.sin(frame * 0.12)) * -2) : 0;
  const tx = Math.round(x);
  const ty = Math.round(y + bounce);

  // Pointy Totoro Ears
  px(ctx, tx + 3, ty - 4, 2, 4, '#64748b');
  px(ctx, tx + 11, ty - 4, 2, 4, '#64748b');

  // Big Round Fluffy Grey Body
  px(ctx, tx + 2, ty, 12, 17, '#64748b');
  px(ctx, tx, ty + 3, 16, 13, '#64748b');
  px(ctx, tx + 2, ty + 1, 12, 14, '#94a3b8');

  // Cream Belly with Grey Chevron Marks
  px(ctx, tx + 3, ty + 7, 10, 9, '#fef3c7');
  px(ctx, tx + 4, ty + 9, 2, 1, '#64748b');
  px(ctx, tx + 7, ty + 8, 2, 1, '#64748b');
  px(ctx, tx + 10, ty + 9, 2, 1, '#64748b');
  px(ctx, tx + 5, ty + 12, 2, 1, '#64748b');
  px(ctx, tx + 9, ty + 12, 2, 1, '#64748b');

  // Wide Round Eyes, Nose & Whiskers
  px(ctx, tx + 3, ty + 2, 2, 2, '#ffffff');
  px(ctx, tx + 11, ty + 2, 2, 2, '#ffffff');
  px(ctx, tx + 4, ty + 3, 1, 1, '#09090b');
  px(ctx, tx + 11, ty + 3, 1, 1, '#09090b');
  px(ctx, tx + 7, ty + 3, 2, 1, '#1e293b'); // Nose

  // Green Leaf on head
  px(ctx, tx + 6, ty - 3, 4, 2, '#22c55e');
  px(ctx, tx + 8, ty - 4, 1, 2, '#15803d');

  // Red Umbrella & Soot Sprites (Susuwatari) when active!
  if (isActive) {
    px(ctx, tx + 14, ty - 5, 1, 12, '#cbd5e1'); // Umbrella shaft
    px(ctx, tx + 9, ty - 7, 11, 3, '#ef4444'); // Umbrella canopy
    px(ctx, tx + 11, ty - 8, 7, 1, '#dc2626');
    // Tiny black soot sprites with white eyes
    px(ctx, tx - 4, ty + 14, 3, 3, '#09090b');
    px(ctx, tx - 3, ty + 15, 1, 1, '#ffffff');
  }
}

/**
 * EASTER EGG #7: Draws Teen Beach Movie (Retro 60s Surfboard + Biker Leather Jacket)
 */
export function drawTeenBeachSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isActive: boolean
) {
  const sx = Math.round(x);
  const sy = Math.round(y);

  // Neon Tropical Wave Aura when active!
  if (isActive) {
    const waveOffset = Math.round(Math.sin(frame * 0.15) * 2);
    px(ctx, sx - 2, sy + 18 + waveOffset, 28, 5, '#06b6d4');
    px(ctx, sx, sy + 16 + waveOffset, 24, 2, '#67e8f9');
    // Retro Sun behind surfboard
    px(ctx, sx + 4, sy - 2, 14, 10, '#f59e0b');
    px(ctx, sx + 6, sy - 4, 10, 2, '#fde047');
  }

  // Tall Classic 1960s Striped Surfboard (Turquoise, Cream & Coral Stripe)
  px(ctx, sx + 4, sy, 6, 22, '#fef3c7');
  px(ctx, sx + 3, sy + 3, 8, 16, '#06b6d4');
  px(ctx, sx + 6, sy + 1, 2, 20, '#f43f5e'); // Center racing stripe
  px(ctx, sx + 5, sy - 1, 4, 1, '#fef3c7'); // Pointed nose

  // Biker Leather Jacket ("Rodents" / Motoqueiros) on stand beside surfboard
  px(ctx, sx + 13, sy + 8, 10, 11, '#18181b');
  px(ctx, sx + 14, sy + 8, 8, 4, '#27272a'); // Collar lapels
  px(ctx, sx + 15, sy + 9, 1, 1, '#e2e8f0'); // Silver lapel stud
  px(ctx, sx + 20, sy + 9, 1, 1, '#e2e8f0'); // Silver lapel stud
  px(ctx, sx + 17, sy + 10, 1, 8, '#cbd5e1'); // Diagonal silver zipper
}

/**
 * EASTER EGG #8: Draws Pitch Perfect (Blue Cup from "Cup Song" + Barden Bellas Microphone)
 */
export function drawPitchPerfectSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isActive: boolean
) {
  const pxBase = Math.round(x);
  const pyBase = Math.round(y);

  // Wooden Acoustic Countertop
  px(ctx, pxBase, pyBase + 16, 26, 12, '#291811');
  px(ctx, pxBase - 1, pyBase + 15, 28, 2, '#d97706');

  // The Iconic Blue Plastic Cup (bounces & flips rhythmically when active!)
  const cupHop = isActive ? Math.abs(Math.round(Math.sin(frame * 0.28) * 4)) : 0;
  const cx = pxBase + 5;
  const cy = pyBase + 8 - cupHop;
  px(ctx, cx, cy, 6, 7, '#2563eb');
  px(ctx, cx + 1, cy, 2, 6, '#60a5fa'); // Cup shine
  px(ctx, cx - 1, cy + 6, 8, 1, '#f8fafc'); // White rim (upside-down on table!)

  // Barden Bellas Vintage Silver Microphone with Yellow Scarf
  const mx = pxBase + 17;
  const my = pyBase + 3;
  px(ctx, mx + 1, my + 4, 2, 11, '#94a3b8'); // Mic stand
  px(ctx, mx - 1, my + 14, 6, 1, '#cbd5e1'); // Base
  px(ctx, mx, my, 4, 4, '#e2e8f0'); // Silver mesh head
  px(ctx, mx + 1, my + 1, 2, 2, '#64748b');
  // Barden Bellas Signature Yellow Neck Scarf tied to stand
  px(ctx, mx, my + 5, 5, 2, '#facc15');
  px(ctx, mx + 3, my + 7, 2, 3, '#eab308');

  // Floating Golden A Capella Musical Notes when active!
  if (isActive) {
    const nOff = Math.floor(frame / 5) % 5;
    px(ctx, pxBase + 3, pyBase - 2 - nOff, 2, 2, '#fbbf24');
    px(ctx, pxBase + 4, pyBase - 5 - nOff, 1, 3, '#fbbf24');
    px(ctx, pxBase + 14, pyBase - 4 - nOff, 2, 2, '#38bdf8');
    px(ctx, pxBase + 15, pyBase - 7 - nOff, 1, 3, '#38bdf8');
  }
}

/**
 * Draws both characters side by side on a standalone preview canvas
 */
export function renderCouplePortraitCanvas(
  canvas: HTMLCanvasElement,
  config: CoupleConfig,
  frame: number,
  isScared: boolean = false
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.6);
  grad.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
  grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.88)');
  grad.addColorStop(1, '#060812');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Red & Gold Cinema Carpet
  ctx.fillStyle = '#450a14';
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, h - 14, w, 1);

  const animState: CharacterAnimState = {
    frame,
    isWalking: false,
    facing: 'right',
    isScared,
    isLookingBack: false,
    isHoldingHands: true,
    blink: frame % 90 > 85,
  };

  const centerX = Math.floor(w / 2);
  const groundY = h - 13;

  drawAninhaPixelSprite(ctx, centerX - 11, groundY, config.her, animState);
  drawCaldasPixelSprite(ctx, centerX + 7, groundY, config.him, animState, config.lanternColor);

  const heartFloat = Math.sin(frame * 0.08) * 1.5;
  drawPixelHeart(ctx, centerX - 2, groundY - 38 + heartFloat, '#dc2626');
}

/**
 * Draws REVIVED GEORGE: "George, o Concierge & Curador Cinéfilo" (2D Pixel Art NPC)
 * Alive, warm human skin, burgundy & gold Grand Cinema tuxedo, holding a Director's Clapperboard!
 */
export function drawGhostButlerSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isHovered: boolean,
  isTalking: boolean = false
) {
  const breath = Math.floor(frame / 26) % 2 === 1 ? -1 : 0;
  const bx = Math.round(x);
  const by = Math.round(y + breath);

  ctx.save();

  // Warm Golden Spotlight Halo behind George
  const auraGrad = ctx.createRadialGradient(bx + 7, by - 14, 2, bx + 7, by - 14, 26);
  auraGrad.addColorStop(
    0,
    isHovered ? 'rgba(251, 191, 36, 0.48)' : 'rgba(245, 158, 11, 0.22)'
  );
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.fillRect(bx - 18, by - 40, 50, 52);

  // Ground shadow & Polished Black Dress Shoes (He is alive and standing on the floor!)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(bx + 1, y + 1, 12, 3);
  px(ctx, bx + 3, by - 6, 3, 5, '#1e293b'); // Left trouser leg
  px(ctx, bx + 8, by - 6, 3, 5, '#1e293b'); // Right trouser leg
  px(ctx, bx + 2, by - 1, 4, 2, '#09090b'); // Left shoe
  px(ctx, bx + 8, by - 1, 4, 2, '#09090b'); // Right shoe

  // Grand Cinema Burgundy Velvet Tuxedo Coat, Golden Vest & Red Bowtie
  px(ctx, bx + 2, by - 18, 10, 12, '#7f1d1d'); // Burgundy jacket
  px(ctx, bx + 3, by - 18, 2, 11, '#991b1b'); // Highlight
  px(ctx, bx + 5, by - 17, 4, 9, '#d97706'); // Golden waistcoat
  px(ctx, bx + 6, by - 18, 2, 5, '#ffffff'); // Crisp white dress shirt
  px(ctx, bx + 5, by - 17, 4, 1, '#dc2626'); // Red bowtie

  // Warm Human Head & Distinguished Chestnut/Silver Hair
  px(ctx, bx + 3, by - 27, 8, 9, '#ebbfa0'); // Warm living skin tone
  px(ctx, bx + 3, by - 23, 1, 1, '#d98a82'); // Rosy cheek
  px(ctx, bx + 10, by - 23, 1, 1, '#d98a82');
  px(ctx, bx + 2, by - 29, 10, 3, '#3b2516'); // Styled chestnut hair
  px(ctx, bx + 4, by - 29, 4, 1, '#784828'); // Hair shine
  px(ctx, bx + 2, by - 27, 2, 4, '#94a3b8'); // Distinguished silver temples
  px(ctx, bx + 10, by - 27, 2, 4, '#94a3b8');

  // Expressive Eyes & Golden Cinema Glasses / Monocle
  px(ctx, bx + 4, by - 24, 2, 2, '#18181b');
  px(ctx, bx + 8, by - 24, 2, 2, '#18181b');
  px(ctx, bx + 4, by - 24, 1, 1, '#ffffff');
  px(ctx, bx + 8, by - 24, 1, 1, '#ffffff');
  px(ctx, bx + 8, by - 22, 3, 1, '#fbbf24'); // Golden monocle rim

  // Mustache & Warm Smile
  px(ctx, bx + 5, by - 21, 4, 1, '#3b2516');
  if (isTalking && frame % 8 < 4) {
    px(ctx, bx + 6, by - 20, 2, 2, '#991b1b');
  } else {
    px(ctx, bx + 6, by - 20, 2, 1, '#ffffff');
  }

  // Raised Right Arm holding a Director's Clapperboard (Claquete de Cinema)!
  px(ctx, bx + 12, by - 17, 3, 2, '#7f1d1d');
  px(ctx, bx + 14, by - 18, 2, 2, '#ebbfa0');
  // Clapperboard Slate
  px(ctx, bx + 13, by - 24, 6, 5, '#0f172a');
  px(ctx, bx + 13, by - 25, 6, 2, '#18181b');
  px(ctx, bx + 14, by - 25, 1, 2, '#fbbf24');
  px(ctx, bx + 16, by - 25, 1, 2, '#fbbf24');
  px(ctx, bx + 18, by - 25, 1, 2, '#fbbf24');

  // Floating Cinema Speech Badge above his head
  if (isHovered || frame % 120 < 85) {
    const bob = Math.round(Math.sin(frame * 0.1) * 1);
    px(ctx, bx + 3, by - 36 + bob, 8, 5, '#18181b');
    px(ctx, bx + 4, by - 35 + bob, 6, 3, isHovered ? '#fbbf24' : '#f59e0b');
    px(ctx, bx + 6, by - 31 + bob, 2, 1, '#18181b');
  }

  ctx.restore();
}

/**
 * Renders Revived George's Live Talking Portrait in the Chat Modal
 */
export function renderButlerPortraitCanvas(
  canvas: HTMLCanvasElement,
  frame: number,
  isTalking: boolean,
  isThinking: boolean = false
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // 1. Warm Cinema Velvet Curtain & Golden Spotlight Backdrop
  const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.72);
  grad.addColorStop(
    0,
    isTalking
      ? 'rgba(251, 191, 36, 0.38)'
      : isThinking
      ? 'rgba(56, 189, 248, 0.28)'
      : 'rgba(245, 158, 11, 0.24)'
  );
  grad.addColorStop(0.65, 'rgba(69, 10, 20, 0.92)');
  grad.addColorStop(1, '#090d16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle velvet curtain folds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let sx = 6; sx < w; sx += 12) {
    ctx.fillRect(sx, 0, 4, h);
  }

  // Twinkling cinema stars
  for (let i = 0; i < 6; i++) {
    const mx = Math.round((i * 17 + frame * 0.2) % (w - 6)) + 3;
    const my = Math.round(8 + ((i * 13 + Math.sin(frame * 0.05 + i) * 5 + h) % (h - 16)));
    px(ctx, mx, my, 1, 1, i % 2 === 0 ? '#fde047' : '#fbbf24');
  }

  const cx = Math.floor(w / 2);
  const breathY = Math.round(Math.sin(frame * (isTalking ? 0.16 : 0.06)) * 1);
  const headTilt = isTalking ? Math.round(Math.sin(frame * 0.11) * 1) : 0;
  const bx = cx - 14 + headTilt;
  const by = h - 4 + breathY;

  // 2. Grand Cinema Burgundy Velvet Tuxedo, Golden Vest & Bowtie
  px(ctx, bx + 2, by - 22, 24, 20, '#7f1d1d'); // Burgundy velvet coat
  px(ctx, bx + 5, by - 22, 18, 18, '#991b1b'); // Coat lapels
  px(ctx, bx + 9, by - 20, 10, 15, '#d97706'); // Golden vest
  px(ctx, bx + 11, by - 21, 6, 9, '#ffffff'); // Crisp white shirt
  px(ctx, bx + 10, by - 19, 8, 2, '#dc2626'); // Classic red bow tie
  px(ctx, bx + 13, by - 19, 2, 2, '#fbbf24'); // Gold bow tie knot

  // 3. Living Warm Human Head, Rosy Cheeks & Styled Chestnut/Silver Hair
  px(ctx, bx + 5, by - 42, 18, 20, '#ebbfa0'); // Warm living skin
  px(ctx, bx + 7, by - 43, 14, 2, '#f5d0b5'); // Forehead highlight
  px(ctx, bx + 6, by - 31, 3, 2, '#d98a82'); // Rosy left cheek
  px(ctx, bx + 19, by - 31, 3, 2, '#d98a82'); // Rosy right cheek

  // Styled Director/Concierge Hair with silver temples
  px(ctx, bx + 3, by - 46, 22, 5, '#3b2516');
  px(ctx, bx + 5, by - 48, 17, 3, '#5c3a21');
  px(ctx, bx + 3, by - 41, 3, 10, '#94a3b8'); // Silver left temple
  px(ctx, bx + 22, by - 41, 3, 10, '#94a3b8'); // Silver right temple
  px(ctx, bx + 2, by - 37, 2, 5, '#dfa885');
  px(ctx, bx + 24, by - 37, 2, 5, '#dfa885');

  // 4. Expressive Eyebrows, Blinking Warm Eyes & Golden Frame
  const browRaise = isTalking && frame % 12 < 6 ? -1 : isThinking ? -1 : 0;
  px(ctx, bx + 7, by - 39 + browRaise, 5, 1, '#27170e');
  px(ctx, bx + 16, by - 40 + browRaise, 5, 1, '#27170e');

  const isBlinking = !isTalking && frame % 95 > 90;
  if (isBlinking) {
    px(ctx, bx + 8, by - 35, 4, 1, '#27170e');
    px(ctx, bx + 16, by - 35, 4, 1, '#27170e');
  } else {
    px(ctx, bx + 8, by - 36, 4, 3, '#18181b');
    px(ctx, bx + 16, by - 36, 4, 3, '#18181b');
    const lookX = isThinking ? (frame % 30 < 15 ? 0 : 2) : 1;
    px(ctx, bx + 8 + lookX, by - 36, 1, 1, '#ffffff');
    px(ctx, bx + 16 + lookX, by - 36, 1, 1, '#ffffff');
  }

  // Golden Monocle / Glasses Rim
  px(ctx, bx + 15, by - 37, 6, 1, '#fbbf24');
  px(ctx, bx + 15, by - 33, 6, 1, '#fbbf24');
  px(ctx, bx + 15, by - 36, 1, 3, '#fbbf24');
  px(ctx, bx + 20, by - 36, 1, 3, '#fbbf24');
  px(ctx, bx + 21, by - 33, 1, 10, '#d97706');

  // Nose & Charismatic Mustache
  px(ctx, bx + 13, by - 34, 2, 4, '#d49e7a');
  px(ctx, bx + 9, by - 29, 10, 2, '#3b2516');

  // 5. Lip-Sync Mouth Movement
  if (isTalking) {
    const mouthPhase = Math.floor(frame / 4) % 4;
    if (mouthPhase === 0) {
      px(ctx, bx + 11, by - 27, 6, 3, '#7f1d1d');
      px(ctx, bx + 12, by - 27, 4, 1, '#ffffff');
      px(ctx, bx + 12, by - 25, 4, 1, '#ef4444');
    } else if (mouthPhase === 1 || mouthPhase === 3) {
      px(ctx, bx + 11, by - 27, 6, 2, '#7f1d1d');
      px(ctx, bx + 12, by - 27, 4, 1, '#ffffff');
    } else {
      px(ctx, bx + 12, by - 27, 4, 1, '#991b1b');
    }
  } else if (isThinking) {
    px(ctx, bx + 13, by - 27, 3, 2, '#7f1d1d');
  } else {
    // Warm welcoming smile
    px(ctx, bx + 11, by - 27, 6, 1, '#ffffff');
    px(ctx, bx + 10, by - 28, 1, 1, '#b45309');
    px(ctx, bx + 17, by - 28, 1, 1, '#b45309');
  }

  // 6. Director's Clapperboard in corner when talking
  const clapBob = isTalking ? Math.round(Math.sin(frame * 0.25) * 1.5) : 0;
  px(ctx, w - 16, h - 14 + clapBob, 11, 8, '#0f172a');
  px(ctx, w - 16, h - 16 + clapBob, 11, 2, '#f59e0b');
  px(ctx, w - 14, h - 16 + clapBob, 2, 2, '#18181b');
  px(ctx, w - 10, h - 16 + clapBob, 2, 2, '#18181b');
}
