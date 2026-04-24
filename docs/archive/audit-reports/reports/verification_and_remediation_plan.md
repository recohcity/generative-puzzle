# 🛡️ UI 代码验证报告 & 落地修改方案

> 审计基准：`OPTIMIZATION_SOP.md` + `UI_SPECIFICATION.md`  
> 验证日期：2026-04-23  
> 状态：**✅ 所有修复已完成并复检通过 (V3.8)**

---

## 一、验证总结：审计报告准确性评估

| 审计报告指控 | 验证结论 | 实际代码位置 |
|---|---|---|
| `globals.css` 强制开启琥珀焦点框 | ✅ **确认属实** | L37-41 |
| `.text-premium-value` 使用 `font-semibold` | ✅ **确认属实** | L704-706 |
| `.glass-panel` 使用 `border-white/20` 而非 `/30` | ✅ **确认属实** | L614 |
| `ActionButtons.tsx` 图标硬编码 `#232035` | ✅ **确认属实** | L111/136/161 |
| `ActionButtons.tsx` 角度值使用 `font-bold` | ✅ **确认属实** | L171 |
| `PuzzleControlsCutCount.tsx` 硬编码 `#FFD5AB` | ✅ **确认属实** | L122/156 |
| `PuzzleControlsCutCount.tsx` 使用 `font-bold` | ✅ **确认属实** | L77 |
| `DesktopScoreLayout.tsx` 定义 `BRAND_GOLD='#FFD5AB'` | ✅ **确认属实** | L32 |
| `DesktopScoreLayout.tsx` 硬编码 `#FF8A80` | ✅ **确认属实** | L120 |
| `MobileScoreLayout.tsx` 定义 `SCORE_COLOR='#FFD5AB'` | ✅ **确认属实** | L27 |
| 桌面/移动端结算标题字号不对称 | ✅ **确认属实** | Desktop:`text-[12px]` L83 / Mobile:`text-[11px]` L76 |
| `LeaderboardPanel.tsx` 大量硬编码 HEX | ✅ **确认属实（且更严重）** | 26处以上 `bg-[#2A2A2A]`/`bg-[#463E50]` 等非Token背景 |
| PuzzleCanvas ResizeObserver 延迟 | ⚠️ **部分偏差** | 实际是 **100ms**，规范要求 150ms |
| `GameTimer`/`LiveScore` HUD 品牌色 | ✅ **规范合格** | 通过 `--overlay-text-color: var(--brand-peach)` 正确引用 |
| `GlobalUtilityButtons` 硬编码 `#FFB17A` | ✅ **确认属实** | L64/82/103 |
| `RestartButton` 硬编码 `#FFD5AB` | ✅ **确认属实** | L68 |
| `RecentGameDetails` / `GameRecordDetails` 使用 `BRAND_GOLD` 常量 | ✅ **确认属实** | 两文件均有 |

> **审计报告额外遗漏的新发现**：
> - `LeaderboardPanel.tsx`（新版）整体架构严重偏离规范：使用 `bg-[#463E50]`、`bg-[#2A2A2A]`、`bg-[#333]` 等大量非语义化硬编码背景色，与玻璃拟态规范完全相悖。
> - `PuzzleControlsScatter.tsx` 中存在残留 `console.log` 调试输出（非本次审计重点，但需清理）。
> - `PuzzleCanvas.tsx` 中的 `ResizeObserver` 防抖延迟为 **100ms**，而规范要求 **150ms**，存在细微偏差。

---

## 二、违规确认清单（按优先级）

### 🔴 P0 — 立即修复（✅ 已全部完成）

#### P0-1：`app/globals.css` 焦点框劫持
- **文件**：`app/globals.css` L37-41
- **问题**：`button:focus-visible` 强制添加琥珀色 `outline: 2px solid var(--brand-amber) !important`
- **规范要求**：`outline: none !important`（`.glass-btn-base` 已有正确实现，但被全局规则覆盖）
- **修复**：将 L37-41 的规则改为 `outline: none !important`，或直接删除此块，改用注释说明已由 `.glass-btn-base` 处理

#### P0-2：`.text-premium-value` 字重错误
- **文件**：`app/globals.css` L704-706
- **问题**：`font-semibold`（600），规范锁定为 `font-medium`（500）
- **修复**：改为 `@apply text-brand-peach font-medium;`

#### P0-3：`ActionButtons.tsx` — 图标色硬编码
- **文件**：`components/ActionButtons.tsx` L111/136/161
- **问题**：`className="text-[#232035]"` × 3处
- **修复**：改为 `className="text-brand-dark"`

#### P0-4：`ActionButtons.tsx` — 角度值字重违规
- **文件**：`components/ActionButtons.tsx` L171
- **问题**：`font-bold` 叠加在 `.text-premium-value` 上
- **修复**：删除 `font-bold`，保留 `text-premium-value`（其自身已含正确字重）

#### P0-5：`PuzzleControlsCutCount.tsx` — 硬编码颜色 × 2处
- **文件**：`components/PuzzleControlsCutCount.tsx` L122/156
- **问题**：`color: '#FFD5AB'` 硬编码
- **修复**：改为 `className="text-brand-peach"`（配合移除 style color 属性）

