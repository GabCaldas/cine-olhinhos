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
 * Based on the uploaded photo:
 * - Long straight dark hair with straight fringe/bangs (franja reta)
 * - Silver drop earring on ear
 * - Black jacket/coat with silver chain bag strap & blue scarf/collar detail
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

  // Dark pants/tights & boots
  px(ctx, x - 3, y - 8 + leftLegY, 3, 6, '#15141b');
  px(ctx, x + 2, y - 8 + rightLegY, 3, 6, '#15141b');
  px(ctx, x - 3, y - 2 + leftLegY, 3, 2, '#09090c');
  px(ctx, x + 2, y - 2 + rightLegY, 3, 2, '#09090c');

  // Coat / Torso (Black Jacket)
  px(ctx, x - 5, y - 19, 12, 12, coatMain);
  px(ctx, x - 4, y - 19, 2, 11, coatHighlight); // Subtle rim light on jacket

  // Blue Scarf / Inner Collar detail (from photo!)
  px(ctx, x - 1, y - 19, 4, 3, her.scarfColor);
  px(ctx, x, y - 16, 2, 3, adjustHex(her.scarfColor, -25));

  // Silver chain shoulder bag strap across her black jacket (from photo!)
  if (her.hasChainBag) {
    px(ctx, x - 4, y - 18, 1, 1, '#cbd5e1');
    px(ctx, x - 3, y - 17, 1, 1, '#94a3b8');
    px(ctx, x - 2, y - 16, 1, 1, '#cbd5e1');
    px(ctx, x - 1, y - 15, 1, 1, '#94a3b8');
    px(ctx, x, y - 14, 1, 1, '#cbd5e1');
    px(ctx, x + 1, y - 13, 1, 1, '#94a3b8');
    px(ctx, x + 2, y - 12, 1, 1, '#cbd5e1');
    // Small purse at hip
    px(ctx, x + 3, y - 11, 3, 3, '#0b0b0f');
    px(ctx, x + 4, y - 11, 1, 1, '#cbd5e1');
  }

  // Outer Arm (left side)
  px(ctx, x - 6, y - 18, 2, 8, coatMain);
  px(ctx, x - 6, y - 10, 2, 2, skinMain);

  // Inner Arm (reaching toward Caldas on the right when holding hands!)
  if (anim.isHoldingHands) {
    px(ctx, x + 6, y - 17, 3, 6, coatMain);
    px(ctx, x + 8, y - 13, 3, 2, skinMain); // Hand reaching right
  } else {
    px(ctx, x + 6, y - 18, 2, 8, coatMain);
    px(ctx, x + 6, y - 10, 2, 2, skinMain);
  }

  // Neck
  px(ctx, x, y - 21, 2, 2, skinShadow);

  // Head & Face
  px(ctx, x - 4, y - 30, 10, 9, skinMain);
  px(ctx, x - 4, y - 22, 10, 1, skinShadow); // Chin contour

  // Subtle rosy cheeks
  px(ctx, x - 3, y - 24, 1, 1, '#d98a82');
  px(ctx, x + 4, y - 24, 1, 1, '#d98a82');

  // Expressive Eyes + Winged Eyeliner
  const eyeShift = anim.isLookingBack ? -1 : 0;
  if (!anim.blink) {
    // Eyebrows
    px(ctx, x - 3 + eyeShift, y - 27, 3, 1, '#18131a');
    px(ctx, x + 2 + eyeShift, y - 27, 3, 1, '#18131a');
    // Eyes
    px(ctx, x - 2 + eyeShift, y - 26, 2, 2, '#141015');
    px(ctx, x + 2 + eyeShift, y - 26, 2, 2, '#141015');
    // Eye sparkle
    px(ctx, x - 1 + eyeShift, y - 26, 1, 1, '#ffffff');
    px(ctx, x + 3 + eyeShift, y - 26, 1, 1, '#ffffff');
    // Winged eyeliner flick on outer edge
    px(ctx, x - 3 + eyeShift, y - 26, 1, 1, '#09070a');
  } else {
    px(ctx, x - 2, y - 25, 2, 1, '#18131a');
    px(ctx, x + 2, y - 25, 2, 1, '#18131a');
  }

  // Smile / Scared Mouth
  if (anim.isScared) {
    px(ctx, x, y - 23, 2, 2, '#991b1b');
  } else {
    px(ctx, x - 1, y - 23, 4, 1, '#b85d68'); // Warm rose lips from photo
  }

  // Hair Top & Signature Straight Bangs (Franja Reta da Aninha!)
  px(ctx, x - 5, y - 33, 12, 4, hairMain);
  px(ctx, x - 3, y - 32, 6, 1, hairHighlight); // Hair shine

  if (her.hairStyle === 'aninha_bangs_long' || her.hairStyle === 'bob_bangs') {
    // Full straight bangs across forehead
    px(ctx, x - 4, y - 29, 10, 2, hairMain);
    px(ctx, x - 2, y - 29, 2, 1, hairHighlight);
    px(ctx, x + 2, y - 29, 1, 1, hairHighlight);
  } else {
    // Side-parted waves
    px(ctx, x - 4, y - 29, 4, 2, hairMain);
    px(ctx, x + 3, y - 29, 3, 2, hairMain);
  }

  // Side hair locks framing face & shoulders
  const sideLength = her.hairStyle === 'bob_bangs' ? 9 : 16;
  px(ctx, x - 6, y - 30, 2, sideLength, hairMain);
  px(ctx, x + 5, y - 30, 2, sideLength, hairMain);
  if (her.hairStyle === 'braided_goth') {
    px(ctx, x - 6, y - 16, 2, 5, hairShadow);
    px(ctx, x + 5, y - 16, 2, 5, hairShadow);
  }

  // Silver Drop Earring (visible on her left side just like the photo!)
  if (her.hasEarring) {
    px(ctx, x - 5, y - 25, 1, 2, her.earringColor);
    px(ctx, x - 5, y - 24, 1, 1, '#ffffff');
  }
}

