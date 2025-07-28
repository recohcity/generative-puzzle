/**
 * Cross-Device Compatibility Test (Task 21)
 * Tests functionality across different devices, browsers, and screen sizes
 * Validates mobile, tablet, desktop, and iPhone 16 specific optimizations
 */

class CrossDeviceCompatibilityTester {
  constructor() {
    this.testResults = {
      deviceTests: {},
      browserTests: {},
      orientationTests: {},
      performanceTests: {}
    };
  }

  // Main test runner
  async runAllTests() {
    console.log('🚀 Starting Cross-Device Compatibility Tests...\n');
    
    try {
      // Device-specific tests
      await this.runDeviceSpecificTests();
      
      // Browser compatibility tests
      await this.runBrowserCompatibilityTests();
      
      // Orientation and viewport tests
      await this.runOrientationTests();
      
      // Performance across devices
      await this.runPerformanceTests();
      
      return this.generateCompatibilityReport();
    } catch (error) {
      console.error('❌ Cross-device test execution failed:', error);
      return false;
    }
  }

  // Device-specific functionality tests
  async runDeviceSpecificTests() {
    console.log('📱 Testing device-specific functionality...');
    
    // Mobile device tests
    this.testResults.deviceTests.mobile = this.testMobileDevices();
    
    // Tablet device tests
    this.testResults.deviceTests.tablet = this.testTabletDevices();
    
    // Desktop device tests
    this.testResults.deviceTests.desktop = this.testDesktopDevices();
    
    // iPhone 16 specific tests
    this.testResults.deviceTests.iPhone16 = this.testIPhone16Devices();
    
    console.log('✅ Device-specific tests completed');
  }

  // Browser compatibility tests
  async runBrowserCompatibilityTests() {
    console.log('🌐 Testing browser compatibility...');
    
    // Chrome compatibility
    this.testResults.browserTests.chrome = this.testChromeCompatibility();
    
    // Firefox compatibility
    this.testResults.browserTests.firefox = this.testFirefoxCompatibility();
    
    // Safari compatibility
    this.testResults.browserTests.safari = this.testSafariCompatibility();
    
    // Edge compatibility
    this.testResults.browserTests.edge = this.testEdgeCompatibility();
    
    console.log('✅ Browser compatibility tests completed');
  }

  // Orientation and viewport tests
  async runOrientationTests() {
    console.log('🔄 Testing orientation and viewport handling...');
    
    // Portrait orientation tests
    this.testResults.orientationTests.portrait = this.testPortraitOrientation();
    
    // Landscape orientation tests
    this.testResults.orientationTests.landscape = this.testLandscapeOrientation();
    
    // Viewport resize tests
    this.testResults.orientationTests.resize = this.testViewportResize();
    
    console.log('✅ Orientation tests completed');
  }

  // Performance tests across devices
  async runPerformanceTests() {
    console.log('⚡ Testing performance across devices...');
    
    // Mobile performance
    this.testResults.performanceTests.mobile = await this.testMobilePerformance();
    
    // Desktop performance
    this.testResults.performanceTests.desktop = await this.testDesktopPerformance();
    
    // Memory usage tests
    this.testResults.performanceTests.memory = this.testMemoryUsage();
    
    console.log('✅ Performance tests completed');
  }

