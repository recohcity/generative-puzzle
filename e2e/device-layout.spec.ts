/**
 * 三端布局回归（1.5.16 适配收敛 B/C 验证）
 *
 * 只断言用户可见的布局形态 + 核心链可达 + 无阻断性错误，
 * 不追求覆盖率（防自嗨）：
 * - desktop：双栏（右侧面板存在）
 * - ipad-landscape：桌面布局 + 面板 touch-action: none（1.5.14 修复不回退）
 * - ipad-portrait：手机布局（tab 面板存在）
 */
import { test, expect } from "@playwright/test";

const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const cases = [
  { name: "desktop", viewport: { width: 1280, height: 800 }, ua: DESKTOP_UA, mobile: false },
  { name: "ipad-landscape", viewport: { width: 1024, height: 768 }, ua: IPAD_UA, mobile: false },
  { name: "ipad-portrait", viewport: { width: 768, height: 1024 }, ua: IPAD_UA, mobile: true },
];

for (const c of cases) {
  test(`${c.name}: 布局形态 + 核心链（切割完成）+ 无阻断性错误`, async ({ browser }) => {
    const context = await browser.newContext({
      viewport: c.viewport,
      userAgent: c.ua,
      hasTouch: c.mobile,
      isMobile: c.mobile,
      deviceScaleFactor: c.mobile ? 2 : 1,
    });
    const page = await context.newPage();

    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);

    // 布局形态断言
    if (c.name === "desktop" || c.name === "ipad-landscape") {
      // 双栏桌面布局：存在 .desktop-layout 容器 + 右侧面板
      await expect(page.locator(".desktop-layout")).toHaveCount(1);
      if (c.name === "ipad-landscape") {
        // 1.5.14 修复不回退：布局整层触摸锁定（防面板拖动）
        const layout = page.locator(".desktop-layout").first();
        const layoutTouch = await layout.evaluate((el) => getComputedStyle(el).touchAction);
        expect(layoutTouch).toBe("none");

        // 1.5.17 修复不回退：面板滚动容器放行垂直滚动 + 底部重开按钮完整显示（内容适配面板）
        const panel = page.locator(".desktop-layout .glass-panel.overflow-y-auto");
        await expect(panel).toBeVisible();
        const panelTouch = await panel.evaluate((el) => getComputedStyle(el).touchAction);
        expect(panelTouch).toBe("pan-y");
        const retry = page.getByRole("button", { name: /重玩本局|重开游戏/ }).first();
        await expect(retry).toBeVisible();
        const retryBox = await retry.boundingBox();
        const panelBox = await panel.boundingBox();
        if (retryBox && panelBox) {
          // 按钮底部不超出面板底边（完整显示，不再溢出）
          expect(retryBox.y + retryBox.height).toBeLessThanOrEqual(panelBox.y + panelBox.height + 2);
        }
      }
    } else {
      // ipad-portrait：手机 tab 布局（形状/难度/切割/散开/控制）
      await expect(page.getByRole("button", { name: "形状", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "难度", exact: true })).toBeVisible();
    }

    // 核心链：选形状 → 难度 8 → 切割 → 散开点亮（切割完成）
    if (c.name === "desktop" || c.name === "ipad-landscape") {
      await page.getByRole("button", { name: "云朵形状" }).click();
    } else {
      await page.getByRole("button", { name: "形状", exact: true }).click();
      await page.getByRole("button", { name: "云朵形状" }).click();
      await page.getByRole("button", { name: "难度", exact: true }).click();
    }
    const slider = page.locator("input[type=range]");
    await expect(slider).toBeEnabled({ timeout: 10000 });
    await slider.focus();
    await page.keyboard.press("End");
    await page.waitForTimeout(300);

    if (c.name !== "ipad-portrait") {
      await page.getByRole("button", { name: "嵌齿" }).click();
      await page.getByRole("button", { name: /切割形状|再次切割/ }).click();
    } else {
      await page.getByRole("button", { name: "切割", exact: true }).click();
      await page.getByRole("button", { name: "嵌齿" }).click();
      await page.getByRole("button", { name: /切割形状|再次切割/ }).click();
      await page.getByRole("button", { name: "散开", exact: true }).click();
    }

    const scatter = page.getByRole("button", { name: "散开拼图" });
    await expect(scatter).toBeEnabled({ timeout: 20000 });

    // 无阻断性错误
    const fatal = consoleErrors.filter(
      (e) => /hydrat|Uncaught|Cannot read|is not a function/i.test(e)
    );
    expect(fatal).toEqual([]);

    await context.close();
  });
}
