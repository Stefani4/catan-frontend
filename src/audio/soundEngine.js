import { loadSettings } from "../settingsStore.js";

let ctx = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let ambientGain = null;

let musicTimer = null;
let ambientTimer = null;
let musicRunning = false;
let ambientRunning = false;

function pct(v) {
    return Math.max(0, Math.min(100, Number(v) || 0)) / 100;
}

function ensureContext() {
    if (ctx) return ctx;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    ctx = new AudioContextClass();
    masterGain = ctx.createGain();
    sfxGain = ctx.createGain();
    musicGain = ctx.createGain();
    ambientGain = ctx.createGain();

    sfxGain.connect(masterGain);
    musicGain.connect(masterGain);
    ambientGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    const s = loadSettings();
    masterGain.gain.value = s.muted ? 0 : pct(s.masterVolume);
    sfxGain.gain.value = pct(s.soundEffects);
    musicGain.gain.value = pct(s.musicVolume);
    ambientGain.gain.value = pct(s.ambientVolume);

    return ctx;
}

export function initAudio() {
    const c = ensureContext();
    if (c && c.state === "suspended") {
        c.resume().catch(() => {});
    }
    return c;
}

export function updateAudioSettings(settings) {
    if (!ctx) return;
    const muted = Boolean(settings.muted);
    const now = ctx.currentTime;
    masterGain.gain.setTargetAtTime(muted ? 0 : pct(settings.masterVolume), now, 0.05);
    sfxGain.gain.setTargetAtTime(pct(settings.soundEffects), now, 0.05);
    musicGain.gain.setTargetAtTime(pct(settings.musicVolume), now, 0.05);
    ambientGain.gain.setTargetAtTime(pct(settings.ambientVolume), now, 0.05);
}

function tone(dest, { freq, type = "sine", start = 0, duration = 0.18, gain = 0.5, glideTo }) {
    const c = ensureContext();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    if (glideTo) {
        osc.frequency.exponentialRampToValueAtTime(glideTo, c.currentTime + start + duration);
    }
    g.gain.setValueAtTime(0, c.currentTime + start);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
    osc.connect(g);
    g.connect(dest);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + duration + 0.02);
}

function pluck(dest, { freq, start = 0, duration = 0.35, gain = 0.3 }) {
    const c = ensureContext();
    if (!c) return;
    tone(dest, { freq, type: "triangle", start, duration, gain });
    tone(dest, { freq: freq * 2, type: "sine", start, duration: duration * 0.6, gain: gain * 0.25 });
}

function noiseBurst(dest, { start = 0, duration = 0.08, gain = 0.4, filterFreq = 2500 }) {
    const c = ensureContext();
    if (!c) return;
    const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = c.createBufferSource();
    src.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(c.currentTime + start);
    src.stop(c.currentTime + start + duration + 0.02);
}

const SFX = {
    diceRoll() {
        const ticks = 5;
        for (let i = 0; i < ticks; i++) {
            noiseBurst(sfxGain, {
                start: i * 0.07,
                duration: 0.05,
                gain: 0.5 * (1 - i / (ticks + 1)),
                filterFreq: 1800 + Math.random() * 1200,
            });
        }
    },
    build() {
        tone(sfxGain, { freq: 320, glideTo: 130, type: "triangle", duration: 0.16, gain: 0.55 });
    },
    buyCard() {
        noiseBurst(sfxGain, { duration: 0.09, gain: 0.35, filterFreq: 4200 });
        tone(sfxGain, { freq: 900, type: "square", start: 0.05, duration: 0.06, gain: 0.15 });
    },
    trade() {
        tone(sfxGain, { freq: 523.25, type: "sine", duration: 0.14, gain: 0.4 });
        tone(sfxGain, { freq: 659.25, type: "sine", start: 0.09, duration: 0.18, gain: 0.4 });
    },
    robber() {
        tone(sfxGain, { freq: 110, glideTo: 60, type: "sawtooth", duration: 0.35, gain: 0.4 });
    },
    victory() {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            tone(sfxGain, { freq, type: "triangle", start: i * 0.14, duration: 0.3, gain: 0.45 });
        });
    },
    reaction() {
        tone(sfxGain, { freq: 880, glideTo: 1200, type: "sine", duration: 0.09, gain: 0.3 });
    },
    // A tiny, neutral click used to preview a volume slider while dragging it.
    click() {
        tone(sfxGain, { freq: 700, type: "square", duration: 0.05, gain: 0.18 });
    },
};

export function playSfx(name) {
    const c = ensureContext();
    if (!c || !SFX[name]) return;
    if (c.state === "suspended") c.resume().catch(() => {});
    SFX[name]();
}

const BEAT = 0.32;
const MELODY = [
    // Bar 1: C major
    261.63, 329.63, 392.0, 329.63,
    // Bar 2: F major
    349.23, 440.0, 523.25, 440.0,
    // Bar 3: G major
    392.0, 493.88, 587.33, 493.88,
    // Bar 4: C major (resolve)
    261.63, 329.63, 392.0, 523.25,
];
const BASS = [130.81, 130.81, 174.61, 174.61, 196.0, 196.0, 130.81, 130.81]; // C3 F3 G3 C3, two beats each

function scheduleMusicLoop() {
    const c = ensureContext();
    if (!c || !musicRunning) return;

    const loopStart = c.currentTime + 0.05;

    MELODY.forEach((freq, i) => {
        pluck(musicGain, { freq, start: loopStart - c.currentTime + i * BEAT, duration: BEAT * 0.9, gain: 0.22 });
    });

    BASS.forEach((freq, i) => {
        tone(musicGain, {
            freq,
            type: "sine",
            start: loopStart - c.currentTime + i * BEAT * 2,
            duration: BEAT * 1.9,
            gain: 0.12,
        });
    });

    const loopDurationMs = MELODY.length * BEAT * 1000;
    musicTimer = setTimeout(scheduleMusicLoop, loopDurationMs);
}

export function startMusic() {
    const c = ensureContext();
    if (!c || musicRunning) return;
    if (c.state === "suspended") c.resume().catch(() => {});
    musicRunning = true;
    scheduleMusicLoop();
}

export function stopMusic() {
    musicRunning = false;
    clearTimeout(musicTimer);
    musicTimer = null;
}

const CHIME_NOTES = [523.25, 659.25, 783.99, 1046.5, 880.0];

function scheduleAmbientChime() {
    if (!ambientRunning) return;
    const c = ensureContext();
    if (c) {
        const freq = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
        tone(ambientGain, { freq, type: "sine", duration: 1.4, gain: 0.12 });
        tone(ambientGain, { freq: freq * 2, type: "sine", duration: 0.9, gain: 0.04 });
    }
    const nextIn = 2800 + Math.random() * 3200;
    ambientTimer = setTimeout(scheduleAmbientChime, nextIn);
}

export function startAmbient() {
    const c = ensureContext();
    if (!c || ambientRunning) return;
    if (c.state === "suspended") c.resume().catch(() => {});
    ambientRunning = true;
    ambientTimer = setTimeout(scheduleAmbientChime, 1500);
}

export function stopAmbient() {
    ambientRunning = false;
    clearTimeout(ambientTimer);
    ambientTimer = null;
}