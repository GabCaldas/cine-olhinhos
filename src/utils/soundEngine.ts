// Procedural 2D Pixel Art Chiptune Horror Soundtrack & Foley Engine (Web Audio API)
// Generates a haunting retro 2D horror melody (inspired by Castlevania, Lavender Town, Resident Evil & FAITH)
// plus atmospheric rain and interactive horror sound effects.

class HorrorSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isAmbientRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private stepIndex: number = 0;

  private ensureContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.72;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.72, this.ctx.currentTime, 0.08);
    }
    if (!muted && !this.isAmbientRunning) {
      this.startAmbient();
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Starts the 2D Pixel Horror Chiptune Soundtrack + Subtle Rain Ambience
   */
  public startAmbient(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isAmbientRunning) return;

    try {
      this.isAmbientRunning = true;

      // 1. Subtle Background Rain Layer
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.048;
        b2 = 0.940 * b2 + white * 0.085;
        output[i] = (b0 + b1 + b2 + white * 0.12) * 0.04;
      }

      const rainSource = ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 720;

      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.14;

      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(this.masterGain);
      rainSource.start();

      // 2. 2D Retro Cinema Lounge Chiptune Sequencer (Magical Nostalgic Cinema & Starlight Theme)
      const leadMelody: Array<number | null> = [
        // Bar 1 (Warm nostalgic cinema music-box motif in F Major / D Minor)
        523.25, null, 659.25, 587.33, 523.25, null, 440.00, 392.00,
        // Bar 2
        349.23, null, 392.00, null, 440.00, 523.25, 587.33, null,
        // Bar 3 (Ghibli / Starlight climb)
        698.46, null, 659.25, null, 587.33, null, 523.25, 440.00,
        // Bar 4
        523.25, null, 440.00, 392.00, 349.23, null, 293.66, null,
        // Bar 5 (Romantic cinema arpeggio)
        349.23, 440.00, 523.25, 659.25, 587.33, 523.25, 440.00, 523.25,
        // Bar 6
        392.00, 440.00, 523.25, 440.00, 349.23, 392.00, 440.00, null,
        // Bar 7 (Gentle resolution)
        523.25, null, 466.16, null, 440.00, null, 392.00, null,
        // Bar 8
        349.23, null, 329.63, null, 349.23, null, null, null,
      ];

      const arpNotes: number[] = [
        349.23, 440.00, 523.25, 659.25, 349.23, 440.00, 523.25, 440.00,
        293.66, 349.23, 440.00, 523.25, 293.66, 349.23, 440.00, 349.23,
        233.08, 293.66, 349.23, 466.16, 233.08, 293.66, 349.23, 293.66,
        261.63, 329.63, 392.00, 523.25, 261.63, 329.63, 392.00, 329.63,
      ];

      const bassNotes: Array<number | null> = [
        87.31, null, null, null, 87.31, null, null, null,  // F2
        73.42, null, null, null, 73.42, null, null, null,  // D2
        58.27, null, null, null, 58.27, null, null, null,  // Bb1
        65.41, null, null, null, 65.41, null, null, null,  // C2
      ];

      const stepDurationMs = 285; // ~105 BPM 8th-note retro horror groove

      const playStep = () => {
        if (!this.ctx || !this.masterGain || this.isMuted) return;
        const now = this.ctx.currentTime;
        const idx = this.stepIndex;

        // A) 2D Chiptune Lead Voice (Square + Triangle layered with subtle echo)
        const leadFreq = leadMelody[idx % leadMelody.length];
        if (leadFreq) {
          this.playChiptuneNote(leadFreq, now, 0.24, 'square', 0.055);
          // Subtle ghost echo 190ms later
          this.playChiptuneNote(leadFreq, now + 0.19, 0.2, 'triangle', 0.024);
        }

        // B) Eerie 8-bit Counterpoint Arpeggio (Triangle wave)
        const arpFreq = arpNotes[idx % arpNotes.length];
        if (arpFreq) {
          this.playChiptuneNote(arpFreq, now, 0.18, 'triangle', 0.038);
        }

        // C) Deep Retro Horror Bass Pulse (Sawtooth filtered)
        const bassFreq = bassNotes[idx % bassNotes.length];
        if (bassFreq) {
          this.playBassNote(bassFreq, now, 0.9, 0.095);
        }

        this.stepIndex++;
      };

      playStep();
      this.musicTimer = window.setInterval(playStep, stepDurationMs);
    } catch {
      this.isAmbientRunning = false;
    }
  }

  private playChiptuneNote(
    freq: number,
    startTime: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    // Subtle eerie pitch vibrato on sustained notes
    osc.frequency.linearRampToValueAtTime(freq * 0.996, startTime + duration * 0.6);
    osc.frequency.linearRampToValueAtTime(freq, startTime + duration);

    filter.type = 'lowpass';
    filter.frequency.value = type === 'square' ? 1650 : 2200;

    gain.gain.setValueAtTime(0.0005, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0005, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  private playBassNote(
    freq: number,
    startTime: number,
    duration: number,
    volume: number
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, startTime);
    filter.frequency.exponentialRampToValueAtTime(95, startTime + duration);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  // Fantastic Mr. Fox Trademark Whistle + Click-Click Sound!
  public playMrFoxWhistleClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    // 1. Two-note whistle slide
    const whistle = ctx.createOscillator();
    const wGain = ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(1174.66, now); // D6
    whistle.frequency.linearRampToValueAtTime(1479.98, now + 0.14); // F#6
    whistle.frequency.setValueAtTime(987.77, now + 0.16); // B5
    whistle.frequency.linearRampToValueAtTime(1174.66, now + 0.34);

    wGain.gain.setValueAtTime(0.001, now);
    wGain.gain.linearRampToValueAtTime(0.14, now + 0.03);
    wGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    whistle.connect(wGain);
    wGain.connect(this.masterGain);
    whistle.start(now);
    whistle.stop(now + 0.38);

    // 2. Two crisp tongue clicks (*click-click*)
    [0.44, 0.56].forEach((offset) => {
      const clickOsc = ctx.createOscillator();
      const cGain = ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1800, now + offset);
      clickOsc.frequency.exponentialRampToValueAtTime(420, now + offset + 0.03);
      cGain.gain.setValueAtTime(0.22, now + offset);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.035);
      clickOsc.connect(cGain);
      cGain.connect(this.masterGain!);
      clickOsc.start(now + offset);
      clickOsc.stop(now + offset + 0.04);
    });
  }

  // Minion 8-bit "Bello / Banana!" synth voice
  public playMinionSound(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 587.33, 783.99];
    notes.forEach((f, i) => {
      this.playChiptuneNote(f, now + i * 0.09, 0.08, 'square', 0.11);
    });
  }

  // Megamind Electric Rock Power Chord ("PRESENTATION!")
  public playMegamindSynth(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    const riff = [329.63, 392.0, 440.0, 493.88, 659.25];
    riff.forEach((f, i) => {
      this.playChiptuneNote(f, now + i * 0.085, 0.16, 'sawtooth', 0.1);
      this.playChiptuneNote(f * 0.5, now + i * 0.085, 0.18, 'square', 0.07);
    });
  }

  // Everything Everywhere All at Once — Peaceful Desert Rocks Chord
  public playEeaaoRocksChime(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    // Soft ambient warm chord
    [261.63, 329.63, 392.0, 493.88].forEach((f, i) => {
      this.playChiptuneNote(f, now + i * 0.06, 0.85, 'sine', 0.07);
    });
  }

  // The Wild Robot (Roz & Brightbill) — Gentle Robotic Chirp + Nature Harmony
  public playWildRobotChime(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    const notes = [587.33, 880.0, 783.99, 1046.5, 1174.66];
    notes.forEach((f, i) => {
      this.playChiptuneNote(f, now + i * 0.08, 0.22, 'triangle', 0.1);
    });
  }

  // My Neighbor Totoro — Joyful Ghibli Pentatonic Flute Arpeggio
  public playTotoroMelody(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    const notes = [523.25, 587.33, 659.25, 783.99, 1046.5, 783.99];
    notes.forEach((f, i) => {
      this.playChiptuneNote(f, now + i * 0.1, 0.22, 'triangle', 0.11);
    });
  }

  // Teen Beach Movie — Upbeat 60s Surf Guitar Lick
  public playTeenBeachSurf(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    const surfNotes = [392.0, 493.88, 587.33, 659.25, 587.33, 783.99];
    surfNotes.forEach((f, i) => {
      this.playChiptuneNote(f, now + i * 0.08, 0.14, 'square', 0.09);
    });
  }

  // Pitch Perfect — Cup Song Rhythm + Barden Bellas Harmony
  public playPitchPerfectCupSong(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    // Clap-clap, tap-tap-tap, clap, harmony!
    const rhythmOffsets = [0, 0.14, 0.3, 0.39, 0.48, 0.64];
    rhythmOffsets.forEach((t, idx) => {
      const freq = idx < 2 || idx === 5 ? 920 : 540;
      this.playChiptuneNote(freq, now + t, 0.045, 'triangle', 0.13);
    });
    // Vocal A Capella Major Chord at the end
    [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
      this.playChiptuneNote(f, now + 0.78, 0.55, 'triangle', 0.08);
    });
  }

  // Cozy & Sweet Cinema Screening Sequence Soundscape (for Non-Horror Movies!)
  public playCinemaSequence(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;
    const now = ctx.currentTime;
    // Warm projector hum & gentle ascending cinema fanfare
    const melody = [
      261.63, 329.63, 392.0, 523.25,
      349.23, 440.0, 523.25, 698.46,
      392.0, 493.88, 587.33, 783.99,
      523.25, 659.25, 783.99, 1046.5,
    ];
    melody.forEach((f, i) => {
      this.playChiptuneNote(f, now + i * 0.22, 0.45, 'triangle', 0.085);
    });
  }

  // Single lub-dub heartbeat sound
  public playHeartbeat(intensity: number = 0.5): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const pulses = [0, 0.22];
    pulses.forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startFreq = idx === 0 ? 62 : 52;
      osc.frequency.setValueAtTime(startFreq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(24, now + offset + 0.16);

      const peak = (idx === 0 ? 0.45 : 0.3) * intensity;
      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(peak, now + offset + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  }

  // Short VHS / CRT static burst
  public playVhsStatic(duration: number = 0.18, volume: number = 0.15): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // Creaking wooden mansion door
  public playDoorCreak(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(92, now + 0.45);
    osc.frequency.linearRampToValueAtTime(118, now + 0.9);
    osc.frequency.linearRampToValueAtTime(75, now + 1.4);

    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 4.5;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.5);
  }

  // Distant thunder rumble
  public playThunder(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const duration = 2.4;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.42, ctx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // Old vintage rotary phone ring
  public playPhoneRing(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 10; i++) {
      const t = now + i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = i % 2 === 0 ? 880 : 1120;
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.065);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  // Chime for discoveries
  public playRomanticChime(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;
    const notes = [587.33, 698.46, 880.0, 1174.66];
    notes.forEach((freq, idx) => {
      this.playChiptuneNote(freq, now + idx * 0.12, 0.45, 'triangle', 0.1);
    });
  }

  // Footstep on hardwood / carpet
  public playFootstep(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const duration = 0.05;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 620 + Math.random() * 180;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // The 8-Step Terrifying Movie Confirmation Ritual Soundscape
  public playRitualSequence(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.isMuted) return;

    const now = ctx.currentTime;

    const riserOsc = ctx.createOscillator();
    const riserOsc2 = ctx.createOscillator();
    const riserGain = ctx.createGain();

    riserOsc.type = 'sawtooth';
    riserOsc2.type = 'sine';
    riserOsc.frequency.setValueAtTime(38, now);
    riserOsc.frequency.exponentialRampToValueAtTime(165, now + 5.9);
    riserOsc2.frequency.setValueAtTime(41, now);
    riserOsc2.frequency.exponentialRampToValueAtTime(98, now + 5.9);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(90, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 5.9);

    riserGain.gain.setValueAtTime(0.01, now);
    riserGain.gain.linearRampToValueAtTime(0.38, now + 5.7);
    riserGain.gain.setValueAtTime(0.0001, now + 6.5);

    riserOsc.connect(filter);
    riserOsc2.connect(filter);
    filter.connect(riserGain);
    riserGain.connect(this.masterGain);

    riserOsc.start(now);
    riserOsc2.start(now);
    riserOsc.stop(now + 6.6);
    riserOsc2.stop(now + 6.6);

    const beatTimes = [0.3, 1.1, 1.8, 2.4, 2.9, 3.35, 3.75, 4.1, 4.4, 4.7, 4.95, 5.2, 5.45, 5.7];
    beatTimes.forEach((t) => {
      setTimeout(() => {
        this.playHeartbeat(0.85);
      }, t * 1000);
    });

    setTimeout(() => this.playVhsStatic(0.45, 0.25), 2800);
    setTimeout(() => {
      this.playVhsStatic(0.55, 0.38);
      this.playThunder();
    }, 5600);

    setTimeout(() => {
      if (!this.ctx || !this.masterGain || this.isMuted) return;
      const tBell = this.ctx.currentTime;
      const bellFreqs = [146.83, 220.0, 293.66, 349.23, 587.33];
      bellFreqs.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, tBell);
        g.gain.setValueAtTime(0.001, tBell);
        g.gain.linearRampToValueAtTime(0.16 / (i + 1), tBell + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0005, tBell + 3.8);
        osc.connect(g);
        g.connect(this.masterGain!);
        osc.start(tBell);
        osc.stop(tBell + 3.9);
      });
    }, 7300);
  }

  public stopAll(): void {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new HorrorSoundEngine();
