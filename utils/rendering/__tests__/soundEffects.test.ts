/**
 * 音效系统单元测试
 * 目标：提升soundEffects.ts的测试覆盖率至95%以上
 */

// Mock AudioContext和Audio API
const createMockOscillator = () => ({
  type: 'sine',
  frequency: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn()
  },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn()
});

const createMockGainNode = () => ({
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn()
  },
  connect: jest.fn()
});

// 用于跟踪所有创建的mock对象
let allMockOscillators: ReturnType<typeof createMockOscillator>[] = [];
let allMockGainNodes: ReturnType<typeof createMockGainNode>[] = [];
let mockOscillator = createMockOscillator();
let mockGainNode = createMockGainNode();

const mockAudioContext = {
  state: 'running',
  currentTime: 0,
  destination: {},
  createOscillator: jest.fn(() => {
    const newOscillator = createMockOscillator();
    allMockOscillators.push(newOscillator);
    mockOscillator = newOscillator; // 保持向后兼容
    return newOscillator;
  }),
  createGain: jest.fn(() => {
    const newGainNode = createMockGainNode();
    allMockGainNodes.push(newGainNode);
    mockGainNode = newGainNode; // 保持向后兼容
    return newGainNode;
  }),
  resume: jest.fn().mockResolvedValue(undefined)
};

const createMockAudio = () => ({
  loop: false,
  volume: 0,
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn()
});

let mockAudio = createMockAudio();

// 设置全局mock
global.window = {
  AudioContext: jest.fn(() => mockAudioContext),
  webkitAudioContext: jest.fn(() => mockAudioContext),
  __SOUND_PLAY_LISTENER__: undefined
} as any;

global.Audio = jest.fn(() => {
  mockAudio = createMockAudio();
  return mockAudio;
}) as any;

// 动态导入模块以支持重置
let soundEffects: typeof import('../soundEffects');

