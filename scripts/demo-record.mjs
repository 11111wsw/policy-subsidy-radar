// 演示视频自动录制脚本：走线上站点完整流程，输出 webm 并转 mp4
// 运行：node scripts/demo-record.mjs
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const BASE = "https://policy-subsidy-radar.vercel.app";
const OUT_DIR = path.resolve("demo");
fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const smoothScroll = (page, top) =>
  page.evaluate(
    (t) => window.scrollTo({ top: t, behavior: "smooth" }),
    top
  );

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();

console.log("1/6 首页");
await page.goto(BASE, { waitUntil: "networkidle" });
await sleep(4000);
await smoothScroll(page, 650);
await sleep(3000);
await smoothScroll(page, 0);
await sleep(2000);

console.log("2/6 初创企业匹配结果");
await page.getByRole("link", { name: "先看演示效果" }).click();
await page.waitForLoadState("networkidle");
await sleep(5000);
await smoothScroll(page, 750);
await sleep(4000);

console.log("3/6 政策详情页");
await page
  .getByRole("link", { name: "查看申报条件与材料清单" })
  .first()
  .click();
await page.waitForLoadState("networkidle");
await sleep(4000);
await smoothScroll(page, 550);
await sleep(4000);

console.log("4/6 AI 申报建议");
await page.getByRole("button", { name: "生成申报建议" }).click();
await sleep(6000);

console.log("5/6 科技企业匹配结果");
await page.goto(BASE, { waitUntil: "networkidle" });
await sleep(2000);
await smoothScroll(page, 650);
await sleep(2000);
await page.getByRole("link", { name: "查看匹配结果" }).nth(1).click();
await page.waitForLoadState("networkidle");
await sleep(6000);
await smoothScroll(page, 1500);
await sleep(5000);

console.log("6/6 保存视频");
await context.close();
await browser.close();

const webm = fs
  .readdirSync(OUT_DIR)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => path.join(OUT_DIR, f))[0];

const mp4 = path.join(OUT_DIR, "subsidy-radar-demo.mp4");
execFileSync(
  ffmpegPath,
  [
    "-y",
    "-i",
    webm,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    mp4,
  ],
  { stdio: "inherit" }
);
fs.unlinkSync(webm);
console.log("完成：", mp4);