#### P0-6：`PuzzleControlsCutCount.tsx` — 字重违规
- **文件**：`components/PuzzleControlsCutCount.tsx` L77
- **问题**：`font-bold`
- **修复**：改为 `font-medium`

#### P0-7：`GlobalUtilityButtons.tsx` — 硬编码颜色 × 3处
- **文件**：`components/GlobalUtilityButtons.tsx` L64/82/103
- **问题**：`color: '#FFB17A'` / `color: '#232035'`
- **修复**：`'#FFB17A'` → `var(--brand-amber)`，`'#232035'` → `var(--brand-dark)`（inline style 场景）

#### P0-8：`RestartButton.tsx` — 硬编码颜色
- **文件**：`components/RestartButton.tsx` L68
- **问题**：`color: "#FFD5AB"`
- **修复**：删除 inline color，改为父级 `className="text-brand-peach"` 或在组件 className 中添加

---

### 🟠 P1 — 架构修复（✅ 已全部完成）

#### P1-1：结算面板 `BRAND_GOLD` 常量替换（4个文件）

涉及文件：
- `components/score/DesktopScoreLayout.tsx`
- `components/score/MobileScoreLayout.tsx`
- `components/RecentGameDetails.tsx`
- `components/GameRecordDetails.tsx`

**统一修复方案**：
1. 删除各文件内的 `const BRAND_GOLD = '#FFD5AB'` / `const SCORE_COLOR = '#FFD5AB'`
2. 所有 `style={{ color: BRAND_GOLD }}` → 改为 `className="text-brand-peach"`
3. `style={{ color: row.sign === '-' ? '#FF8A80' : BRAND_GOLD }}` → 改为：
   ```tsx
   className={row.sign === '-' ? 'text-red-400' : 'text-brand-peach'}
   ```
4. `bg-[#FFD5AB]/20 text-[#FFD5AB]`（NEW 徽章）→ `bg-brand-peach/20 text-brand-peach`

#### P1-2：结算面板标题字号镜像对称修复

| 位置 | 当前值 | 目标值 |
|---|---|---|
| `DesktopScoreLayout` 标题 (L83) | `text-[12px]` | 保持 `text-[12px]`（作为基准） |
| `MobileScoreLayout` 标题 (L76) | `text-[11px]` | 改为 `text-[12px]` |
| `RecentGameDetails` 标题 (L85) | `text-[12px]` | ✅ 已对齐 |
| `GameRecordDetails` 标题 (L67) | `text-[11px]` | 改为 `text-[12px]` |

#### P1-3：`.glass-panel` 边框透明度修正
- **文件**：`app/globals.css` L614
- **问题**：`border-white/20`，规范要求 `border-white/30`
- **修复**：`@apply bg-white/10 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl;`

#### P1-4：`PuzzleCanvas.tsx` ResizeObserver 防抖延迟修正
- **文件**：`components/PuzzleCanvas.tsx` L63/69
- **问题**：当前 `100ms`，规范 `150ms`
- **修复**：`setTimeout(..., 100)` → `setTimeout(..., 150)`

#### P1-5：`LeaderboardPanel.tsx`（新旧两版）架构翻新
- **文件**：`components/LeaderboardPanel.tsx` & `components/leaderboard/LeaderboardPanel.tsx`
- **问题**：大量非规范背景色 `bg-[#463E50]`、`bg-[#2A2A2A]` 等
- **修复**：全面对齐 Token 体系，引入 `glass-panel` / `glass-card`。

#### P1-8: 修复 VirtualAuth 找回账号 RPC 报错
- **状态**: 100% 完成
- **修复**: `VirtualAuthService.ts` 中 `p_pin_code` 已从 `string` 转为 `number`，对齐 SQL `INT4` 类型。

---

### 🔵 P2 — 持续优化（✅ 已全部完成）

#### P2-1：`PuzzleControlsScatter.tsx` 清理调试日志
- L35/38/40 的 `console.log` 已删除

#### P2-2：`DesktopScoreLayout.tsx` 关闭按钮 Token 化
- L168：`text-[#FFD5AB]` → `text-brand-peach`

#### P2-3：全应用硬编码颜色深度清理
- **涉及组件**：`LoadingScreen`, `SupabaseAuthWidget`, `IdentityChip`, `LanguageSwitcher`, `RotationCounter` 等。
- **状态**：通过自动化脚本扫描并 100% 完成 Token化迁移。

---

## 三、验证方案

### 自动验证
执行以下 grep 确认修复后无残留：
```bash
# 应返回0结果
grep -rn "#FFD5AB\|#FF8A80\|#232035\|#FFB17A" components/ --include="*.tsx"
grep -rn "font-bold" components/ActionButtons.tsx components/PuzzleControlsCutCount.tsx
grep -n "font-semibold" app/globals.css
grep -n "outline: 2px solid" app/globals.css
```

### 手动视觉验证（修复后）
1. **移动端点击按钮** → 不应出现琥珀色焦点框
2. **结算面板** → 桌面/移动端标题字号视觉一致
3. **调整窗口尺寸** → PuzzleCanvas 150ms 后坐标重映射，无抖动
4. **LeaderboardPanel** → 应呈现玻璃拟态风格，无深色实色背景块

---

*验证者：AI Agent（代码比对模式）*  
*文档状态：**✅ 100% 修复完成，符合 V3.8 规范***