describe('soundEffects', () => {
  beforeEach(async () => {
    // 重置所有Mock
    jest.clearAllMocks();
    mockAudioContext.state = 'running';
    mockAudioContext.currentTime = 0;
    (global.window as any).__SOUND_PLAY_LISTENER__ = undefined;
    
    // 重新创建mock对象
    mockAudio = createMockAudio();
    mockOscillator = createMockOscillator();
    mockGainNode = createMockGainNode();
    
    // 清空跟踪数组
    allMockOscillators = [];
    allMockGainNodes = [];
    
    // 重置全局构造函数
    (global.window as any).AudioContext = jest.fn(() => mockAudioContext);
    (global.window as any).webkitAudioContext = jest.fn(() => mockAudioContext);
    global.Audio = jest.fn(() => mockAudio) as any;
    
    // 重置soundEffects模块的内部状态
    jest.resetModules();
    soundEffects = await import('../soundEffects');
  });

  describe('soundPlayedForTest', () => {
    it('应该在有监听器时调用监听器', () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;
      
      soundEffects.soundPlayedForTest('testSound');
      
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'testSound' });
    });

    it('应该在没有监听器时不报错', () => {
      (global.window as any).__SOUND_PLAY_LISTENER__ = undefined;
      expect(() => soundEffects.soundPlayedForTest('testSound')).not.toThrow();
    });

    it('应该在非浏览器环境中不报错', () => {
      const tempWindow = global.window;
      delete (global as any).window;
      
      expect(() => soundEffects.soundPlayedForTest('test')).not.toThrow();
      
      (global as any).window = tempWindow;
    });
  });

  describe('initBackgroundMusic', () => {
    it('应该初始化背景音乐', () => {
      soundEffects.initBackgroundMusic();
      expect(global.Audio).toHaveBeenCalledWith('/puzzle-pieces.mp3');
      expect(mockAudio.loop).toBe(true);
      expect(mockAudio.volume).toBe(0.5);
    });

    it('应该只初始化一次背景音乐', () => {
      (global.Audio as jest.Mock).mockClear();
      
      soundEffects.initBackgroundMusic();
      soundEffects.initBackgroundMusic(); // 第二次调用
      
      // 验证Audio构造函数只被调用一次
      expect(global.Audio).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBackgroundMusicStatus', () => {
    it('应该返回正确的播放状态', () => {
      expect(soundEffects.getBackgroundMusicStatus()).toBe(false);
    });
  });

  describe('toggleBackgroundMusic', () => {
    it('应该处理背景音乐未初始化的情况', async () => {
      // 不初始化背景音乐，直接调用toggle
      const result = await soundEffects.toggleBackgroundMusic();
      // 当backgroundMusic为null时，函数应该返回false
      expect(result).toBe(false);
    });

    it('应该开始播放背景音乐', async () => {
      soundEffects.initBackgroundMusic();
      mockAudio.play.mockClear();
      
      const result = await soundEffects.toggleBackgroundMusic();
      // 播放成功后应该返回true
      expect(result).toBe(true);
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('应该暂停正在播放的背景音乐', async () => {
      soundEffects.initBackgroundMusic();
      
      // 先开始播放
      await soundEffects.toggleBackgroundMusic();
      expect(soundEffects.getBackgroundMusicStatus()).toBe(true);
      
      // 再次调用应该暂停
      const result = await soundEffects.toggleBackgroundMusic();
      // 暂停后应该返回false
      expect(result).toBe(false);
      expect(mockAudio.pause).toHaveBeenCalled();
      expect(soundEffects.getBackgroundMusicStatus()).toBe(false);
    });

    it('应该处理播放错误', async () => {
      soundEffects.initBackgroundMusic();
      mockAudio.play.mockRejectedValueOnce(new Error('播放失败'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await soundEffects.toggleBackgroundMusic();
      
      // 播放失败时应该返回false
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Error resuming background music:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('应该在AudioContext挂起时恢复', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume.mockClear();
      
      soundEffects.initBackgroundMusic();
      await soundEffects.toggleBackgroundMusic();
      
      // 当AudioContext状态为suspended时，应该调用resume
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('音效播放函数', () => {
    beforeEach(() => {
      mockAudioContext.state = 'running';
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
    });

    it('应该播放按钮点击音效', async () => {
      // 重置AudioContext状态
      mockAudioContext.state = 'running';
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      
      await soundEffects.playButtonClickSound();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放拼图片选择音效', async () => {
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      await soundEffects.playPieceSelectSound();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放拼图片吸附音效', async () => {
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      await soundEffects.playPieceSnapSound();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放拼图完成音效', async () => {
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      await soundEffects.playPuzzleCompletedSound();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放旋转音效', async () => {
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      await soundEffects.playRotateSound();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该播放切割音效', async () => {
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      await soundEffects.playCutSound();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理AudioContext创建失败', async () => {
      // 重新导入模块以获得新的实例
      jest.resetModules();
      
      (global.window as any).AudioContext = jest.fn(() => {
        throw new Error('AudioContext创建失败');
      });
      (global.window as any).webkitAudioContext = jest.fn(() => {
        throw new Error('AudioContext创建失败');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // 重新导入模块
      const freshSoundEffects = await import('../soundEffects');
      await freshSoundEffects.playButtonClickSound();
      
      // 当AudioContext创建失败时，应该记录错误信息
      expect(consoleSpy).toHaveBeenCalledWith('Web Audio API is not supported in this browser:', expect.any(Error));
      
      consoleSpy.mockRestore();
      
      // 恢复原始设置
      (global.window as any).AudioContext = jest.fn(() => mockAudioContext);
      (global.window as any).webkitAudioContext = jest.fn(() => mockAudioContext);
    });

    it('应该处理不支持Web Audio API的浏览器', async () => {
      const originalAudioContext = (global.window as any).AudioContext;
      const originalWebkitAudioContext = (global.window as any).webkitAudioContext;
      
      (global.window as any).AudioContext = undefined;
      (global.window as any).webkitAudioContext = undefined;
      
      await expect(soundEffects.playButtonClickSound()).resolves.not.toThrow();
      
      (global.window as any).AudioContext = originalAudioContext;
      (global.window as any).webkitAudioContext = originalWebkitAudioContext;
    });

    it('应该处理音效播放中的错误', async () => {
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new Error('创建振荡器失败');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await soundEffects.playButtonClickSound();
      expect(consoleSpy).toHaveBeenCalledWith('Error playing button click sound:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('AudioContext状态管理', () => {
    it('应该在AudioContext挂起时恢复', async () => {
      mockAudioContext.state = 'suspended';
      mockAudioContext.resume.mockClear();
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      
      await soundEffects.playButtonClickSound();
      expect(mockAudioContext.resume).toHaveBeenCalled();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });

    it('应该处理AudioContext状态不是suspended的情况', async () => {
      mockAudioContext.state = 'running';
      mockAudioContext.resume.mockClear();
      
      await soundEffects.playButtonClickSound();
      expect(mockAudioContext.resume).not.toHaveBeenCalled();
    });
  });

  describe('边界情况', () => {
    it('应该处理多次快速调用音效函数', async () => {
      const promises = [
        soundEffects.playButtonClickSound(),
        soundEffects.playPieceSelectSound(),
        soundEffects.playPieceSnapSound(),
        soundEffects.playPuzzleCompletedSound(),
        soundEffects.playRotateSound(),
        soundEffects.playCutSound()
      ];
      
      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('应该测试soundPlayedForTest调用', async () => {
      const mockListener = jest.fn();
      (global.window as any).__SOUND_PLAY_LISTENER__ = mockListener;
      
      mockAudioContext.createOscillator.mockClear();
      mockAudioContext.createGain.mockClear();
      
      await soundEffects.playButtonClickSound();
      expect(mockListener).toHaveBeenCalledWith({ soundName: 'buttonClick' });
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioContext.createGain).toHaveBeenCalled();
    });
  });

  describe('音效参数验证', () => {
    it('应该使用正确的频率和时间参数', async () => {
      // 重置mock调用记录
      mockOscillator.frequency.setValueAtTime.mockClear();
      mockOscillator.frequency.exponentialRampToValueAtTime.mockClear();
      mockGainNode.gain.setValueAtTime.mockClear();
      mockOscillator.start.mockClear();
      mockOscillator.stop.mockClear();
      
      await soundEffects.playButtonClickSound();
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(220, 0.1);
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
      expect(mockOscillator.start).toHaveBeenCalledWith(0);
      expect(mockOscillator.stop).toHaveBeenCalledWith(0.2);
    });

    it('应该为不同音效使用不同参数', async () => {
      // 重置mock调用记录
      mockOscillator.frequency.setValueAtTime.mockClear();
      mockGainNode.gain.setValueAtTime.mockClear();
      mockOscillator.stop.mockClear();
      
      await soundEffects.playPieceSelectSound();
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(600, 0);
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
      expect(mockOscillator.stop).toHaveBeenCalledWith(0.1);
    });
  });

  describe('复杂音效测试', () => {
    it('应该为拼图完成音效创建多个振荡器', async () => {
      mockAudioContext.createOscillator.mockClear();
      
      await soundEffects.playPuzzleCompletedSound();
      
      // 拼图完成音效会创建两个振荡器
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    });

    it('应该为旋转音效使用线性频率变化', async () => {
      mockOscillator.frequency.setValueAtTime.mockClear();
      mockOscillator.frequency.linearRampToValueAtTime.mockClear();
      
      await soundEffects.playRotateSound();
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(400, 0);
      expect(mockOscillator.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(450, 0.08);
    });

    it('应该为切割音效使用正确的参数', async () => {
      mockOscillator.frequency.setValueAtTime.mockClear();
      mockOscillator.frequency.exponentialRampToValueAtTime.mockClear();
      
      await soundEffects.playCutSound();
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(300, 0);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1200, 0.01);
    });
  });

  describe('音效类型设置', () => {
    it('应该为不同音效设置正确的波形类型', async () => {
      mockAudioContext.createOscillator.mockClear();
      
      // 测试按钮点击音效使用sine波
      await soundEffects.playButtonClickSound();
      expect(mockOscillator.type).toBe('sine');
      
      // 重置mock
      mockAudioContext.createOscillator.mockClear();
      await soundEffects.playPieceSnapSound();
      // 验证调用了正确的方法
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });
  });

  describe('音量控制', () => {
    it('应该为不同音效设置适当的音量', async () => {
      mockGainNode.gain.setValueAtTime.mockClear();
      await soundEffects.playButtonClickSound();
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
      
      mockGainNode.gain.setValueAtTime.mockClear();
      
      await soundEffects.playPieceSelectSound();
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
    });
  });

  describe('AudioContext创建逻辑', () => {
    it('应该重用已存在的AudioContext', async () => {
      // 清除AudioContext构造函数的调用记录
      (global.window as any).AudioContext.mockClear();
      
      // 第一次调用创建AudioContext
      await soundEffects.playButtonClickSound();
      
      // 第二次调用应该重用同一个AudioContext
      await soundEffects.playButtonClickSound();
      
      // 验证AudioContext构造函数只被调用一次
      expect((global.window as any).AudioContext).toHaveBeenCalledTimes(1);
    });

    it('应该处理webkitAudioContext回退', async () => {
      // 重新导入模块以获得新的实例
      jest.resetModules();
      
      (global.window as any).AudioContext = undefined;
      (global.window as any).webkitAudioContext = jest.fn(() => mockAudioContext);
      
      // 重新导入模块
      const freshSoundEffects = await import('../soundEffects');
      await freshSoundEffects.playButtonClickSound();
      
      // 当AudioContext不可用时，应该使用webkitAudioContext
      expect((global.window as any).webkitAudioContext).toHaveBeenCalled();
      
      // 恢复原始设置
      (global.window as any).AudioContext = jest.fn(() => mockAudioContext);
      (global.window as any).webkitAudioContext = jest.fn(() => mockAudioContext);
    });
  });

  describe('音效持续时间测试', () => {
    it('应该为不同音效设置正确的持续时间', async () => {
      // 清空跟踪数组
      allMockOscillators = [];
      
      await soundEffects.playButtonClickSound();
      expect(allMockOscillators[0].stop).toHaveBeenCalledWith(0.2);
      
      allMockOscillators = [];
      await soundEffects.playPieceSelectSound();
      expect(allMockOscillators[0].stop).toHaveBeenCalledWith(0.1);
      
      allMockOscillators = [];
      await soundEffects.playPieceSnapSound();
      expect(allMockOscillators[0].stop).toHaveBeenCalledWith(0.3);
      
      allMockOscillators = [];
      await soundEffects.playPuzzleCompletedSound();
      // 拼图完成音效有两个振荡器
      expect(allMockOscillators[0].stop).toHaveBeenCalledWith(0.6);
      expect(allMockOscillators[1].stop).toHaveBeenCalledWith(0.75);
      
      allMockOscillators = [];
      await soundEffects.playRotateSound();
      expect(allMockOscillators[0].stop).toHaveBeenCalledWith(0.12);
      
      allMockOscillators = [];
      await soundEffects.playCutSound();
      expect(allMockOscillators[0].stop).toHaveBeenCalledWith(0.08);
    });
  });

  describe('音效连接测试', () => {
    it('应该正确连接音频节点', async () => {
      await soundEffects.playButtonClickSound();
      
      expect(mockOscillator.connect).toHaveBeenCalledWith(mockGainNode);
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it('应该为拼图完成音效连接多个振荡器', async () => {
      await soundEffects.playPuzzleCompletedSound();
      
      // 拼图完成音效会创建两个振荡器
      expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
      // 检查所有创建的振荡器都被连接
      allMockOscillators.forEach(oscillator => {
        expect(oscillator.connect).toHaveBeenCalled();
      });
      expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });
  });

  describe('音效频率变化测试', () => {
    it('应该为拼图片吸附音效使用频率变化', async () => {
      await soundEffects.playPieceSnapSound();
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880, 0);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(440, 0.2);
    });

    it('应该为切割音效使用复杂的频率变化', async () => {
      await soundEffects.playCutSound();
      
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(300, 0);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1200, 0.01);
      expect(mockOscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(200, 0.08);
    });
  });

  describe('音量包络测试', () => {
    it('应该为切割音效使用线性音量变化', async () => {
      await soundEffects.playCutSound();
      
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 0.002);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.08);
    });
  });

  describe('拼图完成音效详细测试', () => {
    it('应该为拼图完成音效设置正确的频率', async () => {
      await soundEffects.playPuzzleCompletedSound();
      
      // 检查创建了两个振荡器
      expect(allMockOscillators).toHaveLength(2);
      
      // 检查第一个振荡器的频率设置
      expect(allMockOscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 0);
      // 检查第二个振荡器的频率设置
      expect(allMockOscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 0.15);
    });

    it('应该为拼图完成音效设置正确的开始时间', async () => {
      await soundEffects.playPuzzleCompletedSound();
      
      // 检查创建了两个振荡器
      expect(allMockOscillators).toHaveLength(2);
      
      // 检查第一个振荡器的开始时间
      expect(allMockOscillators[0].start).toHaveBeenCalledWith(0);
      // 检查第二个振荡器的开始时间
      expect(allMockOscillators[1].start).toHaveBeenCalledWith(0.15);
    });
  });

  describe('旋转音效详细测试', () => {
    it('应该为旋转音效设置正确的波形类型', async () => {
      await soundEffects.playRotateSound();
      expect(mockOscillator.type).toBe('triangle');
    });

    it('应该为旋转音效设置正确的音量', async () => {
      await soundEffects.playRotateSound();
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.25, 0);
    });
  });

  describe('切割音效详细测试', () => {
    it('应该为切割音效设置正确的波形类型', async () => {
      await soundEffects.playCutSound();
      expect(mockOscillator.type).toBe('sawtooth');
    });

    it('应该为切割音效设置正确的音量包络', async () => {
      await soundEffects.playCutSound();
      
      // 检查音量包络的完整设置
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0);
      expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 0.002);
      expect(mockGainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.001, 0.08);
    });
  });

  describe('拼图片吸附音效详细测试', () => {
    it('应该为拼图片吸附音效设置正确的波形类型', async () => {
      await soundEffects.playPieceSnapSound();
      expect(mockOscillator.type).toBe('triangle');
    });

    it('应该为拼图片吸附音效设置正确的音量', async () => {
      await soundEffects.playPieceSnapSound();
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.4, 0);
    });
  });

  describe('拼图片选择音效详细测试', () => {
    it('应该为拼图片选择音效设置正确的波形类型', async () => {
      await soundEffects.playPieceSelectSound();
      expect(mockOscillator.type).toBe('sine');
    });

    it('应该为拼图片选择音效设置正确的音量', async () => {
      await soundEffects.playPieceSelectSound();
      expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 0);
    });
  });

  describe('AudioContext为null的情况', () => {
    const testAudioContextNull = async (soundFunctionName: keyof typeof import('../soundEffects')) => {
      // 重新导入模块以获得新的实例
      jest.resetModules();
      
      (global.window as any).AudioContext = jest.fn(() => null);
      (global.window as any).webkitAudioContext = jest.fn(() => null);
      
      // 重新导入模块
      const freshSoundEffects = await import('../soundEffects');
      
      // 清除之前的调用记录
      mockAudioContext.createOscillator.mockClear();
      
      await (freshSoundEffects[soundFunctionName] as () => Promise<void>)();
      // 当AudioContext为null时，应该不会调用createOscillator
      expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
      
      // 恢复原始设置
      (global.window as any).AudioContext = jest.fn(() => mockAudioContext);
      (global.window as any).webkitAudioContext = jest.fn(() => mockAudioContext);
    };

    it('应该在AudioContext为null时提前返回', async () => {
      await testAudioContextNull('playButtonClickSound');
    });

    it('应该在AudioContext为null时提前返回 - 拼图片选择音效', async () => {
      await testAudioContextNull('playPieceSelectSound');
    });

    it('应该在AudioContext为null时提前返回 - 拼图片吸附音效', async () => {
      await testAudioContextNull('playPieceSnapSound');
    });

    it('应该在AudioContext为null时提前返回 - 拼图完成音效', async () => {
      await testAudioContextNull('playPuzzleCompletedSound');
    });

    it('应该在AudioContext为null时提前返回 - 旋转音效', async () => {
      await testAudioContextNull('playRotateSound');
    });

    it('应该在AudioContext为null时提前返回 - 切割音效', async () => {
      await testAudioContextNull('playCutSound');
    });
  });

  describe('window未定义的情况', () => {
    it('应该在window未定义时正确处理soundPlayedForTest', () => {
      const tempWindow = global.window;
      delete (global as any).window;
      
      expect(() => soundEffects.soundPlayedForTest('test')).not.toThrow();
      
      (global as any).window = tempWindow;
    });
  });

  describe('拼图完成音效的第二个振荡器', () => {
    it('应该为拼图完成音效的第二个振荡器设置正确的频率', async () => {
      await soundEffects.playPuzzleCompletedSound();
      
      // 检查第二个振荡器的频率设置
      expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 0.15);
    });

    it('应该为拼图完成音效的第二个振荡器设置正确的开始和停止时间', async () => {
      await soundEffects.playPuzzleCompletedSound();
      
      expect(mockOscillator.start).toHaveBeenCalledWith(0.15);
      expect(mockOscillator.stop).toHaveBeenCalledWith(0.75);
    });
  });

  describe('错误处理边界情况', () => {
    it('应该处理createOscillator抛出错误的情况', async () => {
      mockAudioContext.createOscillator.mockImplementationOnce(() => {
        throw new Error('创建振荡器失败');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await soundEffects.playButtonClickSound();
      expect(consoleSpy).toHaveBeenCalledWith('Error playing button click sound:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('应该处理createGain抛出错误的情况', async () => {
      mockAudioContext.createGain.mockImplementationOnce(() => {
        throw new Error('创建增益节点失败');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      await soundEffects.playButtonClickSound();
      expect(consoleSpy).toHaveBeenCalledWith('Error playing button click sound:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});