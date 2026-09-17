# 添加形状：逐项清单

形状（shapeType）数量远少于切割方式，但涉及生成、UI、显示名、系数、渲染五个位点，漏一处就出现"生成了但选择不了 / 显示了但名字不对"。

## 1. 生成

- [ ] `contexts/GameContext.tsx`：`generateShape` 按 `shapeType` 分支生成顶点数组。现有：`polygon`（随机凸多边形）、`cloud`（二次贝塞尔平滑）、`jagged`（锯齿半径扰动）。坐标尺度：画布 1000×1000、中心 (500,500)、半径 ~150（与切割器回归口径一致）。
- [ ] 形状必须是闭合多边形（首尾点可自行闭合，顶点按逆时针/顺时针一致）。

## 2. 选择 UI

- [ ] `components/ShapeControls.tsx`：加形状按钮（id = shapeType 字符串值）。
- [ ] 若形状与"曲边渲染"相关（非 polygon → 贝塞尔曲边），确认 `utils/rendering/puzzleDrawing.ts` 的 `isCurvedShape` 无需排除新形状（默认 shapeType !== "polygon" 即曲边）。

## 3. 显示名与系数

- [ ] 显示名：`getShapeDisplayName`（DesktopLayout / PhoneTabPanel）与 `getShapeTypeText`（结算组件）——检查是否共用同一映射，两处都要覆盖新形状。中文名 ≤2 字（"多边形""云朵""锯齿"）。
- [ ] i18n：`game.shapes.names.*` 键（中英两文件）。结算页/榜单显示用同一键。
- [ ] 形状难度系数：`getShapeTypeMultiplier`（DesktopLayout / ScoreCalculator）加条目（现有：polygon 1.0 / cloud 1.1 / jagged 1.2 量级）。

## 4. 生成器兼容

- [ ] 切割层不依赖 shapeType 的形状族假设：`MosaicGenerator` / `ConcavoConvexGenerator` / `NetworkCutter` 都接收 `shapeType` 参数，新形状直接传入即可；但若有形状族专属分支（如锯齿的马赛克适配），需确认新形状走默认路径不崩。
- [ ] 回归：新形状 × 每种切割 × 全档位跑 `verify_extension.ts`。

## 5. 验证

- [ ] `npx tsc --noEmit -p tsconfig.json` 0 错误。
- [ ] 三形状三端（桌面/移动竖屏/移动横屏）目视：选择、生成、散开、结算显示名。
- [ ] 存档兼容：历史记录的 `shapeType` 字符串（polygon/cloud/jagged）不变，新形状只影响新生成。