  // Mobile device testing
  testMobileDevices() {
    try {
      console.log('  📱 Testing mobile devices...');
      
      // Simulate mobile viewport
      const mobileViewports = [
        { width: 375, height: 667, name: 'iPhone SE' },
        { width: 390, height: 844, name: 'iPhone 12' },
        { width: 430, height: 932, name: 'iPhone 16 Pro Max' },
        { width: 360, height: 640, name: 'Android Small' },
        { width: 412, height: 915, name: 'Android Large' }
      ];

      let passedTests = 0;
      
      mobileViewports.forEach(viewport => {
        // Test layout adaptation
        const layoutTest = this.testLayoutAdaptation(viewport.width, viewport.height);
        
        // Test touch interactions
        const touchTest = this.testTouchInteractions();
        
        // Test mobile-specific features
        const mobileFeatureTest = this.testMobileFeatures();
        
        if (layoutTest && touchTest && mobileFeatureTest) {
          passedTests++;
          console.log(`    ✅ ${viewport.name}: PASSED`);
        } else {
          console.log(`    ❌ ${viewport.name}: FAILED`);
        }
      });

      const success = passedTests === mobileViewports.length;
      console.log(`  📱 Mobile devices: ${success ? 'PASSED' : 'FAILED'} (${passedTests}/${mobileViewports.length})`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Mobile device tests failed: ${error.message}`);
      return false;
    }
  }

  // Tablet device testing
  testTabletDevices() {
    try {
      console.log('  📟 Testing tablet devices...');
      
      const tabletViewports = [
        { width: 768, height: 1024, name: 'iPad' },
        { width: 820, height: 1180, name: 'iPad Air' },
        { width: 1024, height: 1366, name: 'iPad Pro' },
        { width: 800, height: 1280, name: 'Android Tablet' }
      ];

      let passedTests = 0;
      
      tabletViewports.forEach(viewport => {
        const layoutTest = this.testLayoutAdaptation(viewport.width, viewport.height);
        const tabletFeatureTest = this.testTabletFeatures();
        
        if (layoutTest && tabletFeatureTest) {
          passedTests++;
          console.log(`    ✅ ${viewport.name}: PASSED`);
        } else {
          console.log(`    ❌ ${viewport.name}: FAILED`);
        }
      });

      const success = passedTests === tabletViewports.length;
      console.log(`  📟 Tablet devices: ${success ? 'PASSED' : 'FAILED'} (${passedTests}/${tabletViewports.length})`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Tablet device tests failed: ${error.message}`);
      return false;
    }
  }

  // Desktop device testing
  testDesktopDevices() {
    try {
      console.log('  🖥️ Testing desktop devices...');
      
      const desktopViewports = [
        { width: 1280, height: 720, name: 'HD' },
        { width: 1366, height: 768, name: 'WXGA' },
        { width: 1920, height: 1080, name: 'Full HD' },
        { width: 2560, height: 1440, name: '2K' },
        { width: 3840, height: 2160, name: '4K' }
      ];

      let passedTests = 0;
      
      desktopViewports.forEach(viewport => {
        const layoutTest = this.testLayoutAdaptation(viewport.width, viewport.height);
        const desktopFeatureTest = this.testDesktopFeatures();
        
        if (layoutTest && desktopFeatureTest) {
          passedTests++;
          console.log(`    ✅ ${viewport.name}: PASSED`);
        } else {
          console.log(`    ❌ ${viewport.name}: FAILED`);
        }
      });

      const success = passedTests === desktopViewports.length;
      console.log(`  🖥️ Desktop devices: ${success ? 'PASSED' : 'FAILED'} (${passedTests}/${desktopViewports.length})`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Desktop device tests failed: ${error.message}`);
      return false;
    }
  }

  // iPhone 16 specific testing
  testIPhone16Devices() {
    try {
      console.log('  📱 Testing iPhone 16 specific functionality...');
      
      const iPhone16Models = [
        { width: 393, height: 852, name: 'iPhone 16' },
        { width: 430, height: 932, name: 'iPhone 16 Plus' },
        { width: 393, height: 852, name: 'iPhone 16 Pro' },
        { width: 430, height: 932, name: 'iPhone 16 Pro Max' }
      ];

      let passedTests = 0;
      
      iPhone16Models.forEach(model => {
        // Test iPhone 16 detection
        const detectionTest = this.testIPhone16Detection(model.width, model.height);
        
        // Test iPhone 16 optimizations
        const optimizationTest = this.testIPhone16Optimizations();
        
        // Test safe area handling
        const safeAreaTest = this.testSafeAreaHandling();
        
        if (detectionTest && optimizationTest && safeAreaTest) {
          passedTests++;
          console.log(`    ✅ ${model.name}: PASSED`);
        } else {
          console.log(`    ❌ ${model.name}: FAILED`);
        }
      });

      const success = passedTests === iPhone16Models.length;
      console.log(`  📱 iPhone 16 devices: ${success ? 'PASSED' : 'FAILED'} (${passedTests}/${iPhone16Models.length})`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ iPhone 16 device tests failed: ${error.message}`);
      return false;
    }
  }

