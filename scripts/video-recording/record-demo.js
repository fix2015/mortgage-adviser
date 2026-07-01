/**
 * Automated screen recording of AI Mortgage Adviser for marketing videos.
 *
 * Records the FULL authenticated user journey:
 *   1. Landing page scroll
 *   2. Register/Login
 *   3. Dashboard overview (financial summary, readiness, countdown)
 *   4. Document upload
 *   5. AI Chat — ask a mortgage question and get answer
 *   6. Mortgage calculator with slider interaction
 *   7. Lender predictions / bank comparison
 *   8. Mobile version of dashboard
 *
 * Usage:
 *   node scripts/video-recording/record-demo.js
 *   node scripts/video-recording/record-demo.js --base-url http://localhost:3000
 *   node scripts/video-recording/record-demo.js --email fix20152@gmail.com --password Test1234!
 */

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

// ─── Config ────────────────────────────────────────────────────────────

const getArg = (name) => {
  const flag = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (flag) return flag.split("=").slice(1).join("=");
  const idx = process.argv.indexOf(`--${name}`);
  return idx > 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
};

const BASE_URL = getArg("base-url") || "https://mortgage-advisor.probooking.app";
const EMAIL = getArg("email") || "fix20152@gmail.com";
const PASSWORD = getArg("password") || "";
const FULL_NAME = getArg("name") || "Demo User";

const OUTPUT_DIR = path.join(__dirname, "../../docs/marketing/video/recordings");
const VIEWPORT_DESKTOP = { width: 1280, height: 720 };
const VIEWPORT_MOBILE = { width: 390, height: 844 };
const USED_FILES = new Set();

function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function renameLatest(targetName) {
  const files = fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".webm") && !USED_FILES.has(f));
  const latest = files.sort().pop();
  if (latest) {
    const target = path.join(OUTPUT_DIR, targetName);
    if (fs.existsSync(target)) fs.unlinkSync(target);
    fs.renameSync(path.join(OUTPUT_DIR, latest), target);
    USED_FILES.add(targetName);
    console.log(`   ✅ Saved: ${targetName}`);
  }
}

async function dismissOnboarding(page) {
  // Remove all modal overlays via DOM — faster and more reliable than clicking through
  await sleep(2000);

  const dismissed = await page.evaluate(() => {
    // Remove all fixed overlays (onboarding wizard, payment modals, etc.)
    const overlays = document.querySelectorAll(
      '[class*="fixed"][class*="inset-0"], [class*="fixed"][class*="z-50"]'
    );
    if (overlays.length === 0) return false;
    overlays.forEach((el) => el.remove());
    return true;
  });

  if (dismissed) {
    console.log("   📋 Dismissed onboarding/modal overlay");
    await sleep(1000);
  }
}

async function smoothScroll(page, durationMs = 8000) {
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const maxScroll = scrollHeight - viewportHeight;
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    await page.evaluate(
      ([y]) => window.scrollTo({ top: y, behavior: "smooth" }),
      [(maxScroll * i) / steps]
    );
    await sleep(durationMs / steps);
  }
}

// ─── Auth Helper ───────────────────────────────────────────────────────

async function authenticateViaAPI(page) {
  console.log("   🔑 Authenticating via API...");

  // Login via Node.js fetch (not browser) to avoid CORS issues
  const http = require("http");
  const https = require("https");

  const tokens = await new Promise((resolve) => {
    const body = JSON.stringify({ email: EMAIL, password: PASSWORD });
    const url = new URL(`${BASE_URL}/api/v1/auth/login`);
    const mod = url.protocol === "https:" ? https : http;

    const req = mod.request(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            try { resolve(JSON.parse(data)); } catch { resolve(null); }
          } else {
            console.log(`   Login returned ${res.statusCode}: ${data.substring(0, 100)}`);
            resolve(null);
          }
        });
      }
    );
    req.on("error", (e) => { console.log(`   Login error: ${e.message}`); resolve(null); });
    req.write(body);
    req.end();
  });

  if (tokens && tokens.access_token) {
    console.log("   ✅ Logged in successfully");
    // Set tokens in browser localStorage
    await page.evaluate(
      ([t]) => {
        localStorage.setItem("access_token", t.access_token);
        localStorage.setItem("refresh_token", t.refresh_token);
      },
      [tokens]
    );
    return true;
  }

  console.log("   ⚠️  Auth failed");
  return false;
}

