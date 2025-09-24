// Sound effect utility functions
// Provides consistent audio feedback for user interactions

let audioContext: AudioContext | null = null;
let backgroundMusic: HTMLAudioElement | null = null;
let isBackgroundMusicPlaying: boolean = true;
let audioUnlocked = false;
let finishAudio: HTMLAudioElement | null = null;
let cutAudioElement: HTMLAudioElement | null = null;
let scatterAudioElement: HTMLAudioElement | null = null;

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
    backgroundMusic = new Audio('/bgm.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;
    
    // 添加循环播放的额外保障
    backgroundMusic.addEventListener('ended', () => {
      // 这个事件在loop=true时通常不会触发，但作为备用保障
      console.warn('Background music ended unexpectedly, restarting...');
      if (isBackgroundMusicPlaying && backgroundMusic) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(console.error);
      }
    });

    // 默认开启背景音乐，但需要用户交互后才能播放
    // 设置为准备播放状态
    isBackgroundMusicPlaying = true;

    // 添加全局点击监听器，在第一次用户交互时自动启动背景音乐
    const handleFirstInteraction = async (event?: Event) => {
      // 确保这是真正的用户交互，而不是程序触发的事件
      const isTrustedEvent = !event || event.isTrusted !== false;
      if (!isTrustedEvent) return;

      try {
        // 1) 恢复/创建音频上下文
        const ctx = createAudioContext();
        if (ctx && ctx.state === 'suspended') {
          await ctx.resume();
        }

        // 2) 预加载所有真实音效并进行一次静音prime，确保后续可立即播放
        preloadAllSoundEffects();

        const prime = async (el: HTMLAudioElement | null) => {
          if (!el) return;
          const originalVolume = el.volume;
          el.volume = 0; // 静音prime
          el.currentTime = 0;
          try {
            await el.play();
          } catch (_) {
            // 忽略prime失败
          } finally {
            // 立即暂停并恢复音量
            try { el.pause(); } catch { /* noop */ }
            el.currentTime = 0;
            el.volume = originalVolume;
          }
        };

        await Promise.all([
          prime(cutAudioElement),
          prime(scatterAudioElement),
          prime(finishAudio),
        ]);

        // 3) 若设置为应播放背景音乐，则尝试启动
        if (isBackgroundMusicPlaying && backgroundMusic && backgroundMusic.paused) {
          try {
            await backgroundMusic.play();
          } catch (err) {
            console.log('Background music start failed on first interaction:', err);
          }
        }

        audioUnlocked = true;
        console.log('Audio system unlocked and primed on first interaction');
        removeFirstInteractionListeners();
      } catch (error) {
        console.log('First interaction audio unlock failed:', error);
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

// 预加载并缓存所有真实音效文件，避免首次触发时的加载卡顿
export const preloadAllSoundEffects = (): void => {
  try {
    // 背景音乐 - 仅预加载，不自动播放
    if (!backgroundMusic) {
      backgroundMusic = new Audio('/bgm.mp3');
      backgroundMusic.loop = true;
      backgroundMusic.volume = 0.5;
      backgroundMusic.preload = 'auto';
      // @ts-ignore
      backgroundMusic.playsInline = true;
      backgroundMusic.load();
    }
    // 切割音效
    if (!cutAudioElement) {
      cutAudioElement = new Audio('/split.mp3');
      cutAudioElement.preload = 'auto';
      // @ts-ignore
      cutAudioElement.playsInline = true;
      cutAudioElement.load();
    }
    // 散开音效
    if (!scatterAudioElement) {
      scatterAudioElement = new Audio('/scatter.mp3');
      scatterAudioElement.preload = 'auto';
      // @ts-ignore
      scatterAudioElement.playsInline = true;
      scatterAudioElement.load();
    }
    // 完成音效
    if (!finishAudio) {
      finishAudio = new Audio('/finish.mp3');
      finishAudio.preload = 'auto';
      // @ts-ignore
      finishAudio.playsInline = true;
      finishAudio.loop = false;
      finishAudio.load();
    }
  } catch (e) {
    // 预加载失败不影响后续按需播放
    console.warn('Sound preloading failed (safe to ignore):', e);
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

  try {
    // 使用预加载的音频元素（若不存在则即时创建）
    if (!cutAudioElement) {
      cutAudioElement = new Audio('/split.mp3');
      cutAudioElement.preload = 'auto';
      // @ts-ignore
      cutAudioElement.playsInline = true;
    }
    cutAudioElement.volume = 1.0;
    cutAudioElement.currentTime = 0;
    await cutAudioElement.play();

  } catch (error) {
    console.error('Error playing cut sound:', error);
  }
};

// Play sound when scattering puzzle pieces
export const playScatterSound = async (): Promise<void> => {
  soundPlayedForTest('scatter');

  try {
    // 使用预加载的音频元素（若不存在则即时创建）
    if (!scatterAudioElement) {
      scatterAudioElement = new Audio('/scatter.mp3');
      scatterAudioElement.preload = 'auto';
      // @ts-ignore
      scatterAudioElement.playsInline = true;
    }
    scatterAudioElement.volume = 1.0;
    scatterAudioElement.currentTime = 0;
    await scatterAudioElement.play();

  } catch (error) {
    console.error('Error playing scatter sound:', error);
  }
};
// 播放拼图完成音效（独立音频文件）
export const playFinishSound = async (): Promise<void> => {
  soundPlayedForTest('finish');

  try {
    // 优先尝试解锁/恢复音频上下文，提升移动端播放成功率
    const ctx = createAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
      audioUnlocked = true;
    }

    // 复用并预设完成音效元素，确保与其他真实音效一致的调用方式
    if (!finishAudio) {
      finishAudio = new Audio('/finish.mp3');
      finishAudio.preload = 'auto';
      // @ts-ignore: playsInline for iOS Safari
      finishAudio.playsInline = true;
      finishAudio.loop = false;
    }

    finishAudio.volume = 0.8; // 适中音量，突出完成感
    finishAudio.currentTime = 0;

    await finishAudio.play();
  } catch (error) {
    console.error('Error playing finish sound:', error);
    // 移动端（尤其是 iOS）在非用户交互上下文中可能阻止播放
    // 作为回退：在下一次真实用户交互时播放一次
    try {
      const oneTimeHandler = async (event?: Event) => {
        const isTrustedEvent = !event || event.isTrusted !== false;
        if (!isTrustedEvent) return;
        document.removeEventListener('click', oneTimeHandler);
        document.removeEventListener('touchstart', oneTimeHandler);
        document.removeEventListener('keydown', oneTimeHandler);
        try {
          const ctx = createAudioContext();
          if (ctx && ctx.state === 'suspended') {
            await ctx.resume();
            audioUnlocked = true;
          }
          if (!finishAudio) {
            finishAudio = new Audio('/finish.mp3');
            finishAudio.preload = 'auto';
            // @ts-ignore
            finishAudio.playsInline = true;
            finishAudio.loop = false;
          }
          finishAudio.volume = 0.8;
          finishAudio.currentTime = 0;
          await finishAudio.play();
        } catch (e) {
          console.error('Deferred finish sound still failed:', e);
        }
      };
      document.addEventListener('click', oneTimeHandler, { once: true });
      document.addEventListener('touchstart', oneTimeHandler, { once: true });
      document.addEventListener('keydown', oneTimeHandler, { once: true });
    } catch (e) {
      // 忽略回退绑定失败
    }
  }
};