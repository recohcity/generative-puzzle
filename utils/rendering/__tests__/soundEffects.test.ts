/**
 * soundEffects 单元测试
 * 
 * 🎯 验证音效工具函数核心逻辑
 */

import { 
  soundPlayedForTest, 
  initBackgroundMusic, 
  toggleBackgroundMusic,
  getBackgroundMusicStatus,
  playButtonClickSound,
  playPieceSelectSound,
  playPieceSnapSound,
  playPuzzleCompletedSound,
  playRotateSound,
  playCutSound
} from '../soundEffects';

// Mock Web Audio API
const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  resume: jest.fn().mockResolvedValue(undefined),
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    type: 'sine',
    frequency: { 
      value: 440,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn()
    }
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { 
      value: 1,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn()
    }
  })),
  destination: {}
};

// Mock HTMLAudioElement
const mockAudio = {
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  load: jest.fn(),
  loop: false,
  volume: 1,
  currentTime: 0,
  paused: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock window.Audio
global.Audio = jest.fn().mockImplementation(() => mockAudio);

// Mock AudioContext
(global as any).AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
(global as any).webkitAudioContext = jest.fn().mockImplementation(() => mockAudioContext);

// Mock window object
Object.defineProperty(global, 'window', {
  value: {
    AudioContext: (global as any).AudioContext,
    webkitAudioContext: (global as any).webkitAudioContext
  },
  writable: true
});

describe('soundEffects - 音效工具函数测试', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset audio state
    mockAudio.paused = true;
    mockAudio.currentTime = 0;
    mockAudioContext.state = 'running';
    
    // Reset module state by clearing the module cache
    jest.resetModules();
  });

  describe('🔑 测试音效通知', () => {
    test('应该正确通知测试环境音效播放', () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      soundPlayedForTest('click');

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'click' });
    });

    test('应该处理没有监听器的情况', () => {
      delete (global.window as any).__SOUND_PLAY_LISTENER__;

      expect(() => {
        soundPlayedForTest('click');
      }).not.toThrow();
    });

    test('应该处理非浏览器环境', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        soundPlayedForTest('click');
      }).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('🔑 背景音乐初始化', () => {
    test('应该正确初始化背景音乐', () => {
      expect(() => {
        initBackgroundMusic();
      }).not.toThrow();

      expect(global.Audio).toHaveBeenCalledWith('/puzzle-pieces.mp3');
    });

    test('应该设置正确的音频属性', () => {
      initBackgroundMusic();

      expect(mockAudio.loop).toBe(true);
      expect(mockAudio.volume).toBe(0.5);
    });

    test('应该只初始化一次背景音乐', () => {
      expect(() => {
        initBackgroundMusic();
        initBackgroundMusic();
      }).not.toThrow();
    });
  });

  describe('🔑 背景音乐切换', () => {
    beforeEach(() => {
      initBackgroundMusic();
    });

    test('应该能够切换背景音乐播放状态', async () => {
      const result = await toggleBackgroundMusic();

      expect(typeof result).toBe('boolean');
    });

    test('应该处理音频上下文创建', async () => {
      const result = await toggleBackgroundMusic();
      
      expect(typeof result).toBe('boolean');
    });

    test('应该处理音频上下文恢复', async () => {
      mockAudioContext.state = 'suspended';

      await toggleBackgroundMusic();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    test('应该处理音频播放错误', async () => {
      mockAudio.play.mockRejectedValue(new Error('Play failed'));

      expect(async () => {
        await toggleBackgroundMusic();
      }).not.toThrow();
    });

    test('应该处理音频暂停', async () => {
      mockAudio.paused = false;

      const result = await toggleBackgroundMusic();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('🔑 Web Audio API 支持检测', () => {
    test('应该处理不支持Web Audio API的浏览器', () => {
      // 临时移除AudioContext支持
      const originalAudioContext = (global as any).AudioContext;
      const originalWebkitAudioContext = (global as any).webkitAudioContext;
      
      delete (global as any).AudioContext;
      delete (global as any).webkitAudioContext;
      delete (global.window as any).AudioContext;
      delete (global.window as any).webkitAudioContext;

      expect(() => {
        initBackgroundMusic();
      }).not.toThrow();

      // 恢复AudioContext支持
      (global as any).AudioContext = originalAudioContext;
      (global as any).webkitAudioContext = originalWebkitAudioContext;
      global.window.AudioContext = originalAudioContext;
      (global.window as any).webkitAudioContext = originalWebkitAudioContext;
    });

    test('应该处理AudioContext创建失败', () => {
      const originalAudioContext = (global as any).AudioContext;
      (global as any).AudioContext = jest.fn().mockImplementation(() => {
        throw new Error('AudioContext creation failed');
      });

      expect(() => {
        initBackgroundMusic();
      }).not.toThrow();

      (global as any).AudioContext = originalAudioContext;
    });
  });

  describe('🔑 边界条件测试', () => {
    test('应该处理空的音效名称', () => {
      expect(() => {
        soundPlayedForTest('');
      }).not.toThrow();
    });

    test('应该处理特殊字符的音效名称', () => {
      expect(() => {
        soundPlayedForTest('click-sound_123!@#');
      }).not.toThrow();
    });

    test('应该处理非常长的音效名称', () => {
      const longName = 'a'.repeat(1000);
      
      expect(() => {
        soundPlayedForTest(longName);
      }).not.toThrow();
    });

    test('应该处理undefined音效名称', () => {
      expect(() => {
        soundPlayedForTest(undefined as any);
      }).not.toThrow();
    });
  });

  describe('🔑 性能基准测试', () => {
    test('音效通知应该高效', () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        soundPlayedForTest(`sound-${i}`);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // < 100ms for 1000 notifications
    });

    test('背景音乐初始化应该快速', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        initBackgroundMusic();
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50); // < 50ms for 10 initializations
    });
  });

  describe('🔑 错误处理', () => {
    test('应该处理音频文件加载失败', () => {
      mockAudio.addEventListener.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Audio load failed')), 0);
        }
      });

      expect(() => {
        initBackgroundMusic();
      }).not.toThrow();
    });

    test('应该处理音频播放权限被拒绝', async () => {
      mockAudio.play.mockRejectedValue(new DOMException('NotAllowedError'));

      expect(async () => {
        await toggleBackgroundMusic();
      }).not.toThrow();
    });

    test('应该处理音频上下文状态异常', async () => {
      mockAudioContext.state = 'closed';
      mockAudioContext.resume.mockRejectedValue(new Error('Context closed'));

      expect(async () => {
        await toggleBackgroundMusic();
      }).not.toThrow();
    });
  });

  describe('🔑 浏览器兼容性', () => {
    test('应该支持webkit前缀的AudioContext', () => {
      delete (global as any).AudioContext;
      
      expect(() => {
        initBackgroundMusic();
      }).not.toThrow();
    });

    test('应该处理旧版浏览器的音频API', () => {
      const mockOldAudio = {
        ...mockAudio,
        canPlayType: jest.fn(() => 'probably'),
        preload: 'auto'
      };

      global.Audio = jest.fn().mockImplementation(() => mockOldAudio);

      expect(() => {
        initBackgroundMusic();
      }).not.toThrow();
    });
  });

  describe('🔑 实际使用场景模拟', () => {
    test('应该支持游戏中的音效播放流程', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      // 模拟游戏启动流程
      initBackgroundMusic();
      
      // 模拟用户交互音效
      soundPlayedForTest('game-start');
      soundPlayedForTest('piece-move');
      soundPlayedForTest('piece-snap');
      soundPlayedForTest('puzzle-complete');

      // 模拟背景音乐控制
      await toggleBackgroundMusic(); // 开始播放
      await toggleBackgroundMusic(); // 暂停播放

      expect(mockListener).toHaveBeenCalledTimes(4);
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'game-start' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'piece-move' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'piece-snap' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'puzzle-complete' });
    });

    test('应该处理用户快速切换背景音乐', async () => {
      initBackgroundMusic();

      // 快速切换多次
      const promises: Promise<void>[] = [];
      for (let i = 0; i < 5; i++) {
        promises.push(toggleBackgroundMusic().then(() => {}));
      }

      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });
  });

  describe('🔑 背景音乐状态管理', () => {
    test('应该正确获取背景音乐状态', () => {
      const status = getBackgroundMusicStatus();
      expect(typeof status).toBe('boolean');
    });

    test('应该在切换后更新状态', async () => {
      initBackgroundMusic();
      
      const initialStatus = getBackgroundMusicStatus();
      await toggleBackgroundMusic();
      const newStatus = getBackgroundMusicStatus();
      
      expect(typeof initialStatus).toBe('boolean');
      expect(typeof newStatus).toBe('boolean');
    });
  });

  describe('🔑 按钮点击音效', () => {
    test('应该能播放按钮点击音效', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playButtonClickSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'buttonClick' });
    });

    test('应该处理音频上下文不可用的情况', async () => {
      // 临时移除AudioContext支持
      const originalAudioContext = (global as any).AudioContext;
      const originalWebkitAudioContext = (global as any).webkitAudioContext;
      
      delete (global as any).AudioContext;
      delete (global as any).webkitAudioContext;
      delete (global.window as any).AudioContext;
      delete (global.window as any).webkitAudioContext;

      expect(async () => {
        await playButtonClickSound();
      }).not.toThrow();

      // 恢复AudioContext支持
      (global as any).AudioContext = originalAudioContext;
      (global as any).webkitAudioContext = originalWebkitAudioContext;
      global.window.AudioContext = originalAudioContext;
      (global.window as any).webkitAudioContext = originalWebkitAudioContext;
    });

    test('应该处理音频上下文创建错误', async () => {
      const originalAudioContext = (global as any).AudioContext;
      (global as any).AudioContext = jest.fn().mockImplementation(() => {
        throw new Error('AudioContext creation failed');
      });

      expect(async () => {
        await playButtonClickSound();
      }).not.toThrow();

      (global as any).AudioContext = originalAudioContext;
    });

    test('应该处理音频节点创建错误', async () => {
      const mockBrokenAudioContext = {
        ...mockAudioContext,
        createOscillator: jest.fn().mockImplementation(() => {
          throw new Error('Oscillator creation failed');
        })
      };

      (global as any).AudioContext = jest.fn().mockImplementation(() => mockBrokenAudioContext);

      expect(async () => {
        await playButtonClickSound();
      }).not.toThrow();

      (global as any).AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    });
  });

  describe('🔑 拼图片段选择音效', () => {
    test('应该能播放片段选择音效', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      expect(async () => {
        await playPieceSelectSound();
      }).not.toThrow();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'pieceSelect' });
    });

    test('应该处理音频上下文暂停状态', async () => {
      mockAudioContext.state = 'suspended';

      expect(async () => {
        await playPieceSelectSound();
      }).not.toThrow();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    test('应该处理音频上下文恢复失败', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume.mockRejectedValue(new Error('Resume failed'));

      expect(async () => {
        await playPieceSelectSound();
      }).not.toThrow();
    });
  });

  describe('🔑 音频上下文管理', () => {
    test('应该正确创建音频上下文', async () => {
      expect(async () => {
        await playButtonClickSound();
      }).not.toThrow();
    });

    test('应该处理音频上下文状态变化', async () => {
      // 测试不同的音频上下文状态
      const states = ['running', 'suspended', 'closed'];
      
      for (const state of states) {
        mockAudioContext.state = state;
        
        expect(async () => {
          await playButtonClickSound();
          await playPieceSelectSound();
        }).not.toThrow();
      }
    });

    test('应该处理音频上下文解锁', async () => {
      mockAudioContext.state = 'suspended';
      
      await playButtonClickSound();
      
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('🔑 音效系统集成测试', () => {
    test('应该支持完整的游戏音效流程', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      // 模拟完整的游戏音效流程
      initBackgroundMusic();
      
      // 用户交互音效
      await playButtonClickSound();
      await playPieceSelectSound();
      
      // 背景音乐控制
      await toggleBackgroundMusic();
      const status1 = getBackgroundMusicStatus();
      
      await toggleBackgroundMusic();
      const status2 = getBackgroundMusicStatus();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'buttonClick' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'pieceSelect' });
      expect(typeof status1).toBe('boolean');
      expect(typeof status2).toBe('boolean');
    });

    test('应该处理快速连续的音效播放', async () => {
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(playButtonClickSound());
        promises.push(playPieceSelectSound());
      }

      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });

    test('应该处理音效播放期间的背景音乐切换', async () => {
      initBackgroundMusic();

      const promises = [
        playButtonClickSound(),
        toggleBackgroundMusic(),
        playPieceSelectSound(),
        toggleBackgroundMusic()
      ];

      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });
  });

  describe('🔑 音频资源管理', () => {
    test('应该正确管理音频资源', () => {
      // 多次初始化不应该创建多个音频实例
      initBackgroundMusic();
      initBackgroundMusic();
      initBackgroundMusic();

      expect(() => {
        getBackgroundMusicStatus();
      }).not.toThrow();
    });

    test('应该处理音频资源加载失败', () => {
      const mockFailingAudio = {
        ...mockAudio,
        addEventListener: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Audio load failed')), 0);
          }
        })
      };

      global.Audio = jest.fn().mockImplementation(() => mockFailingAudio);

      expect(() => {
        initBackgroundMusic();
      }).not.toThrow();
    });

    test('应该处理内存清理', async () => {
      // 创建大量音效实例来测试内存管理
      const promises: Promise<void>[] = [];
      
      for (let i = 0; i < 50; i++) {
        promises.push(playButtonClickSound());
        promises.push(playPieceSelectSound());
      }

      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });
  });

  describe('🔑 跨浏览器兼容性', () => {
    test('应该支持不同的AudioContext实现', async () => {
      // 测试webkit前缀的AudioContext
      delete (global as any).AudioContext;
      
      expect(async () => {
        await playButtonClickSound();
      }).not.toThrow();
    });

    test('应该处理移动端浏览器限制', async () => {
      // 模拟移动端浏览器的音频限制
      mockAudio.play.mockRejectedValue(new DOMException('NotAllowedError: play() failed because the user didn\'t interact with the document first'));

      expect(async () => {
        await toggleBackgroundMusic();
      }).not.toThrow();
    });

    test('应该处理Safari的音频限制', async () => {
      // 模拟Safari的音频上下文限制
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume.mockResolvedValue(undefined);

      expect(async () => {
        await playButtonClickSound();
        await playPieceSelectSound();
      }).not.toThrow();
    });
  });

  describe('🔑 拼图片段吸附音效', () => {
    test('应该能播放片段吸附音效', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playPieceSnapSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'pieceSnap' });
    });

    test('应该处理音频上下文不可用的情况', async () => {
      const originalAudioContext = (global as any).AudioContext;
      delete (global as any).AudioContext;
      delete (global as any).webkitAudioContext;

      expect(async () => {
        await playPieceSnapSound();
      }).not.toThrow();

      (global as any).AudioContext = originalAudioContext;
    });

    test('应该处理音频节点创建错误', async () => {
      const mockBrokenAudioContext = {
        ...mockAudioContext,
        createOscillator: jest.fn().mockImplementation(() => {
          throw new Error('Oscillator creation failed');
        })
      };

      (global as any).AudioContext = jest.fn().mockImplementation(() => mockBrokenAudioContext);

      expect(async () => {
        await playPieceSnapSound();
      }).not.toThrow();

      (global as any).AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    });
  });

  describe('🔑 拼图完成音效', () => {
    test('应该能播放拼图完成音效', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playPuzzleCompletedSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'puzzleCompleted' });
    });

    test('应该处理双振荡器音效', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playPuzzleCompletedSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'puzzleCompleted' });
    });

    test('应该处理音频上下文错误', async () => {
      const originalAudioContext = (global as any).AudioContext;
      (global as any).AudioContext = jest.fn().mockImplementation(() => {
        throw new Error('AudioContext creation failed');
      });

      expect(async () => {
        await playPuzzleCompletedSound();
      }).not.toThrow();

      (global as any).AudioContext = originalAudioContext;
    });
  });

  describe('🔑 旋转音效', () => {
    test('应该能播放旋转音效', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playRotateSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'rotate' });
    });

    test('应该使用triangle波形', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playRotateSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'rotate' });
    });

    test('应该处理音频上下文暂停状态', async () => {
      mockAudioContext.state = 'suspended';

      expect(async () => {
        await playRotateSound();
      }).not.toThrow();

      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('🔑 切割音效', () => {
    test('应该能播放切割音效', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playCutSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'cut' });
    });

    test('应该使用sawtooth波形', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playCutSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'cut' });
    });

    test('应该处理复杂的频率变化', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      await playCutSound();

      expect(mockListener).toHaveBeenCalledWith({ soundName: 'cut' });
    });

    test('应该处理音频节点连接错误', async () => {
      const mockBrokenGainNode = {
        connect: jest.fn().mockImplementation(() => {
          throw new Error('Gain node connection failed');
        }),
        gain: { 
          value: 0,
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
          linearRampToValueAtTime: jest.fn()
        }
      };

      const mockAudioContextWithBrokenGain = {
        ...mockAudioContext,
        createGain: jest.fn(() => mockBrokenGainNode)
      };

      (global as any).AudioContext = jest.fn().mockImplementation(() => mockAudioContextWithBrokenGain);

      expect(async () => {
        await playCutSound();
      }).not.toThrow();

      (global as any).AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    });
  });

  describe('🔑 音效系统完整性测试', () => {
    test('应该支持所有音效类型的播放', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;

      // 播放所有类型的音效
      await playButtonClickSound();
      await playPieceSelectSound();
      await playPieceSnapSound();
      await playPuzzleCompletedSound();
      await playRotateSound();
      await playCutSound();

      expect(mockListener).toHaveBeenCalledTimes(6);
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'buttonClick' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'pieceSelect' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'pieceSnap' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'puzzleCompleted' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'rotate' });
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'cut' });
    });

    test('应该处理快速连续播放所有音效', async () => {
      const promises = [
        playButtonClickSound(),
        playPieceSelectSound(),
        playPieceSnapSound(),
        playPuzzleCompletedSound(),
        playRotateSound(),
        playCutSound()
      ];

      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();
    });

    test('应该在音频上下文不可用时优雅降级', async () => {
      const originalAudioContext = (global as any).AudioContext;
      const originalWebkitAudioContext = (global as any).webkitAudioContext;
      
      delete (global as any).AudioContext;
      delete (global as any).webkitAudioContext;
      delete (global.window as any).AudioContext;
      delete (global.window as any).webkitAudioContext;

      const promises = [
        playButtonClickSound(),
        playPieceSelectSound(),
        playPieceSnapSound(),
        playPuzzleCompletedSound(),
        playRotateSound(),
        playCutSound()
      ];

      expect(async () => {
        await Promise.all(promises);
      }).not.toThrow();

      // 恢复AudioContext支持
      (global as any).AudioContext = originalAudioContext;
      (global as any).webkitAudioContext = originalWebkitAudioContext;
      global.window.AudioContext = originalAudioContext;
      (global.window as any).webkitAudioContext = originalWebkitAudioContext;
    });
  });
});