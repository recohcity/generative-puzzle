// Sound effect utility functions
// Provides consistent audio feedback for user interactions

let audioContext: AudioContext | null = null;
let backgroundMusic: HTMLAudioElement | null = null;
let isBackgroundMusicPlaying: boolean = true;
let audioUnlocked = false;

// Test-specific global flag/listener for Playwright
// This function will be exposed to Playwright's Node.js context.
// When called from the browser, it notifies the test.
export const soundPlayedForTest = (soundName: string) => {
  if (typeof window !== 'undefined' && (window as any).__SOUND_PLAY_LISTENER__) {
    (window as any).__SOUND_PLAY_LISTENER__({ soundName });
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
    
    // 默认开启背景音乐，但需要用户交互后才能播放
    // 设置为准备播放状态
    isBackgroundMusicPlaying = true;
    
    // 添加全局点击监听器，在第一次用户交互时自动启动背景音乐
    const handleFirstInteraction = async (event?: Event) => {
      // 确保这是真正的用户交互，而不是程序触发的事件
      const isTrustedEvent = !event || event.isTrusted !== false;
      if (isTrustedEvent && isBackgroundMusicPlaying && backgroundMusic && backgroundMusic.paused && !audioUnlocked) {
        try {
          await backgroundMusic.play();
          audioUnlocked = true;
          console.log('Background music auto-started on first interaction');
          // 成功启动后移除所有监听器
          removeFirstInteractionListeners();
        } catch (error) {
          console.log('Auto-start failed, waiting for manual activation:', error);
        }
      }
    };
    
    // 移除监听器的辅助函数
    const removeFirstInteractionListeners = () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
    
    // 监听多种用户交互事件
    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
  }
};

// Toggle background music playback
export const toggleBackgroundMusic = async (): Promise<boolean> => {
  if (backgroundMusic) {
    const audioContext = createAudioContext();
    if (audioContext && audioContext.state === 'suspended') {
      await audioContext.resume();
      audioUnlocked = true;
    }
    
    // 如果是第一次交互且音乐应该播放，自动开始播放
    if (isBackgroundMusicPlaying && backgroundMusic.paused && !audioUnlocked) {
      try {
        await backgroundMusic.play();
        audioUnlocked = true;
        return true;
      } catch (error) {
        console.error('Error starting background music:', error);
        isBackgroundMusicPlaying = false;
        return false;
      }
    }
    
    if (isBackgroundMusicPlaying) {
      backgroundMusic.pause();
      isBackgroundMusicPlaying = false;
    } else {
      try {
        await backgroundMusic.play();
        isBackgroundMusicPlaying = true;
        audioUnlocked = true;
      } catch (error) {
        console.error('Error resuming background music:', error);
      }
    }
  }
  return isBackgroundMusicPlaying;
};

// Get background music status
export const getBackgroundMusicStatus = (): boolean => {
  return isBackgroundMusicPlaying;
};

// Auto-start background music on first user interaction
export const autoStartBackgroundMusic = async (): Promise<void> => {
  if (backgroundMusic && isBackgroundMusicPlaying && backgroundMusic.paused) {
    try {
      const audioContext = createAudioContext();
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      await backgroundMusic.play();
      audioUnlocked = true;
      console.log('Background music auto-started via button interaction');
    } catch (error) {
      console.error('Error auto-starting background music:', error);
      // 如果自动播放失败，保持状态为true，等待用户手动开启
    }
  }
};

// Play a click sound for buttons
export const playButtonClickSound = async (): Promise<void> => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    // 确保AudioContext正在运行
    await ensureAudioContextRunning(audioContext);
    
    // 尝试自动启动背景音乐（如果应该播放的话）
    await autoStartBackgroundMusic();

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

    // 旋转音效：使用triangle波形创造更柔和的旋转感
    oscillator.type = 'triangle';
    // 使用中等频率，营造旋转的感觉
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    // 轻微的频率上升，模拟旋转动作
    oscillator.frequency.linearRampToValueAtTime(450, audioContext.currentTime + 0.08);

    // 适中的音量和较短的持续时间，适合快速旋转操作
    gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.12);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.12);
  } catch (error) {
    console.error('Error playing rotate sound:', error);
  }
};

// Play sound when cutting/generating puzzle pieces
export const playCutSound = async (): Promise<void> => {
  soundPlayedForTest('cut');
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    await ensureAudioContextRunning(audioContext);

    // 清晰简单的切割音效：模拟刀片切割的"咔嚓"声
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // 使用锯齿波产生更锐利的切割声
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, audioContext.currentTime); // 中频开始
    oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.01); // 快速上升
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.08); // 快速下降

    // 音量包络：瞬间攻击，快速衰减，模拟切割的瞬间性
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.002); // 瞬间音量
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08); // 快速衰减

    // 连接音频节点
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 播放音效
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.08);

  } catch (error) {
    console.error('Error playing cut sound:', error);
  }
};