// ─── Recording 1: Landing Page ─────────────────────────────────────────

async function recordLandingPage(browser) {
  console.log("\n📹 Recording 1: Landing page showcase...");
  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT_DESKTOP },
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await sleep(3000);

  // Smooth scroll through entire landing page
  await smoothScroll(page, 10000);

  // Scroll back to top and hover CTA
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);
  const cta = page.locator('a:has-text("Get Started"), button:has-text("Get Started")').first();
  if (await cta.isVisible().catch(() => false)) {
    await cta.hover();
    await sleep(1500);
  }
  await sleep(1000);

  await context.close();
  renameLatest("landing-scroll.webm");
}

// ─── Recording 2: Dashboard Overview ───────────────────────────────────

async function recordDashboard(browser) {
  console.log("\n📹 Recording 2: Dashboard overview (authenticated)...");
  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT_DESKTOP },
  });
  const page = await context.newPage();

  // Navigate and authenticate
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const authed = await authenticateViaAPI(page);
  if (!authed) { await context.close(); renameLatest("dashboard.webm"); return; }

  // Go to dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await dismissOnboarding(page);
  await sleep(3000);

  // Slowly scroll through the dashboard to show all widgets
  await smoothScroll(page, 12000);

  // Scroll back to top
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(3000);

  await context.close();
  renameLatest("dashboard.webm");
}

// ─── Recording 3: Document Upload ──────────────────────────────────────

async function recordDocuments(browser) {
  console.log("\n📹 Recording 3: Document upload page...");
  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT_DESKTOP },
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await authenticateViaAPI(page);

  await page.goto(`${BASE_URL}/dashboard/documents`, { waitUntil: "networkidle" });
  await dismissOnboarding(page);
  await sleep(3000);

  // Show the upload area and any existing documents
  await smoothScroll(page, 5000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  // Hover over the upload dropzone
  const dropzone = page.locator('[class*="border-dashed"]').first();
  if (await dropzone.isVisible().catch(() => false)) {
    await dropzone.hover({ force: true }).catch(() => {});
    await sleep(2000);
  }

  await sleep(2000);
  await context.close();
  renameLatest("documents.webm");
}

// ─── Recording 4: AI Chat ──────────────────────────────────────────────

async function recordChat(browser) {
  console.log("\n📹 Recording 4: AI Chat conversation...");
  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT_DESKTOP },
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await authenticateViaAPI(page);

  await page.goto(`${BASE_URL}/dashboard/chat`, { waitUntil: "networkidle" });
  await dismissOnboarding(page);
  await sleep(3000);

  // Dismiss any fixed overlays blocking the chat input
  await page.evaluate(() => {
    document.querySelectorAll('[class*="fixed"][class*="bottom"]').forEach((el) => el.remove());
    document.querySelectorAll('[class*="fixed"][class*="z-[6"]').forEach((el) => el.remove());
  });
  await sleep(1000);

  // Type a mortgage question
  const input = page.locator("textarea").last();
  if (await input.isVisible().catch(() => false)) {
    await input.click({ force: true });
    await sleep(500);

    const question = "How much can I borrow on a £50,000 salary as a first-time buyer?";
    await input.type(question, { delay: 40 });
    await sleep(1000);

    // Submit
    const sendBtn = page.locator('button[type="submit"]').first();
    if (await sendBtn.isVisible().catch(() => false)) {
      await sendBtn.click({ force: true });
    } else {
      await input.press("Enter");
    }

    // Wait for AI response to stream in
    await sleep(20000);

    // Scroll through the response
    await page.evaluate(() => {
      const chatAreas = document.querySelectorAll('[class*="overflow-auto"], [class*="overflow-y"]');
      chatAreas.forEach((el) => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }));
    });
    await sleep(3000);
  } else {
    // Try clicking a suggestion button
    const suggestion = page.locator('button:has-text("How much")').first();
    if (await suggestion.isVisible().catch(() => false)) {
      await suggestion.click({ force: true });
      await sleep(20000);
    }
    await sleep(3000);
  }

  await sleep(2000);
  await context.close();
  renameLatest("chat.webm");
}