/**
 * Draws Caldas in 2D Pixel Art
 * Based on the uploaded photo:
 * - Short wavy/tousled dark hair
 * - Short beard/stubble along jawline & smile
 * - Black leather jacket with collar over a crisp white crew-neck t-shirt
 * - Holding a warm antique lantern in his outer hand
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

  // Torso: Black Leather Jacket + Crisp White Crew-Neck T-Shirt inside!
  px(ctx, x - 5, y - 21, 13, 12, jacketMain);
  // White T-Shirt visible down the center of the open leather jacket
  px(ctx, x - 1, y - 20, 4, 11, him.shirtColor);
  px(ctx, x - 1, y - 11, 4, 2, adjustHex(him.shirtColor, -25));
  // Leather jacket folded collar & sheen highlights
  px(ctx, x - 4, y - 21, 3, 4, jacketHighlight);
  px(ctx, x + 3, y - 21, 3, 4, jacketHighlight);
  px(ctx, x - 2, y - 19, 1, 9, '#94a3b8'); // Subtle silver zipper edge

  // Inner Arm (Left side — reaching out to hold Aninha's hand!)
  if (anim.isHoldingHands) {
    px(ctx, x - 7, y - 19, 3, 6, jacketMain);
    px(ctx, x - 8, y - 14, 3, 2, skinMain); // Joined hand!
  } else {
    px(ctx, x - 7, y - 20, 2, 9, jacketMain);
    px(ctx, x - 7, y - 11, 2, 2, skinMain);
  }

  // Outer Arm (Right side — holding the glowing lantern!)
  px(ctx, x + 7, y - 20, 2, 8, jacketMain);
  px(ctx, x + 8, y - 14, 2, 2, skinMain);

  // Antique Lantern in his right hand
  if (him.hasLantern) {
    const sway = anim.isWalking ? (step % 2 === 0 ? 1 : -1) : 0;
    const lx = x + 9 + sway;
    const ly = y - 12;
    px(ctx, lx, ly, 1, 2, '#78716c'); // Handle chain
    px(ctx, lx - 1, ly + 2, 3, 1, '#292524'); // Lantern cap
    px(ctx, lx - 1, ly + 3, 3, 4, lanternColor); // Glowing amber glass
    px(ctx, lx, ly + 4, 1, 2, '#fef3c7'); // Bright flame core
    px(ctx, lx - 1, ly + 7, 3, 1, '#292524'); // Lantern base
  }

  // Neck
  px(ctx, x, y - 22, 3, 2, skinShadow);

  // Head & Face
  px(ctx, x - 4, y - 32, 11, 10, skinMain);

  // Beard / Stubble (from photo!)
  if (him.beardStyle === 'short_stubble') {
    // Well-defined short beard along jaw, chin, and mustache
    ctx.fillStyle = 'rgba(28, 22, 28, 0.58)';
    ctx.fillRect(x - 4, y - 25, 11, 3);
    ctx.fillRect(x - 2, y - 26, 7, 1); // Mustache line
  } else if (him.beardStyle === 'full_beard') {
    px(ctx, x - 4, y - 26, 11, 5, beardColor);
  }

  // Smile (or scared mouth)
  if (anim.isScared) {
    px(ctx, x, y - 25, 2, 2, '#7f1d1d');
  } else {
    // Bright warm smile like in the photo!
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

  // Wavy / Tousled Dark Hair (from photo!)
  px(ctx, x - 5, y - 35, 13, 4, hairMain);
  if (him.hairStyle === 'wavy_short' || him.hairStyle === 'messy_curls') {
    // Lifted wavy locks on top & forehead curls
    px(ctx, x - 3, y - 36, 3, 1, hairMain);
    px(ctx, x + 2, y - 36, 4, 1, hairMain);
    px(ctx, x - 2, y - 34, 3, 1, hairHighlight);
    px(ctx, x + 3, y - 34, 2, 1, hairHighlight);
    // Forehead wavy lock
    px(ctx, x - 4, y - 31, 3, 2, hairMain);
    px(ctx, x + 1, y - 31, 2, 1, hairMain);
    px(ctx, x + 5, y - 31, 2, 2, hairMain);
  } else if (him.hairStyle === 'slick_back') {
    px(ctx, x - 4, y - 35, 11, 3, hairHighlight);
  }
  // Sideburns
  px(ctx, x - 5, y - 31, 1, 4, hairMain);
  px(ctx, x + 7, y - 31, 1, 4, hairMain);
}

/**
 * Draws a crisp Pixel Art Gothic Heart
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
  // Specular pixel shine
  ctx.fillStyle = '#fecaca';
  ctx.fillRect(x + 1, y + 1, 1, 1);
}

/**
 * Draws a Blair Witch stick rune hanging from tree branches
 */
