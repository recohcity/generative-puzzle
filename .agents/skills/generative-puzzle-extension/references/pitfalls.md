# 历史事故档案（必读）

本项目在切割方式演进中踩过的坑，按发生顺序记录。**每条都对应一次真实返工**。改动前先对照本节，确认不重蹈覆辙。

## 事故 1：档位被当刀数（v1.5.7 修复）

- **现象**：选"神工"最大难度（文案 16-30+ 片），贯穿曲线只生成 9 片。
- **根因**：`cutCount` 是难度档位（1-8）。直线/斜线/马赛克/凹凸/放射内部都映射档位（8 档 → 15 线 / 30 块），唯独 `PuzzleGenerator` 的贯穿曲线分支把 `cutCount` 直接传给 `IncrementalCutter.generate` 当刀数 → 8 刀 → 恒 9 片。
- **教训**：**新增任何贯穿类切割分支时，必须 `DIFFICULTY_SETTINGS[cutCount].targetCuts` 映射后再传刀数**。片数 = 刀数 + 1 的特性让偏差一眼可见，但映射缺一不可。
- **验证口径**：每档片数必须落在 `DIFFICULTY_METADATA` 的 pieceRange 区间内（不能只看"能生成"）。

## 事故 2：i18n 双块遗漏（v1.5.6 修复）

- **现象**：结算页成绩详情显示 `CUTTYPE.THROUGH-CURVE`（原始 key 大写）。
- **根因**：显示名有两个独立 i18n 块：
  - `game.cutType.*` —— 按钮（`PuzzleControlsCutType` 用 `t('game.cutType.xxx')`）；
  - 顶层 `cutType.*` —— 结算/详情/榜单 10 个位点用 `t(\`cutType.${cutType}\`)`（`DesktopScoreLayout`、`MobileScoreLayout`、`RecentGameDetails`、`GameRecordDetails`、`LeaderboardPanel`×2、`SimplifiedLeaderboardPanel`、`DesktopLayout`、`PhoneTabPanel`）。
  - 只加了 `game.cutType` 块，顶层块缺新枚举值键 → fallback 打印 key。
- **教训**：**两个块必须同时加键**。且键名两种写法并存（枚举值连字符 `through-curve` + 驼峰 `throughCurve`），项目惯例是双键（`mosaic-random`/`mosaicRandom`、`concavo-convex`/`concavoConvex` 均如此）。

## 事故 3：更名残留与 import 方式（v1.5.6 修复）

- **现象**：`CutType.Curve` 更名 `CutType.Radial` 时，多处漏改或类型报错。
- **根因**：
  - 更名涉及全链路：枚举、难度系数表（`ScoreCalculator`）、分发（`PuzzleGenerator`）、控制器/策略/几何类型标注、存档迁移（`GameDataManager`）、UI 按钮、显示系数表（`DesktopLayout`）、i18n 双块。任何一处漏改就产生 `'curve'` 残留或显示旧名。
  - `CutType` 是运行时枚举，业务代码用 `import { CutType }`；误写成 `import type { CutType }` 会在 `CutType.Straight` 处报 TS1361。纯类型（`Point`）才用 `import type`。
- **教训**：更名 = 全链路同步 + 存档别名保留（`'curve': CutType.Radial`）+ 全局 grep 无残留（`CutType.Curve` 只能出现在迁移映射和文档注释）。

## 事故 4：中文标签过长（2026-09 修复）

- **现象**："放射曲线"、"贯穿曲线"六个字在按钮区/结算行过长（按钮有统一缩放逻辑，但结算行 `难度3 · 云朵形 · 贯穿曲线切割` 过长换行截断）。
- **教训**：新切割中文名控制在 2 字（如"放射""曲线"），英文控制在 1-2 词（"Radial""Curve"）。结算行 `getCutTypeDisplayName` 会拼 `cutType.suffix`（"切割"/" Cut"）。

## 事故 5：JSON 重排（2026-09 修复）

- **现象**：用 python `json.dump` 改 i18n 时缩进从 4 空格变成 2 空格，整个文件 diff 750 行。
- **教训**：i18n JSON 是 4 空格缩进，**修改时保持 `indent=4`**（`ensure_ascii=False`，末尾换行）。精准手术，不要整体重排。
