// Sound effect utility functions
// Provides consistent audio feedback for user interactions

let audioContext: AudioContext | null = null;
let backgroundMusic: HTMLAudioElement | null = null;
let isBackgroundMusicPlaying: boolean = false;
let audioUnlocked = false;
      
// Test-specific global flag/listener for Playwright
// This function will be exposed to Playwright's Node.js context.
// When called from the browser, it notifies the test.
export const soundPlayedForTest = (soundName: string) => {
  if (typeof window !== 'undefined' && window.__SOUND_PLAY_LISTENER__) {
    window.__SOUND_PLAY_LISTENER__({ soundName });
  }
};

const createAudioContext = (): AudioContext | null => {
  if (audioContext === null) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.error('Web Audio API is not supported in this browser:', e);
      return null;
    }
  }
  return audioContext;
};
    
// Function to ensure AudioContext is running
const ensureAudioContextRunning = async (context: AudioContext): Promise<void> => {
  if (context.state === 'suspended') {
    await context.resume();
  }
  audioUnlocked = true;
    };
  
// Initialize background music
export const initBackgroundMusic = () => {
  if (backgroundMusic === null) {
    backgroundMusic = new Audio('/puzzle-pieces.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    if (typeof window !== 'undefined') {
      window.addEventListener('click', () => {
        if (!audioUnlocked && backgroundMusic) {
          backgroundMusic.play().then(() => {
            isBackgroundMusicPlaying = true;
            audioUnlocked = true;
          }).catch(error => console.error('Error playing background music:', error));
        }
      }, { once: true });
    }
  }
};

// Toggle background music playback
export const toggleBackgroundMusic = (): boolean => {
  if (backgroundMusic) {
    if (isBackgroundMusicPlaying) {
      backgroundMusic.pause();
      isBackgroundMusicPlaying = false;
    } else {
      backgroundMusic.play().then(() => {
        isBackgroundMusicPlaying = true;
      }).catch(error => console.error('Error resuming background music:', error));
    }
  }
  return isBackgroundMusicPlaying;
};

// Get background music status
export const getBackgroundMusicStatus = (): boolean => {
  return isBackgroundMusicPlaying;
};

// Play a click sound for buttons
export const playButtonClickSound = async (): Promise<void> => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    // 确保AudioContext正在运行
    await ensureAudioContextRunning(audioContext);
    
    // Create oscillator and gain node
    soundPlayedForTest('buttonClick');
    
    // Create oscillator and gain node
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Configure oscillator (simple click sound)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4 note
    oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 0.1); // Quickly decay
    
    // Configure gain node (volume envelope)
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Start at 50% volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); // Decay to almost zero

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Start and stop oscillator
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.error('Error playing button click sound:', error);
  }
};

// Play sound when a piece is selected
export const playPieceSelectSound = async (): Promise<void> => {
  soundPlayedForTest('pieceSelect');
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    await ensureAudioContextRunning(audioContext);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.error('Error playing piece select sound:', error);
  }
};

// Play sound when a piece snaps into place
export const playPieceSnapSound = async (): Promise<void> => {
  soundPlayedForTest('pieceSnap');
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    await ensureAudioContextRunning(audioContext);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Error playing piece snap sound:', error);
  }
};

// Play sound when a puzzle is completed
export const playPuzzleCompletedSound = async (): Promise<void> => {
  soundPlayedForTest('puzzleCompleted');
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    await ensureAudioContextRunning(audioContext);
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

    // First note
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    // Second note
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.6);

    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.6);
    oscillator2.start(audioContext.currentTime + 0.15);
    oscillator2.stop(audioContext.currentTime + 0.75);
  } catch (error) {
    console.error('Error playing puzzle completed sound:', error);
  }
};

// Play sound when rotating a piece
export const playRotateSound = async (): Promise<void> => {
  soundPlayedForTest('rotate');
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    await ensureAudioContextRunning(audioContext);
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);
  } catch (error) {
    console.error('Error playing rotate sound:', error);
  }
};