export function drawStickRune(ctx: CanvasRenderingContext2D, x: number, y: number, sway: number) {
  const rx = Math.round(x + sway);
  ctx.fillStyle = '#44382c';
  ctx.fillRect(x, y - 6, 1, 6); // String
  ctx.fillStyle = '#6b5744';
  ctx.fillRect(rx, y, 1, 9);
  ctx.fillRect(rx - 3, y + 2, 7, 1);
  ctx.fillRect(rx - 2, y + 5, 5, 1);
  ctx.fillRect(rx - 2, y + 3, 1, 4);
  ctx.fillRect(rx + 2, y + 3, 1, 4);
}

/**
 * EASTER EGG #1: Draws a Pixel Art Minion hiding in the dark mansion corridor
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

  // Little shadow
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(mx - 1, y + 17, 12, 2);

  // Yellow pill body
  px(ctx, mx + 1, my, 8, 1, '#eab308');
  px(ctx, mx, my + 1, 10, 13, '#facc15');
  px(ctx, mx, my + 1, 2, 12, '#fde047'); // Highlight

  // Spiky black hair strands on top
  px(ctx, mx + 3, my - 2, 1, 2, '#09090b');
  px(ctx, mx + 5, my - 3, 1, 3, '#09090b');
  px(ctx, mx + 7, my - 2, 1, 2, '#09090b');

  // Black goggle strap
  px(ctx, mx, my + 4, 10, 2, '#18181b');

  // Silver Goggles (Two eyes)
  px(ctx, mx + 1, my + 3, 4, 4, '#94a3b8');
  px(ctx, mx + 5, my + 3, 4, 4, '#94a3b8');
  // White eyeballs
  px(ctx, mx + 2, my + 4, 2, 2, '#ffffff');
  px(ctx, mx + 6, my + 4, 2, 2, '#ffffff');
  // Pupils looking around
  const pupilShift = Math.floor(frame / 40) % 2;
  px(ctx, mx + 2 + pupilShift, my + 4, 1, 1, '#451a03');
  px(ctx, mx + 6 + pupilShift, my + 4, 1, 1, '#451a03');

  // Little smile
  px(ctx, mx + 3, my + 8, 4, 1, '#18181b');

  // Blue Denim Overalls
  px(ctx, mx + 1, my + 10, 8, 5, '#1d4ed8');
  px(ctx, mx, my + 9, 2, 2, '#1e40af'); // Left strap
  px(ctx, mx + 8, my + 9, 2, 2, '#1e40af'); // Right strap
  px(ctx, mx + 4, my + 11, 2, 2, '#172554'); // Front pocket

  // Black gloves & boots
  px(ctx, mx - 1, my + 11, 1, 2, '#09090b');
  px(ctx, mx + 10, my + 11, 1, 2, '#09090b');
  px(ctx, mx + 2, my + 15, 2, 2, '#09090b');
  px(ctx, mx + 6, my + 15, 2, 2, '#09090b');

  // If hovered, show a tiny pixel Banana above him!
  if (isHovered) {
    px(ctx, mx + 3, my - 7, 4, 2, '#fde047');
    px(ctx, mx + 2, my - 6, 2, 2, '#eab308');
  }
}


/**
 * EASTER EGG #3: Draws Ghostface (Scream) peeking from behind the velvet curtain
 */
