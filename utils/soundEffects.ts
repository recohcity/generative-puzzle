// Sound effect utility functions
// Provides consistent audio feedback for user interactions

// Helper function to safely create AudioContext
const createAudioContext = (): AudioContext | null => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.warn("Audio context not supported in this browser");
    return null;
  }
};

// Play a click sound for buttons
export const playButtonClickSound = (): void => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  // Create oscillator and gain node
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Configure sound
  oscillator.type = "sine";
  oscillator.frequency.value = 800;
  
  // Quick volume envelope
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Play sound
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
};

// Play sound when picking up/selecting a puzzle piece
export const playPieceSelectSound = (): void => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  // Create oscillator and gain node
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Configure sound - higher pitch than button click
  oscillator.type = "sine";
  oscillator.frequency.value = 1200;
  
  // Quick volume envelope
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Play sound
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.15);
};

// Play a sound when a piece snaps into place correctly
export const playPieceSnapSound = (): void => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  // Create oscillator and gain node
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Configure sound
  oscillator.type = "sine";
  oscillator.frequency.value = 440;
  oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1);
  
  // Quick volume envelope
  gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Play sound
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.2);
};

// Play sound when puzzle is completed
export const playPuzzleCompletedSound = (): void => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  // Play ascending notes for completion
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = freq;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime + i * 0.1);
    oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
  });
};

// Play sound when rotating a piece
export const playRotateSound = (): void => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  // Create oscillator and gain node
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  // Configure sound
  oscillator.type = "sine";
  oscillator.frequency.value = 300;
  oscillator.frequency.exponentialRampToValueAtTime(350, audioContext.currentTime + 0.1);
  
  // Quick volume envelope
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Play sound
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
};