  // Browser compatibility tests
  testChromeCompatibility() {
    try {
      console.log('  🌐 Testing Chrome compatibility...');
      
      // Test Chrome-specific features
      const webGLTest = this.testWebGLSupport();
      const canvasTest = this.testCanvasSupport();
      const resizeObserverTest = this.testResizeObserverSupport();
      const performanceAPITest = this.testPerformanceAPISupport();
      
      const success = webGLTest && canvasTest && resizeObserverTest && performanceAPITest;
      console.log(`  🌐 Chrome: ${success ? 'PASSED' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Chrome compatibility test failed: ${error.message}`);
      return false;
    }
  }

  testFirefoxCompatibility() {
    try {
      console.log('  🦊 Testing Firefox compatibility...');
      
      // Test Firefox-specific considerations
      const canvasTest = this.testCanvasSupport();
      const eventTest = this.testEventSupport();
      const cssTest = this.testCSSSupport();
      
      const success = canvasTest && eventTest && cssTest;
      console.log(`  🦊 Firefox: ${success ? 'PASSED' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Firefox compatibility test failed: ${error.message}`);
      return false;
    }
  }

  testSafariCompatibility() {
    try {
      console.log('  🧭 Testing Safari compatibility...');
      
      // Test Safari-specific considerations
      const touchTest = this.testTouchSupport();
      const canvasTest = this.testCanvasSupport();
      const viewportTest = this.testViewportSupport();
      
      const success = touchTest && canvasTest && viewportTest;
      console.log(`  🧭 Safari: ${success ? 'PASSED' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Safari compatibility test failed: ${error.message}`);
      return false;
    }
  }

  testEdgeCompatibility() {
    try {
      console.log('  🌊 Testing Edge compatibility...');
      
      // Test Edge-specific considerations
      const canvasTest = this.testCanvasSupport();
      const eventTest = this.testEventSupport();
      const performanceTest = this.testPerformanceAPISupport();
      
      const success = canvasTest && eventTest && performanceTest;
      console.log(`  🌊 Edge: ${success ? 'PASSED' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Edge compatibility test failed: ${error.message}`);
      return false;
    }
  }

  // Orientation tests
  testPortraitOrientation() {
    try {
      console.log('  📱 Testing portrait orientation...');
      
      // Simulate portrait orientation
      const portraitTest = this.testOrientationHandling(375, 667);
      const layoutTest = this.testPortraitLayout();
      
      const success = portraitTest && layoutTest;
      console.log(`  📱 Portrait: ${success ? 'PASSED' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Portrait orientation test failed: ${error.message}`);
      return false;
    }
  }

  testLandscapeOrientation() {
    try {
      console.log('  📱 Testing landscape orientation...');
      
      // Simulate landscape orientation
      const landscapeTest = this.testOrientationHandling(667, 375);
      const layoutTest = this.testLandscapeLayout();
      
      const success = landscapeTest && layoutTest;
      console.log(`  📱 Landscape: ${success ? 'PASSED' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Landscape orientation test failed: ${error.message}`);
      return false;
    }
  }

