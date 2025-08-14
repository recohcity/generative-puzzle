/**
 * 音效系统单元测试
 * 目标：提升soundEffects.ts的测试覆盖率，特别是分支覆盖率
 */

import {
  soundPlayedForTest
} from '../soundEffects';

// 由于soundEffects.ts使用模块级变量，我们需要动态导入来重置状态
let soundEffectsModule: any;

const mockWindow = () => {
  const mockAudioContext = {
    state: 'running',
    currentTime: 0,
    destination: {},
    createOscillator: jest.fn(() => ({
      type: 'sine',
      frequency: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn()
    })),
    createGain: jest.fn(() => ({
      gain: {
        setValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn()
      },
      connect: jest.fn()
    })),
    resume: jest.fn().mockResolvedValue(undefined)
  };

  const mockAudio = {
    loop: false,
    volume: 0,
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn()
  };

  Object.defineProperty(global, 'window', {
    value: {
      AudioContext: jest.fn(() => mockAudioContext),
      webkitAudioContext: jest.fn(() => mockAudioContext),
      __SOUND_PLAY_LISTENER__: undefined
    },
    writable: true,
    configurable: true
  });

  Object.defineProperty(global, 'Audio', {
    value: jest.fn(() => mockAudio),
    writable: true,
    configurable: true
  });

  return { mockAudioContext, mockAudio };
};

