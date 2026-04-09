// Utility to generate subtle UI sounds using Web Audio API
// This avoids the need for external assets and ensures instant playback

let audioContext: AudioContext | null = null;

const getContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

const createOscillator = (
  freq: number, 
  type: OscillatorType, 
  startTime: number, 
  duration: number, 
  vol: number = 0.05
) => {
  const ctx = getContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Envelope for smooth click-free sound
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

// Generic short interaction click
export const playClick = () => {
  const ctx = getContext();
  createOscillator(1000, 'sine', ctx.currentTime, 0.08, 0.03);
};

// Ascending tone for "ON" state
export const playToggleOn = () => {
  const ctx = getContext();
  const now = ctx.currentTime;
  createOscillator(600, 'sine', now, 0.15, 0.05);
  createOscillator(800, 'sine', now + 0.1, 0.2, 0.05);
};

// Descending tone for "OFF" state
export const playToggleOff = () => {
  const ctx = getContext();
  const now = ctx.currentTime;
  createOscillator(800, 'sine', now, 0.15, 0.05);
  createOscillator(600, 'sine', now + 0.1, 0.2, 0.05);
};

// Pleasant chord/arpeggio for successful send
export const playSend = () => {
  const ctx = getContext();
  const now = ctx.currentTime;
  // C Majorish arpeggio
  createOscillator(523.25, 'sine', now, 0.1, 0.04); // C5
  createOscillator(659.25, 'sine', now + 0.05, 0.1, 0.04); // E5
  createOscillator(783.99, 'sine', now + 0.1, 0.3, 0.04); // G5
};

// Optional: Subtle error/disabled sound
export const playError = () => {
    const ctx = getContext();
    createOscillator(150, 'triangle', ctx.currentTime, 0.2, 0.05);
};