export function drawGhostfaceSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isHovered: boolean
) {
  const gx = Math.round(x + (isHovered ? 2 : 0));
  const gy = Math.round(y);

  // Black hood & shroud
  px(ctx, gx - 2, gy - 2, 12, 24, '#09090b');
  // Elongated white Scream mask
  px(ctx, gx + 1, gy + 1, 6, 10, '#f1f5f9');
  px(ctx, gx + 2, gy + 11, 4, 3, '#e2e8f0');
  // Hollow black eyes
  px(ctx, gx + 2, gy + 4, 2, 3, '#09090b');
  px(ctx, gx + 5, gy + 4, 2, 3, '#09090b');
  // Elongated screaming mouth
  px(ctx, gx + 3, gy + 8, 2, 5, '#09090b');

  // Glinting silver knife blade when hovered!
  if (isHovered) {
    px(ctx, gx + 9, gy + 10, 2, 7, '#cbd5e1');
    px(ctx, gx + 9, gy + 8, 1, 2, '#ffffff');
    px(ctx, gx + 8, gy + 17, 3, 2, '#18181b');
  }
}

/**
 * EASTER EGG #4: Draws Pennywise's Red Balloon & Glowing Yellow Eyes in the floor grate
 */
export function drawPennywiseBalloonSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isHovered: boolean
) {
  const floatY = Math.round(Math.sin(frame * 0.06) * 2.5);
  const bx = Math.round(x);
  const by = Math.round(y + floatY);

  // Dark floor grate at base
  px(ctx, bx - 4, y + 26, 16, 5, '#050507');
  px(ctx, bx - 2, y + 27, 1, 3, '#1e1b24');
  px(ctx, bx + 2, y + 27, 1, 3, '#1e1b24');
  px(ctx, bx + 6, y + 27, 1, 3, '#1e1b24');

  // Pennywise's glowing yellow eyes inside the dark grate!
  if (isHovered || frame % 120 > 70) {
    px(ctx, bx + 1, y + 28, 2, 1, '#facc15');
    px(ctx, bx + 5, y + 28, 2, 1, '#facc15');
  }

  // Balloon string
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(bx + 3, by + 10, 1, 16 - floatY);

  // Red Balloon
  px(ctx, bx + 1, by, 6, 1, '#dc2626');
  px(ctx, bx, by + 1, 8, 7, '#ef4444');
  px(ctx, bx + 1, by + 8, 6, 2, '#b91c1c');
  px(ctx, bx + 3, by + 10, 2, 1, '#dc2626');
  // Specular shine on balloon
  px(ctx, bx + 1, by + 2, 2, 2, '#fecaca');
}

/**
 * EASTER EGG #5: Draws Billy the Puppet (Saw / Jogos Mortais) on his red tricycle
 */
