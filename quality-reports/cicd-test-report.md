# CI/CD Integration Test Report

**Generated:** 2025/7/29 23:33:00

## Summary

- **Total Tests:** 5
- **Passed:** 3 ✅
- **Failed (Allowed):** 2 ⚠️
- **Failed:** 0 ❌
- **Overall Status:** SUCCESS ✅

## Test Results

### ✅ Quality Detection Demo

- **Status:** PASSED
- **Duration:** 5344ms
- **Output Preview:** `
> generative-puzzle-game@1.3.38 quality:detection-demo
> tsx src/quality-system/quality-detection/examples/quality-detection-demo.ts

🔍 Quality Detection Engine Demo
================================...`

### ✅ Advanced Metrics Demo

- **Status:** PASSED
- **Duration:** 219ms
- **Output Preview:** `
> generative-puzzle-game@1.3.38 quality:advanced-metrics-demo
> tsx src/quality-system/quality-detection/examples/advanced-metrics-demo.ts

🔬 Advanced Quality Metrics Demo
==========================...`

### ✅ CI/CD Integration Demo

- **Status:** PASSED
- **Duration:** 5728ms
- **Output Preview:** `
> generative-puzzle-game@1.3.38 quality:cicd-demo
> tsx src/quality-system/ci-cd/examples/cicd-integration-demo.ts

🚀 CI/CD Integration Demo
=========================

🌍 Environment Information:
  ...`

### ⚠️ Quality System Unit Tests

- **Status:** FAILED-ALLOWED
- **Duration:** 60029ms
- **Error:** `spawnSync /bin/sh ETIMEDOUT`

### ⚠️ TypeScript Check (Quality System Only)

- **Status:** FAILED-ALLOWED
- **Duration:** 1108ms
- **Error:** `Command failed: npx tsc --noEmit src/quality-system/**/*.ts --skipLibCheck`

## Environment

- **CI:** true
- **GITHUB_ACTIONS:** true
- **GITHUB_REF_NAME:** test-branch
- **GITHUB_SHA:** abc123def456
- **NODE_ENV:** test