// ─── Recording 5: Calculator ───────────────────────────────────────────

async function recordCalculator(browser) {
  console.log("\n📹 Recording 5: Mortgage calculator...");
  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT_DESKTOP },
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await authenticateViaAPI(page);

  await page.goto(`${BASE_URL}/dashboard/calculator`, { waitUntil: "networkidle" });
  await dismissOnboarding(page);
  await sleep(3000);

  // Interact with sliders
  const sliders = page.locator('input[type="range"]');
  const count = await sliders.count();
  for (let i = 0; i < Math.min(count, 4); i++) {
    const slider = sliders.nth(i);
    if (await slider.isVisible().catch(() => false)) {
      const box = await slider.boundingBox();
      if (box) {
        // Slowly drag slider
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2);
        await page.mouse.down();
        for (let step = 0; step <= 10; step++) {
          await page.mouse.move(
            box.x + box.width * (0.2 + 0.5 * (step / 10)),
            box.y + box.height / 2
          );
          await sleep(80);
        }
        await page.mouse.up();
        await sleep(1500);
      }
    }
  }

  // Scroll to show results
  await smoothScroll(page, 6000);
  await sleep(2000);

  await context.close();
  renameLatest("calculator.webm");
}

// ─── Recording 6: Lender Predictions ───────────────────────────────────

async function recordPredictions(browser) {
  console.log("\n📹 Recording 6: Lender predictions...");
  const context = await browser.newContext({
    viewport: VIEWPORT_DESKTOP,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT_DESKTOP },
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await authenticateViaAPI(page);

  await page.goto(`${BASE_URL}/dashboard/predictions`, { waitUntil: "networkidle" });
  await dismissOnboarding(page);
  await sleep(5000);

  // Scroll through predictions
  await smoothScroll(page, 8000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  await context.close();
  renameLatest("predictions.webm");
}

// ─── Recording 7: Mobile Dashboard ─────────────────────────────────────

async function recordMobileDashboard(browser) {
  console.log("\n📹 Recording 7: Mobile dashboard (9:16)...");
  const context = await browser.newContext({
    viewport: VIEWPORT_MOBILE,
    recordVideo: { dir: OUTPUT_DIR, size: VIEWPORT_MOBILE },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await authenticateViaAPI(page);

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });
  await sleep(4000);

  // Scroll through mobile dashboard
  await smoothScroll(page, 10000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  // Navigate to chat on mobile
  const chatLink = page.locator('a[href*="chat"], a:has-text("Chat"), a:has-text("Start Chat")').first();
  if (await chatLink.isVisible().catch(() => false)) {
    await chatLink.click();
    await sleep(4000);
  }

  await sleep(2000);
  await context.close();
  renameLatest("mobile-dashboard.webm");
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log("🎬 AI Mortgage Adviser — Full Product Demo Recording");
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Account:  ${EMAIL}`);
  console.log(`   Output:   ${OUTPUT_DIR}\n`);

  ensureOutputDir();

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-gpu", "--no-sandbox"],
  });

  try {
    await recordLandingPage(browser);
    await recordDashboard(browser);
    await recordDocuments(browser);
    await recordChat(browser);
    await recordCalculator(browser);
    await recordPredictions(browser);
    await recordMobileDashboard(browser);

    console.log("\n🎬 All recordings complete!");
    console.log(`   Files saved to: ${OUTPUT_DIR}`);
    console.log("\n   Recordings:");
    const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith(".webm"));
    files.forEach((f) => {
      const size = (fs.statSync(path.join(OUTPUT_DIR, f)).size / 1024 / 1024).toFixed(1);
      console.log(`   - ${f} (${size} MB)`);
    });
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("❌ Recording failed:", err.message);
  process.exit(1);
});