export function drawJigsawBillySprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isHovered: boolean
) {
  const jx = Math.round(x + (isHovered ? 2 : 0));
  const jy = Math.round(y);

  // Red tricycle wheels & frame
  px(ctx, jx, jy + 18, 4, 4, '#18181b');
  px(ctx, jx + 8, jy + 18, 4, 4, '#18181b');
  px(ctx, jx + 2, jy + 15, 8, 3, '#dc2626');

  // Black Tuxedo & Red Bowtie
  px(ctx, jx + 3, jy + 8, 6, 8, '#09090b');
  px(ctx, jx + 5, jy + 9, 2, 5, '#f8fafc');
  px(ctx, jx + 4, jy + 9, 4, 1, '#ef4444'); // Red bowtie

  // Pale Puppet Head, Black Hair & Red Spiral Cheeks
  px(ctx, jx + 2, jy, 8, 8, '#f1f5f9');
  px(ctx, jx + 1, jy - 1, 10, 2, '#09090b');
  // Red eyes
  px(ctx, jx + 3, jy + 2, 2, 2, '#09090b');
  px(ctx, jx + 7, jy + 2, 2, 2, '#09090b');
  px(ctx, jx + 4, jy + 3, 1, 1, '#ef4444');
  px(ctx, jx + 7, jy + 3, 1, 1, '#ef4444');
  // Iconic red cheek spirals
  px(ctx, jx + 2, jy + 5, 2, 2, '#dc2626');
  px(ctx, jx + 8, jy + 5, 2, 2, '#dc2626');
}

/**
 * EASTER EGG #8: Draws Jason Voorhees's Hockey Mask mounted on the wall
 */
export function drawJasonMaskSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isHovered: boolean
) {
  const mx = Math.round(x);
  const my = Math.round(y);

  // Aged bone-white oval hockey mask
  px(ctx, mx + 2, my, 8, 1, '#d6d3d1');
  px(ctx, mx + 1, my + 1, 10, 11, '#e7e5e4');
  px(ctx, mx + 2, my + 12, 8, 2, '#d6d3d1');

  // Dark eye holes (glow red when hovered!)
  ctx.fillStyle = isHovered ? '#ef4444' : '#09090b';
  ctx.fillRect(mx + 2, my + 4, 3, 2);
  ctx.fillRect(mx + 7, my + 4, 3, 2);

  // Iconic Red Chevrons on forehead & cheeks
  px(ctx, mx + 5, my + 1, 2, 2, '#dc2626');
  px(ctx, mx + 2, my + 8, 2, 1, '#dc2626');
  px(ctx, mx + 8, my + 8, 2, 1, '#dc2626');

  // Breath holes
  px(ctx, mx + 5, my + 9, 2, 1, '#1c1917');
  px(ctx, mx + 4, my + 11, 1, 1, '#1c1917');
  px(ctx, mx + 7, my + 11, 1, 1, '#1c1917');
}

/**
 * Draws both characters side by side on a standalone preview canvas (for Customizer & Final Ritual)
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

  // Dark atmospheric backdrop with lantern halo
  const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.6);
  grad.addColorStop(0, 'rgba(180, 60, 30, 0.28)');
  grad.addColorStop(0.6, 'rgba(20, 8, 14, 0.85)');
  grad.addColorStop(1, '#060408');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Ground cobblestones
  ctx.fillStyle = '#121017';
  ctx.fillRect(0, h - 14, w, 14);
  ctx.fillStyle = '#241f2b';
  for (let gx = 4; gx < w; gx += 12) {
    ctx.fillRect(gx, h - 12, 8, 3);
  }

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

  // Draw Aninha on left, Caldas on right holding hands
  drawAninhaPixelSprite(ctx, centerX - 11, groundY, config.her, animState);
  drawCaldasPixelSprite(ctx, centerX + 7, groundY, config.him, animState, config.lanternColor);

  // Floating pixel heart between them
  const heartFloat = Math.sin(frame * 0.08) * 1.5;
  drawPixelHeart(ctx, centerX - 2, groundY - 38 + heartFloat, '#dc2626');
}

/**
 * Draws "Arthur, o Curador Fantasma da Mansão" (2D Pixel Art AI Agent NPC)
 * Standing beside a spectral lectern & holding a brass candelabra.
 */
