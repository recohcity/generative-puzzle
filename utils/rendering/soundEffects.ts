// Sound effect utility functions
// Provides consistent audio feedback for user interactions

// Helper function to safely create AudioContext
const createAudioContext = (): AudioContext | null => {
  try {
    // 使用单例模式，确保整个应用只使用一个AudioContext实例
    if (!(window as any).__audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      (window as any).__audioContext = new AudioContextClass();
      
      // 在移动设备上，AudioContext可能在一开始是"suspended"状态，需要用户交互才能恢复
      const resumeAudioContext = () => {
        if ((window as any).__audioContext && (window as any).__audioContext.state === 'suspended') {
          (window as any).__audioContext.resume().catch(e => console.error('恢复AudioContext失败:', e));
        }
        
        // 移除事件监听器，因为我们只需要恢复一次
        ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
          document.removeEventListener(event, resumeAudioContext);
        });
      };
      
      // 添加用户交互事件监听器，用于恢复AudioContext
      ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
        document.addEventListener(event, resumeAudioContext, { once: true });
      });
    }
    
    return (window as any).__audioContext;
  } catch (e) {
    console.warn("Audio context not supported in this browser");
    return null;
  }
};

// 背景音乐控制
let backgroundAudio: HTMLAudioElement | null = null;
let isBackgroundAudioPlaying = false;

// 提取设备检测和音量设置为单独函数
const getDeviceAppropriateVolume = (): number => {
  // 检测设备类型，为不同设备返回适当音量
  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOSDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isIOSDevice) {
    return 0.07; // iOS设备音量设置为7%（非常低）
  } else if (isMobileDevice) {
    return 0.1; // 其他移动设备设置为10%
  } else {
    return 0.15; // 桌面设备设置为15%
  }
};

// 初始化并播放背景音乐
export const initBackgroundMusic = (): void => {
  if (typeof window === 'undefined') return; // 确保在浏览器环境中运行
  
  if (!backgroundAudio) {
    backgroundAudio = new Audio('/puzzle-pieces.mp3');
    backgroundAudio.loop = true;
    
    // 使用设备适配的音量设置
    backgroundAudio.volume = getDeviceAppropriateVolume();
    
    // 添加音频加载错误处理
    backgroundAudio.onerror = (e) => {
      console.error('背景音乐加载失败:', e);
      backgroundAudio = null;
    };
  }
  
  // 默认自动播放
  playBackgroundMusic();
};

// 播放背景音乐
export const playBackgroundMusic = (): void => {
  if (!backgroundAudio) {
    initBackgroundMusic();
    return;
  }
  
  // 处理自动播放策略
  const playPromise = backgroundAudio.play();
  
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        isBackgroundAudioPlaying = true;
      })
      .catch(error => {
        // 自动播放被阻止，通常需要用户交互
        console.warn('背景音乐自动播放被阻止，需要用户交互:', error);
      });
  }
};

// 暂停背景音乐
export const pauseBackgroundMusic = (): void => {
  if (backgroundAudio && !backgroundAudio.paused) {
    backgroundAudio.pause();
    isBackgroundAudioPlaying = false;
  }
};

// 切换背景音乐状态
export const toggleBackgroundMusic = (): boolean => {
  if (!backgroundAudio) {
    initBackgroundMusic();
    return true;
  }
  
  if (backgroundAudio.paused) {
    // 重新应用设备适配的音量设置
    backgroundAudio.volume = getDeviceAppropriateVolume();
    
    playBackgroundMusic();
    isBackgroundAudioPlaying = true;
    return true;
  } else {
    pauseBackgroundMusic();
    isBackgroundAudioPlaying = false;
    return false;
  }
};

// 获取背景音乐状态
export const getBackgroundMusicStatus = (): boolean => {
  return isBackgroundAudioPlaying;
};

// 确保AudioContext已经启动，用于解决iOS上的问题
const ensureAudioContextRunning = (audioContext: AudioContext): Promise<AudioContext> => {
  return new Promise((resolve) => {
    if (audioContext.state === 'running') {
      resolve(audioContext);
    } else {
      // 在iOS上，我们需要先尝试恢复AudioContext
      audioContext.resume().then(() => {
        resolve(audioContext);
      }).catch(() => {
        // 即使失败也返回AudioContext，我们会尝试播放
        resolve(audioContext);
      });
    }
  });
};

// Play a click sound for buttons
export const playButtonClickSound = async (): Promise<void> => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    // 确保AudioContext正在运行
    await ensureAudioContextRunning(audioContext);
    
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
  } catch (e) {
    console.error('播放按钮点击音效失败:', e);
  }
};

// Play sound when picking up/selecting a puzzle piece
export const playPieceSelectSound = async (): Promise<void> => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    // 确保AudioContext正在运行
    await ensureAudioContextRunning(audioContext);
    
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
  } catch (e) {
    console.error('播放拼图选择音效失败:', e);
  }
};

// Play a sound when a piece snaps into place correctly
export const playPieceSnapSound = async (): Promise<void> => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    // 确保AudioContext正在运行
    await ensureAudioContextRunning(audioContext);
    
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
  } catch (e) {
    console.error('播放拼图吸附音效失败:', e);
  }
};

// Play sound when puzzle is completed
export const playPuzzleCompletedSound = async (): Promise<void> => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    // 确保AudioContext正在运行
    await ensureAudioContextRunning(audioContext);
    
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
  } catch (e) {
    console.error('播放拼图完成音效失败:', e);
  }
};

// Play sound when rotating a piece
export const playRotateSound = async (): Promise<void> => {
  const audioContext = createAudioContext();
  if (!audioContext) return;

  try {
    // 确保AudioContext正在运行
    await ensureAudioContextRunning(audioContext);
    
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
  } catch (e) {
    console.error('播放旋转音效失败:', e);
  }
};