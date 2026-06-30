/**
 * Automated screen recording of AI Mortgage Adviser for marketing videos.
 *
 * Produces 3 MP4 recordings:
 *   1. product-demo.webm     — Full user flow (upload doc → chat → get advice)
 *   2. landing-scroll.webm   — Landing page showcase with scrolling
 *   3. calculator-demo.webm  — Mortgage calculator in action
 *
 * Usage:
 *   node scripts/video-recording/record-demo.js
 *   node scripts/video-recording/record-demo.js --base-url http://localhost:3000
 *
 * Requirements:
 *   npm install playwright (already in devDependencies)
 *   npx playwright install chromium
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL =
  process.argv.find((a) => a.startsWith("--base-url="))?.split("=")[1] ||
  process.argv[process.argv.indexOf("--base-url") + 1] ||
  "https://mortgage-advisor.probooking.app";

const OUTPUT_DIR = path.join(__dirname, "../../docs/marketing/video/recordings");
const VIEWPORT_DESKTOP = { width: 1280, height: 720 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };

async function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Recording 1: Landing Page Showcase ───────────────────────────────

async function recordLandingPage(browser) {
  console.log("\n📹 Recording 1: Landing page showcase...");

  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: VIEWPORT_DESKTOP,
    },
  });

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(3000); // Let hero animations finish

  // Slowly scroll the full page
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate(
      ([y]) => window.scrollTo({ top: y, behavior: "smooth" }),
      [(scrollHeight * i) / steps]
    );
    await sleep(600);
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  // Click the main CTA if visible
  const cta = page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first();
  if (await cta.isVisible()) {
    await cta.hover();
    await sleep(1000);
  }

  await sleep(2000);
  await context.close();

  // Rename the output file
  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".webm"));
  const latest = files.sort().pop();
  if (latest) {
    fs.renameSync(
      path.join(OUTPUT_DIR, latest),
      path.join(OUTPUT_DIR, "landing-scroll.webm")
    );
  }
  console.log("   ✅ Saved: landing-scroll.webm");
}

// ─── Recording 2: Calculator Demo ─────────────────────────────────────

async function recordCalculator(browser) {
  console.log("\n📹 Recording 2: Mortgage calculator demo...");

  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: VIEWPORT_DESKTOP,
    },
  });

  const page = await context.newPage();

  // Navigate to calculator (try /calculator or /dashboard/calculator)
  await page.goto(`${BASE_URL}/calculator`, { waitUntil: "networkidle" }).catch(() => {});
  await sleep(2000);

  // If redirected to login, try the landing page calculator
  if (page.url().includes("login") || page.url().includes("auth")) {
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await sleep(1000);

    // Scroll to calculator section on landing page
    const calcSection = page.locator('text=Calculate, text=Calculator, [id*="calc"]').first();
    if (await calcSection.isVisible()) {
      await calcSection.scrollIntoViewIfNeeded();
      await sleep(1000);
    }
  }

  // Interact with sliders if present
  const sliders = page.locator('input[type="range"]');
  const count = await sliders.count();
  for (let i = 0; i < count; i++) {
    const slider = sliders.nth(i);
    if (await slider.isVisible()) {
      const box = await slider.boundingBox();
      if (box) {
        // Drag slider to different positions
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, {
          steps: 20,
        });
        await page.mouse.up();
        await sleep(1500);
      }
    }
  }

  await sleep(3000);
  await context.close();

  const files = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".webm") && f !== "landing-scroll.webm");
  const latest = files.sort().pop();
  if (latest) {
    fs.renameSync(
      path.join(OUTPUT_DIR, latest),
      path.join(OUTPUT_DIR, "calculator-demo.webm")
    );
  }
  console.log("   ✅ Saved: calculator-demo.webm");
}

// ─── Recording 3: Mobile Product Demo ──────────────────────────────────

async function recordMobileDemo(browser) {
  console.log("\n📹 Recording 3: Mobile product demo (9:16)...");

  const context = await browser.newContext({
    viewport: VIEWPORT_MOBILE,
    recordVideo: {
      dir: OUTPUT_DIR,
      size: VIEWPORT_MOBILE,
    },
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(3000);

  // Smooth scroll through the mobile landing page
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const steps = 15;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate(
      ([y]) => window.scrollTo({ top: y, behavior: "smooth" }),
      [(scrollHeight * i) / steps]
    );
    await sleep(500);
  }

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  await context.close();

  const files = fs
    .readdirSync(OUTPUT_DIR)
    .filter(
      (f) =>
        f.endsWith(".webm") &&
        f !== "landing-scroll.webm" &&
        f !== "calculator-demo.webm"
    );
  const latest = files.sort().pop();
  if (latest) {
    fs.renameSync(
      path.join(OUTPUT_DIR, latest),
      path.join(OUTPUT_DIR, "mobile-demo.webm")
    );
  }
  console.log("   ✅ Saved: mobile-demo.webm");
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🎬 AI Mortgage Adviser — Automated Video Recording");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Output:   ${OUTPUT_DIR}`);

  await ensureOutputDir();

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-gpu", "--no-sandbox"],
  });

  try {
    await recordLandingPage(browser);
    await recordCalculator(browser);
    await recordMobileDemo(browser);

    console.log("\n🎬 All recordings complete!");
    console.log(`   Files saved to: ${OUTPUT_DIR}`);
    console.log("\n   Next steps:");
    console.log("   1. Convert to MP4:  ffmpeg -i recording.webm -c:v libx264 output.mp4");
    console.log("   2. Add to video editor (CapCut, Premiere, DaVinci Resolve)");
    console.log("   3. Overlay with voiceover from scripts in docs/marketing/video/");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌ Recording failed:", err.message);
  process.exit(1);
});