export function drawGhostButlerSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number,
  isHovered: boolean,
  isTalking: boolean = false
) {
  const floatY = Math.round(Math.sin(frame * 0.07) * 1.8);
  const bx = Math.round(x);
  const by = Math.round(y + floatY);

  ctx.save();

  // Spectral cyan/crimson aura halo behind the butler
  const auraGrad = ctx.createRadialGradient(bx + 7, by - 14, 2, bx + 7, by - 14, 26);
  auraGrad.addColorStop(
    0,
    isHovered ? 'rgba(245, 158, 11, 0.42)' : 'rgba(56, 189, 248, 0.22)'
  );
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.fillRect(bx - 18, by - 40, 50, 52);

  // Wispy ghost tail / Victorian coattails fading into mist at bottom
  px(ctx, bx + 3, by - 7, 8, 5, '#0f172a');
  px(ctx, bx + 4, by - 2, 2, 3, '#1e293b');
  px(ctx, bx + 8, by - 2, 2, 4, '#1e293b');

  // Victorian Tuxedo Coat, Crimson Vest & White Cravat
  px(ctx, bx + 2, by - 18, 10, 11, '#090d16'); // Dark tailcoat
  px(ctx, bx + 5, by - 17, 4, 8, '#7f1d1d'); // Burgundy waistcoat
  px(ctx, bx + 6, by - 18, 2, 5, '#e2e8f0'); // White cravat
  px(ctx, bx + 6, by - 16, 2, 2, '#dc2626'); // Ruby cravat pin

  // Pale Spectral Head & Silver-Gray Swept Hair
  px(ctx, bx + 3, by - 27, 8, 9, '#cbd5e1'); // Pale ghostly skin
  px(ctx, bx + 2, by - 29, 10, 3, '#64748b'); // Silver hair top
  px(ctx, bx + 2, by - 27, 2, 4, '#475569'); // Sideburn left
  px(ctx, bx + 10, by - 27, 2, 4, '#475569'); // Sideburn right

  // Glowing Eyes & Golden Monocle on right eye
  const eyeColor = isHovered ? '#fbbf24' : '#38bdf8';
  px(ctx, bx + 4, by - 24, 2, 2, '#09090b');
  px(ctx, bx + 8, by - 24, 2, 2, '#09090b');
  px(ctx, bx + 5, by - 24, 1, 1, eyeColor);
  px(ctx, bx + 8, by - 24, 1, 1, eyeColor);
  // Monocle rim & chain
  px(ctx, bx + 8, by - 22, 3, 1, '#f59e0b');
  px(ctx, bx + 10, by - 21, 1, 4, '#b45309');

  // Trim mustache / mouth (animates when talking)
  px(ctx, bx + 5, by - 21, 4, 1, '#475569');
  if (isTalking && frame % 8 < 4) {
    px(ctx, bx + 6, by - 20, 2, 2, '#09090b');
  }

  // Raised right arm holding a 3-candle Brass Candelabra!
  px(ctx, bx + 12, by - 17, 3, 2, '#090d16');
  px(ctx, bx + 14, by - 18, 2, 2, '#cbd5e1'); // Gloved hand
  // Brass candelabra
  px(ctx, bx + 15, by - 24, 1, 8, '#d97706');
  px(ctx, bx + 13, by - 22, 5, 1, '#d97706');
  // 3 flickering spectral flames
  const fColor = frame % 7 === 0 ? '#38bdf8' : '#fbbf24';
  px(ctx, bx + 13, by - 25, 1, 3, '#f8fafc');
  px(ctx, bx + 15, by - 26, 1, 3, '#f8fafc');
  px(ctx, bx + 17, by - 25, 1, 3, '#f8fafc');
  px(ctx, bx + 13, by - 27, 1, 2, fColor);
  px(ctx, bx + 15, by - 28, 1, 2, fColor);
  px(ctx, bx + 17, by - 27, 1, 2, fColor);

  // Floating "[IA]" / Speech prompt above his head when hovered or idle
  if (isHovered || frame % 120 < 85) {
    const bob = Math.round(Math.sin(frame * 0.1) * 1);
    px(ctx, bx + 3, by - 36 + bob, 8, 5, '#18181b');
    px(ctx, bx + 4, by - 35 + bob, 6, 3, isHovered ? '#f59e0b' : '#dc2626');
    px(ctx, bx + 6, by - 31 + bob, 2, 1, '#18181b');
  }

  ctx.restore();
}

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

  // 1. Gothic Velvet & Cyan Ectoplasm Backdrop
  const grad = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w * 0.72);
  grad.addColorStop(
    0,
    isTalking
      ? 'rgba(56, 189, 248, 0.36)'
      : isThinking
      ? 'rgba(245, 158, 11, 0.30)'
      : 'rgba(56, 189, 248, 0.20)'
  );
  grad.addColorStop(0.65, 'rgba(22, 8, 18, 0.94)');
  grad.addColorStop(1, '#050307');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle wallpaper stripes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let sx = 6; sx < w; sx += 12) {
    ctx.fillRect(sx, 0, 4, h);
  }

  // Floating ectoplasm motes
  for (let i = 0; i < 6; i++) {
    const mx = Math.round((i * 17 + frame * 0.3) % (w - 6)) + 3;
    const my = Math.round(8 + ((i * 13 + Math.sin(frame * 0.06 + i) * 6 + h) % (h - 16)));
    px(ctx, mx, my, 1, 1, i % 2 === 0 ? '#38bdf8' : '#fbbf24');
  }

  const cx = Math.floor(w / 2);
  const floatY = Math.round(
    Math.sin(frame * (isTalking ? 0.16 : 0.07)) * (isTalking ? 2.2 : 1.4)
  );
  const headTilt = isTalking ? Math.round(Math.sin(frame * 0.11) * 1) : 0;
  const bx = cx - 14 + headTilt;
  const by = h - 6 + floatY;

  // 2. Victorian Tailcoat Shoulders, Crimson Waistcoat & Cravat
  px(ctx, bx + 2, by - 22, 24, 20, '#090d16'); // Broad Victorian tailcoat
  px(ctx, bx + 5, by - 22, 18, 18, '#111827'); // Coat lapels
  px(ctx, bx + 9, by - 20, 10, 15, '#7f1d1d'); // Crimson velvet vest
  px(ctx, bx + 11, by - 21, 6, 9, '#f1f5f9'); // White silk cravat
  px(ctx, bx + 13, by - 18, 2, 3, '#ef4444'); // Glowing ruby pin

  // 3. Pale Spectral Head, Cheekbones & Swept Silver Hair
  px(ctx, bx + 5, by - 42, 18, 20, '#cbd5e1'); // Face base
  px(ctx, bx + 7, by - 43, 14, 2, '#e2e8f0'); // Forehead highlight
  // Silver Victorian hair & sculpted sideburns
  px(ctx, bx + 3, by - 46, 22, 5, '#64748b');
  px(ctx, bx + 5, by - 48, 17, 3, '#94a3b8');
  px(ctx, bx + 3, by - 41, 3, 11, '#475569'); // Left sideburn
  px(ctx, bx + 22, by - 41, 3, 11, '#475569'); // Right sideburn
  // Aristocratic ears
  px(ctx, bx + 2, by - 37, 2, 5, '#94a3b8');
  px(ctx, bx + 24, by - 37, 2, 5, '#94a3b8');

  // 4. Expressive Eyebrows, Blinking Eyes & Golden Monocle
  const browRaise = isTalking && frame % 12 < 6 ? -1 : isThinking ? -1 : 0;
  px(ctx, bx + 7, by - 39 + browRaise, 5, 1, '#334155'); // Left brow
  px(ctx, bx + 16, by - 40 + browRaise, 5, 1, '#334155'); // Right raised monocle brow

  const isBlinking = !isTalking && frame % 95 > 90;
  const eyeGlow = isTalking ? '#38bdf8' : isThinking ? '#fbbf24' : '#7dd3fc';
  if (isBlinking) {
    px(ctx, bx + 8, by - 35, 4, 1, '#334155');
    px(ctx, bx + 16, by - 35, 4, 1, '#334155');
  } else {
    px(ctx, bx + 8, by - 36, 4, 3, '#09090b');
    px(ctx, bx + 16, by - 36, 4, 3, '#09090b');
    const lookX = isThinking ? (frame % 30 < 15 ? 0 : 2) : 1;
    px(ctx, bx + 8 + lookX, by - 35, 2, 2, eyeGlow);
    px(ctx, bx + 16 + lookX, by - 35, 2, 2, '#fbbf24');
  }

  // Golden Monocle Frame & Swinging Chain on Right Eye
  px(ctx, bx + 15, by - 37, 6, 1, '#f59e0b');
  px(ctx, bx + 15, by - 33, 6, 1, '#f59e0b');
  px(ctx, bx + 15, by - 36, 1, 3, '#f59e0b');
  px(ctx, bx + 20, by - 36, 1, 3, '#f59e0b');
  if (frame % 40 < 10) {
    px(ctx, bx + 16, by - 36, 1, 1, '#ffffff'); // Monocle lens glint
  }
  const chainSwing = isTalking ? Math.round(Math.sin(frame * 0.2) * 1) : 0;
  px(ctx, bx + 21 + chainSwing, by - 33, 1, 8, '#d97706');

  // Nose
  px(ctx, bx + 13, by - 35, 2, 5, '#94a3b8');

  // 5. LIVE TALKING MOUTH & TWITCHING HANDLEBAR MUSTACHE!
  const talkPhase = isTalking ? Math.floor(frame / 3) % 4 : 0;
  const mustacheLift = isTalking && (talkPhase === 1 || talkPhase === 3) ? -1 : 0;

  // Sculpted Victorian handlebar mustache
  px(ctx, bx + 8, by - 29 + mustacheLift, 12, 2, '#475569');
  px(ctx, bx + 6, by - 28 + mustacheLift, 3, 2, '#64748b');
  px(ctx, bx + 19, by - 28 + mustacheLift, 3, 2, '#64748b');

  if (isTalking) {
    if (talkPhase === 1) {
      // Mouth half open
      px(ctx, bx + 11, by - 27, 6, 3, '#09090b');
      px(ctx, bx + 12, by - 27, 4, 1, '#f8fafc'); // Upper teeth
      px(ctx, bx + 12, by - 25, 4, 1, '#ef4444'); // Tongue
    } else if (talkPhase === 2) {
      // Mouth wide open ('O' syllable) + lower jaw drop
      px(ctx, bx + 10, by - 22, 8, 1, '#cbd5e1'); // Dropped chin
      px(ctx, bx + 11, by - 27, 6, 4, '#09090b');
      px(ctx, bx + 12, by - 27, 4, 1, '#f8fafc');
      px(ctx, bx + 13, by - 25, 2, 2, '#dc2626');
    } else if (talkPhase === 3) {
      // Witty smirk syllable
      px(ctx, bx + 10, by - 27, 7, 2, '#09090b');
      px(ctx, bx + 11, by - 27, 5, 1, '#e2e8f0');
    } else {
      // Closed syllable beat
      px(ctx, bx + 11, by - 26, 6, 1, '#1e293b');
    }
  } else if (isThinking) {
    // Thoughtful pursed mouth
    px(ctx, bx + 12, by - 26, 3, 2, '#1e293b');
  } else {
    // Subtle gentlemanly smile
    px(ctx, bx + 11, by - 26, 6, 1, '#334155');
    px(ctx, bx + 17, by - 27, 1, 1, '#334155');
  }

  // 6. Animated Left Hand Gesture (Talks with his white-gloved hand or strokes chin when thinking!)
  if (isThinking) {
    // Hand raised to chin in deep thought
    px(ctx, bx + 6, by - 24, 5, 4, '#f8fafc');
    px(ctx, bx + 10, by - 26, 2, 3, '#f8fafc');
  } else if (isTalking) {
    const gestureY = Math.round(Math.sin(frame * 0.22) * 3);
    px(ctx, bx - 4, by - 22 + gestureY, 5, 4, '#f8fafc'); // White glove
    px(ctx, bx - 3, by - 25 + gestureY, 2, 3, '#f8fafc'); // Raised index finger
  }

  // 7. Right Hand Holding Flickering 3-Candle Brass Candelabra
  const candY = by - 24 + Math.round(Math.cos(frame * 0.1) * 1);
  px(ctx, bx + 26, candY + 4, 4, 4, '#f8fafc'); // Gloved hand
  px(ctx, bx + 28, candY - 6, 2, 14, '#d97706'); // Candelabra stem
  px(ctx, bx + 24, candY - 2, 10, 2, '#b45309'); // Candelabra arms
  // 3 Candles
  px(ctx, bx + 24, candY - 7, 2, 5, '#fef3c7');
  px(ctx, bx + 28, candY - 9, 2, 7, '#fef3c7');
  px(ctx, bx + 32, candY - 7, 2, 5, '#fef3c7');
  // Animated dancing flames
  const sway = frame % 6 < 3 ? 0 : 1;
  const flameOuter = isTalking ? '#38bdf8' : '#f59e0b';
  px(ctx, bx + 24 + sway, candY - 10, 2, 3, flameOuter);
  px(ctx, bx + 28, candY - 13, 2, 4, flameOuter);
  px(ctx, bx + 32 - sway, candY - 10, 2, 3, flameOuter);
  px(ctx, bx + 28, candY - 11, 1, 2, '#ffffff');

  // 8. Speech Wave Arcs when Arthur is Actively Talking!
  if (isTalking) {
    const waveAlpha = (frame % 16) / 16;
    ctx.strokeStyle =
      waveAlpha < 0.5 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 1;
    const r1 = 3 + (frame % 6);
    ctx.beginPath();
    ctx.arc(bx + 4, by - 28, r1, (Math.PI * 0.75), (Math.PI * 1.25));
    ctx.stroke();
  }
}