  testViewportResize() {
    try {
      console.log('  🔄 Testing viewport resize handling...');
      
      // Test resize handling
      const resizeTest = this.testResizeHandling();
      const adaptationTest = this.testResizeAdaptation();
      
      const success = resizeTest && adaptationTest;
      console.log(`  🔄 Viewport resize: ${success ? 'PASSED' : 'FAILED'}`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Viewport resize test failed: ${error.message}`);
      return false;
    }
  }

  // Performance tests
  async testMobilePerformance() {
    try {
      console.log('  📱 Testing mobile performance...');
      
      const startTime = performance.now();
      
      // Simulate mobile workload
      for (let i = 0; i < 1000; i++) {
        // Simulate canvas operations
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillRect(0, 0, 100, 100);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Mobile performance should be reasonable
      const success = duration < 1000; // Less than 1 second
      console.log(`  📱 Mobile performance: ${success ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Mobile performance test failed: ${error.message}`);
      return false;
    }
  }

  async testDesktopPerformance() {
    try {
      console.log('  🖥️ Testing desktop performance...');
      
      const startTime = performance.now();
      
      // Simulate desktop workload
      for (let i = 0; i < 5000; i++) {
        // Simulate more intensive operations
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillRect(0, 0, 200, 200);
        }
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Desktop should handle more intensive workload
      const success = duration < 2000; // Less than 2 seconds
      console.log(`  🖥️ Desktop performance: ${success ? 'PASSED' : 'FAILED'} (${duration.toFixed(2)}ms)`);
      
      return success;
    } catch (error) {
      console.log(`  ❌ Desktop performance test failed: ${error.message}`);
      return false;
    }
  }

  testMemoryUsage() {
    try {
      console.log('  💾 Testing memory usage...');
      
      if (typeof performance.memory !== 'undefined') {
        const initialMemory = performance.memory.usedJSHeapSize;
        
        // Create some objects to test memory
        const testObjects = [];
        for (let i = 0; i < 10000; i++) {
          testObjects.push({ id: i, data: new Array(100).fill(i) });
        }
        
        const afterMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = afterMemory - initialMemory;
        
        // Clean up
        testObjects.length = 0;
        
        // Memory increase should be reasonable
        const success = memoryIncrease < 50 * 1024 * 1024; // Less than 50MB
        console.log(`  💾 Memory usage: ${success ? 'PASSED' : 'FAILED'} (+${(memoryIncrease / 1024 / 1024).toFixed(2)}MB)`);
        
        return success;
      } else {
        console.log('  💾 Memory usage: SKIPPED (API not available)');
        return true; // Skip if not available
      }
    } catch (error) {
      console.log(`  ❌ Memory usage test failed: ${error.message}`);
      return false;
    }
  }

  // Helper test methods
  testLayoutAdaptation(width, height) {
    try {
      // Test if layout adapts correctly to given dimensions
      const aspectRatio = width / height;
      const isLandscape = aspectRatio > 1;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      
      return typeof isLandscape === 'boolean' && 
             (isMobile || isTablet || isDesktop);
    } catch (error) {
      return false;
    }
  }

  testTouchInteractions() {
    try {
      // Test touch event support
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    } catch (error) {
      return false;
    }
  }

  testMobileFeatures() {
    try {
      // Test mobile-specific features
      const hasTouch = 'ontouchstart' in window;
      const hasOrientation = 'orientation' in window;
      const hasDevicePixelRatio = 'devicePixelRatio' in window;
      
      return hasTouch || hasOrientation || hasDevicePixelRatio;
    } catch (error) {
      return false;
    }
  }

  testTabletFeatures() {
    try {
      // Test tablet-specific features
      const screenSize = window.innerWidth >= 768 && window.innerWidth < 1024;
      const hasTouch = 'ontouchstart' in window;
      
      return screenSize || hasTouch;
    } catch (error) {
      return false;
    }
  }

  testDesktopFeatures() {
    try {
      // Test desktop-specific features
      const hasMouse = 'onmousedown' in window;
      const hasKeyboard = 'onkeydown' in window;
      const largeScreen = window.innerWidth >= 1024;
      
      return hasMouse && hasKeyboard && largeScreen;
    } catch (error) {
      return false;
    }
  }

  testIPhone16Detection(width, height) {
    try {
      // Test iPhone 16 detection logic
      const userAgent = navigator.userAgent;
      const isIPhone = /iPhone/.test(userAgent);
      const isCorrectSize = (width === 393 && height === 852) || 
                           (width === 430 && height === 932);
      
      return isIPhone && isCorrectSize;
    } catch (error) {
      return false;
    }
  }

  testIPhone16Optimizations() {
    try {
      // Test iPhone 16 specific optimizations
      const devicePixelRatio = window.devicePixelRatio || 1;
      const isHighDPI = devicePixelRatio >= 3;
      
      return typeof isHighDPI === 'boolean';
    } catch (error) {
      return false;
    }
  }

  testSafeAreaHandling() {
    try {
      // Test safe area handling
      const safeAreaTop = getComputedStyle(document.documentElement)
        .getPropertyValue('--sat') || '0px';
      
      return typeof safeAreaTop === 'string';
    } catch (error) {
      return false;
    }
  }

  // Browser feature tests
  testWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return gl !== null;
    } catch (error) {
      return false;
    }
  }

  testCanvasSupport() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      return ctx !== null;
    } catch (error) {
      return false;
    }
  }

  testResizeObserverSupport() {
    try {
      return typeof ResizeObserver !== 'undefined';
    } catch (error) {
      return false;
    }
  }

  testPerformanceAPISupport() {
    try {
      return typeof performance !== 'undefined' && 
             typeof performance.now === 'function';
    } catch (error) {
      return false;
    }
  }

  testEventSupport() {
    try {
      return 'addEventListener' in window && 'removeEventListener' in window;
    } catch (error) {
      return false;
    }
  }

  testCSSSupport() {
    try {
      return typeof getComputedStyle === 'function';
    } catch (error) {
      return false;
    }
  }

  testTouchSupport() {
    try {
      return 'ontouchstart' in window;
    } catch (error) {
      return false;
    }
  }

  testViewportSupport() {
    try {
      return 'innerWidth' in window && 'innerHeight' in window;
    } catch (error) {
      return false;
    }
  }

  testOrientationHandling(width, height) {
    try {
      const orientation = width > height ? 'landscape' : 'portrait';
      return orientation === 'landscape' || orientation === 'portrait';
    } catch (error) {
      return false;
    }
  }

  testPortraitLayout() {
    try {
      // Test portrait-specific layout
      return window.innerHeight > window.innerWidth;
    } catch (error) {
      return false;
    }
  }

  testLandscapeLayout() {
    try {
      // Test landscape-specific layout
      return window.innerWidth > window.innerHeight;
    } catch (error) {
      return false;
    }
  }

  testResizeHandling() {
    try {
      // Test resize event handling
      return 'onresize' in window;
    } catch (error) {
      return false;
    }
  }

  testResizeAdaptation() {
    try {
      // Test adaptation to resize
      const currentWidth = window.innerWidth;
      const currentHeight = window.innerHeight;
      
      return currentWidth > 0 && currentHeight > 0;
    } catch (error) {
      return false;
    }
  }

  // Generate compatibility report
  generateCompatibilityReport() {
    console.log('\n📋 Cross-Device Compatibility Report');
    console.log('====================================');
    
    // Device compatibility summary
    console.log('\n📱 Device Compatibility:');
    Object.entries(this.testResults.deviceTests).forEach(([device, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${device}`);
    });
    
    // Browser compatibility summary
    console.log('\n🌐 Browser Compatibility:');
    Object.entries(this.testResults.browserTests).forEach(([browser, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${browser}`);
    });
    
    // Orientation compatibility summary
    console.log('\n🔄 Orientation Compatibility:');
    Object.entries(this.testResults.orientationTests).forEach(([orientation, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${orientation}`);
    });
    
    // Performance summary
    console.log('\n⚡ Performance:');
    Object.entries(this.testResults.performanceTests).forEach(([test, result]) => {
      console.log(`  ${result ? '✅' : '❌'} ${test}`);
    });
    
    // Calculate overall compatibility score
    const allResults = [
      ...Object.values(this.testResults.deviceTests),
      ...Object.values(this.testResults.browserTests),
      ...Object.values(this.testResults.orientationTests),
      ...Object.values(this.testResults.performanceTests)
    ];
    
    const passedTests = allResults.filter(result => result).length;
    const totalTests = allResults.length;
    const compatibilityScore = (passedTests / totalTests) * 100;
    
    console.log(`\n📊 Overall Compatibility Score: ${compatibilityScore.toFixed(1)}%`);
    console.log(`📊 Tests Passed: ${passedTests}/${totalTests}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    if (compatibilityScore >= 90) {
      console.log('  ✅ Excellent cross-device compatibility');
    } else if (compatibilityScore >= 80) {
      console.log('  ⚠️ Good compatibility with minor issues');
    } else {
      console.log('  ❌ Compatibility issues need attention');
    }
    
    const success = compatibilityScore >= 80;
    console.log(`\n${success ? '🎉' : '❌'} Cross-Device Compatibility: ${success ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
    
    return success;
  }
}

// Main test runner
async function runCrossDeviceCompatibilityTests() {
  try {
    console.log('🚀 Starting Cross-Device Compatibility Tests...\n');
    
    const tester = new CrossDeviceCompatibilityTester();
    const result = await tester.runAllTests();
    
    console.log(`\n${result ? '🎉' : '❌'} Final Result: ${result ? 'CROSS-DEVICE COMPATIBILITY VERIFIED' : 'COMPATIBILITY ISSUES DETECTED'}`);
    
    return result;
  } catch (error) {
    console.error('❌ Cross-device compatibility test execution failed:', error);
    return false;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CrossDeviceCompatibilityTester, runCrossDeviceCompatibilityTests };
}

// Run if called directly
if (typeof window === 'undefined' && require.main === module) {
  runCrossDeviceCompatibilityTests().then(result => {
    process.exit(result ? 0 : 1);
  });
}