describe('soundEffects', () => {
  beforeEach(async () => {
    // 清除模块缓存以重置模块级变量
    jest.resetModules();
    
    // 设置mock环境
    mockWindow();
    
    // 重新导入模块
    soundEffectsModule = await import('../soundEffects');
  });

  describe('soundPlayedForTest', () => {
    it('应该在有监听器时调用监听器', () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;
      
      soundPlayedForTest('testSound');
      
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'testSound' });
    });

    it('应该在没有监听器时不报错', () => {
      delete (global.window as any).__SOUND_PLAY_LISTENER__;
      
      expect(() => soundPlayedForTest('testSound')).not.toThrow();
    });

    it('应该在非浏览器环境中不报错', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      expect(() => soundPlayedForTest('testSound')).not.toThrow();
    });
  });

  describe('initBackgroundMusic', () => {
    it('应该初始化背景音乐', () => {
      soundEffectsModule.initBackgroundMusic();
      
      expect(global.Audio).toHaveBeenCalledWith('/puzzle-pieces.mp3');
    });

    it('应该只初始化一次背景音乐', () => {
      soundEffectsModule.initBackgroundMusic();
      soundEffectsModule.initBackgroundMusic();
      
      expect(global.Audio).toHaveBeenCalledTimes(1);
    });
  });

  describe('toggleBackgroundMusic', () => {
    it('应该处理背景音乐未初始化的情况', async () => {
      const result = await soundEffectsModule.toggleBackgroundMusic();
      expect(result).toBe(false);
    });

    it('应该开始播放背景音乐', async () => {
      soundEffectsModule.initBackgroundMusic();
      const result = await soundEffectsModule.toggleBackgroundMusic();
      expect(result).toBe(true);
    });

    it('应该处理播放错误', async () => {
      const { mockAudio } = mockWindow();
      mockAudio.play.mockRejectedValueOnce(new Error('播放失败'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      soundEffectsModule.initBackgroundMusic();
      const result = await soundEffectsModule.toggleBackgroundMusic();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error resuming background music:', expect.any(Error));
      expect(result).toBe(false);
      
      consoleSpy.mockRestore();
    });
  });

  describe('getBackgroundMusicStatus', () => {
    it('应该返回正确的播放状态', async () => {
      expect(soundEffectsModule.getBackgroundMusicStatus()).toBe(false);
      
      soundEffectsModule.initBackgroundMusic();
      await soundEffectsModule.toggleBackgroundMusic();
      expect(soundEffectsModule.getBackgroundMusicStatus()).toBe(true);
    });
  });

  describe('音效播放函数', () => {
    it('应该播放按钮点击音效', async () => {
      const { mockAudioContext } = mockWindow();
      
      await soundEffectsModule.playButtonClickSound();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放拼图片选择音效', async () => {
      const { mockAudioContext } = mockWindow();
      
      await soundEffectsModule.playPieceSelectSound();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放拼图片吸附音效', async () => {
      const { mockAudioContext } = mockWindow();
      
      await soundEffectsModule.playPieceSnapSound();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放拼图完成音效', async () => {
      const { mockAudioContext } = mockWindow();
      
      await soundEffectsModule.playPuzzleCompletedSound();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2); // 两个振荡器
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放旋转音效', async () => {
      const { mockAudioContext } = mockWindow();
      
      await soundEffectsModule.playRotateSound();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放切割音效', async () => {
      const { mockAudioContext } = mockWindow();
      
      await soundEffectsModule.playCutSound();
      
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理AudioContext创建失败', async () => {
      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: jest.fn(() => {
            throw new Error('AudioContext创建失败');
          }),
          webkitAudioContext: jest.fn(() => {
            throw new Error('webkitAudioContext创建失败');
          })
        },
        writable: true,
        configurable: true
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await soundEffectsModule.playButtonClickSound();
      
      expect(consoleSpy).toHaveBeenCalledWith('Web Audio API is not supported in this browser:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('应该处理不支持Web Audio API的浏览器', async () => {
      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: undefined,
          webkitAudioContext: undefined
        },
        writable: true,
        configurable: true
      });
      
      await expect(soundEffectsModule.playButtonClickSound()).resolves.not.toThrow();
    });

    it('应该处理音频播放错误', async () => {
      const { mockAudioContext } = mockWindow();
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new Error('创建振荡器失败');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await soundEffectsModule.playButtonClickSound();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error playing button click sound:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('AudioContext状态管理', () => {
    it('应该在AudioContext挂起时恢复', async () => {
      const mockSuspendedAudioContext = {
        state: 'suspended',
        currentTime: 0,
        destination: {},
        createOscillator: jest.fn(() => ({
          type: 'sine',
          frequency: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn()
        })),
        createGain: jest.fn(() => ({
          gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn()
        })),
        resume: jest.fn().mockResolvedValue(undefined)
      };

      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: jest.fn(() => mockSuspendedAudioContext),
          webkitAudioContext: jest.fn(() => mockSuspendedAudioContext)
        },
        writable: true,
        configurable: true
      });
      
      await soundEffectsModule.playButtonClickSound();
      
      expect(mockSuspendedAudioContext.resume).toHaveBeenCalled();
    });

    it('应该优先使用标准AudioContext', async () => {
      const mockStandardAudioContext = jest.fn(() => ({
        state: 'running',
        currentTime: 0,
        destination: {},
        createOscillator: jest.fn(() => ({
          type: 'sine',
          frequency: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn()
        })),
        createGain: jest.fn(() => ({
          gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn()
        })),
        resume: jest.fn().mockResolvedValue(undefined)
      }));
      const mockWebkitAudioContext = jest.fn();
      
      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: mockStandardAudioContext,
          webkitAudioContext: mockWebkitAudioContext
        },
        writable: true,
        configurable: true
      });
      
      await soundEffectsModule.playButtonClickSound();
      
      expect(mockStandardAudioContext).toHaveBeenCalled();
      expect(mockWebkitAudioContext).not.toHaveBeenCalled();
    });

    it('应该在标准AudioContext不可用时使用webkit版本', async () => {
      const mockWebkitAudioContext = jest.fn(() => ({
        state: 'running',
        currentTime: 0,
        destination: {},
        createOscillator: jest.fn(() => ({
          type: 'sine',
          frequency: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn()
        })),
        createGain: jest.fn(() => ({
          gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn()
        })),
        resume: jest.fn().mockResolvedValue(undefined)
      }));
      
      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: undefined,
          webkitAudioContext: mockWebkitAudioContext
        },
        writable: true,
        configurable: true
      });
      
      await soundEffectsModule.playButtonClickSound();
      
      expect(mockWebkitAudioContext).toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('应该处理多次快速调用音效函数', async () => {
      const promises = [
        soundEffectsModule.playButtonClickSound(),
        soundEffectsModule.playPieceSelectSound(),
        soundEffectsModule.playPieceSnapSound(),
        soundEffectsModule.playRotateSound(),
        soundEffectsModule.playCutSound()
      ];
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('应该处理背景音乐暂停和恢复的完整流程', async () => {
      soundEffectsModule.initBackgroundMusic();
      
      // 开始播放
      let result = await soundEffectsModule.toggleBackgroundMusic();
      expect(result).toBe(true);
      expect(soundEffectsModule.getBackgroundMusicStatus()).toBe(true);
      
      // 暂停播放
      result = await soundEffectsModule.toggleBackgroundMusic();
      expect(result).toBe(false);
      expect(soundEffectsModule.getBackgroundMusicStatus()).toBe(false);
      
      // 再次播放
      result = await soundEffectsModule.toggleBackgroundMusic();
      expect(result).toBe(true);
      expect(soundEffectsModule.getBackgroundMusicStatus()).toBe(true);
    });

    it('应该处理AudioContext为null的情况', async () => {
      // 模拟createAudioContext返回null
      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: undefined,
          webkitAudioContext: undefined
        },
        writable: true,
        configurable: true
      });
      
      // 这些函数应该静默失败，不抛出错误
      await expect(soundEffectsModule.playButtonClickSound()).resolves.not.toThrow();
      await expect(soundEffectsModule.playPieceSelectSound()).resolves.not.toThrow();
      await expect(soundEffectsModule.playPieceSnapSound()).resolves.not.toThrow();
      await expect(soundEffectsModule.playPuzzleCompletedSound()).resolves.not.toThrow();
      await expect(soundEffectsModule.playRotateSound()).resolves.not.toThrow();
      await expect(soundEffectsModule.playCutSound()).resolves.not.toThrow();
    });

    it('应该处理背景音乐播放时AudioContext挂起的情况', async () => {
      const mockSuspendedAudioContext = {
        state: 'suspended',
        resume: jest.fn().mockResolvedValue(undefined)
      };
      
      const mockAudio = {
        loop: false,
        volume: 0,
        play: jest.fn().mockResolvedValue(undefined),
        pause: jest.fn()
      };

      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: jest.fn(() => mockSuspendedAudioContext),
          webkitAudioContext: jest.fn(() => mockSuspendedAudioContext)
        },
        writable: true,
        configurable: true
      });

      Object.defineProperty(global, 'Audio', {
        value: jest.fn(() => mockAudio),
        writable: true,
        configurable: true
      });
      
      soundEffectsModule.initBackgroundMusic();
      const result = await soundEffectsModule.toggleBackgroundMusic();
      
      expect(mockSuspendedAudioContext.resume).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('应该处理所有音效函数的错误情况', async () => {
      const { mockAudioContext } = mockWindow();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // 模拟所有音效函数的错误
      const errorFunctions = [
        { fn: soundEffectsModule.playButtonClickSound, error: 'Error playing button click sound:' },
        { fn: soundEffectsModule.playPieceSelectSound, error: 'Error playing piece select sound:' },
        { fn: soundEffectsModule.playPieceSnapSound, error: 'Error playing piece snap sound:' },
        { fn: soundEffectsModule.playPuzzleCompletedSound, error: 'Error playing puzzle completed sound:' },
        { fn: soundEffectsModule.playRotateSound, error: 'Error playing rotate sound:' },
        { fn: soundEffectsModule.playCutSound, error: 'Error playing cut sound:' }
      ];
      
      for (const { fn, error } of errorFunctions) {
        mockAudioContext.createOscillator.mockImplementationOnce(() => {
          throw new Error('测试错误');
        });
        
        await fn();
        expect(consoleSpy).toHaveBeenCalledWith(error, expect.any(Error));
      }
      
      consoleSpy.mockRestore();
    });

    it('应该处理AudioContext状态不是suspended的情况', async () => {
      const mockRunningAudioContext = {
        state: 'running',
        currentTime: 0,
        destination: {},
        createOscillator: jest.fn(() => ({
          type: 'sine',
          frequency: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn(),
          start: jest.fn(),
          stop: jest.fn()
        })),
        createGain: jest.fn(() => ({
          gain: {
            setValueAtTime: jest.fn(),
            exponentialRampToValueAtTime: jest.fn(),
            linearRampToValueAtTime: jest.fn()
          },
          connect: jest.fn()
        })),
        resume: jest.fn().mockResolvedValue(undefined)
      };

      Object.defineProperty(global, 'window', {
        value: {
          AudioContext: jest.fn(() => mockRunningAudioContext),
          webkitAudioContext: jest.fn(() => mockRunningAudioContext)
        },
        writable: true,
        configurable: true
      });
      
      await soundEffectsModule.playButtonClickSound();
      
      // 当AudioContext状态为running时，不应该调用resume
      expect(mockRunningAudioContext.resume).not.toHaveBeenCalled();
    });

    it('应该覆盖soundPlayedForTest函数（第8行）', () => {
      // 测试没有window对象的情况
      const originalWindow = global.window;
      delete (global as any).window;
      
      // 这应该不会抛出错误
      expect(() => {
        soundEffectsModule.soundPlayedForTest('test-sound');
      }).not.toThrow();
      
      // 恢复window对象
      (global as any).window = originalWindow;
      
      // 测试有window对象但没有监听器的情况
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
        configurable: true
      });
      
      expect(() => {
        soundEffectsModule.soundPlayedForTest('test-sound');
      }).not.toThrow();
      
      // 测试有监听器的情况
      const mockListener = jest.fn();
      Object.defineProperty(global, 'window', {
        value: {
          __SOUND_PLAY_LISTENER__: mockListener
        },
        writable: true,
        configurable: true
      });
      
      soundEffectsModule.soundPlayedForTest('button-click');
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'button-click' });
      
      // 恢复原始window
      (global as any).window = originalWindow;
    });
  });
});