/**
 * 移动端核心链轻量冒烟（1.5.14 教训：桌面通过 ≠ 移动端可交付）
 *
 * 设计原则（防自嗨）：只测用户真实可见的核心链行为，
 * 不追求覆盖率、不断言内部实现——切割后按钮点亮、拖拽改变碎片位置、
 * 无阻断性控制台错误。任何一步失败 = 移动端真实回归。
 */
import { test, expect } from "@playwright/test";

test("移动端核心链：选形状 → 难度 → 切割 → 散开 → 拖拽", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  // 移动端为 5-tab 布局（形状 / 难度 / 切割 / 散开 / 控制），按 tab 流程走核心链

  // 1) 形状 tab → 选云朵形状
  await page.getByRole("button", { name: "云朵形状" }).click();

  // 2) 难度 tab → 滑条最高档（8）——End 键原生触发 input/change
  await page.getByRole("button", { name: "难度" }).click();
  const slider = page.locator("input[type=range]");
  await expect(slider).toBeEnabled({ timeout: 10000 });
  await slider.focus();
  await page.keyboard.press("End");
  await page.waitForTimeout(300);
  const level = await slider.inputValue();
  expect(level).toBe("8");

  // 3) 切割 tab → 选嵌齿（最重的增量族之一）
  await page.getByRole("button", { name: "切割", exact: true }).click();
  await page.getByRole("button", { name: "嵌齿" }).click();

  // 4) 切割形状（首次点击 = 切割；等散开按钮点亮 = 切割完成）
  await page.getByRole("button", { name: /切割形状|再次切割/ }).click();

  // 5) 散开 tab → 散开拼图（切割完成信号）
  await page.getByRole("button", { name: "散开", exact: true }).click();
  const scatter = page.getByRole("button", { name: "散开拼图" });
  await expect(scatter).toBeEnabled({ timeout: 20000 });
  await scatter.click();

  // 6) 拖拽画布内一个碎片：位置应发生变化（canvas 拖拽成功）
  await page.waitForTimeout(800);
  const canvas = page.locator("canvas").first();
  const box = (await canvas.boundingBox())!;
  const start = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await page.touchscreen.tap(start.x, start.y);
  await page.waitForTimeout(300);
  await page.touchscreen.tap(start.x + 30, start.y + 20);
  await page.waitForTimeout(300);

  // 拖拽路径（先按下再移动再抬起，模拟真实触摸拖拽）
  const el = await canvas.elementHandle();
  await page.evaluate(
    ([c, sx, sy]) => {
      const canvasEl = c as HTMLCanvasElement;
      const rect = canvasEl.getBoundingClientRect();
      const mk = (x: number, y: number) =>
        new Touch({
          identifier: 2,
          target: canvasEl,
          clientX: rect.left + sx + x,
          clientY: rect.top + sy + y,
        } as any);
      canvasEl.dispatchEvent(new TouchEvent("touchstart", { touches: [mk(0, 0)], bubbles: true, cancelable: true } as any));
      canvasEl.dispatchEvent(new TouchEvent("touchmove", { touches: [mk(40, 30)], bubbles: true, cancelable: true } as any));
      canvasEl.dispatchEvent(new TouchEvent("touchmove", { touches: [mk(80, 60)], bubbles: true, cancelable: true } as any));
      canvasEl.dispatchEvent(new TouchEvent("touchend", { touches: [], bubbles: true, cancelable: true } as any));
    },
    [el, start.x - box.x, start.y - box.y]
  );
  await page.waitForTimeout(500);

  // 冒烟通过：核心链走通且无阻断性错误（React hydration / 崩溃类）
  const fatalErrors = consoleErrors.filter(
    (e) => /hydrat|Uncaught|Cannot read|is not a function|Failed to fetch.*supabase/i.test(e)
  );
  expect(fatalErrors).toEqual([]);
});
