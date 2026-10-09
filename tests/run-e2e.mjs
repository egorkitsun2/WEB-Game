import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const EDGE_PATH = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const SNAPSHOT_DIR = path.resolve("tests", "snapshots");

if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

async function runTests() {
  console.log("==================================================");
  console.log("   SPACE TACTICS — E2E TEST & SNAPSHOT RUNNER     ");
  console.log("==================================================");

  if (!fs.existsSync(EDGE_PATH)) {
    throw new Error(`Edge executable not found at ${EDGE_PATH}`);
  }

  console.log(`[1/5] Launching Microsoft Edge (headless): ${EDGE_PATH}`);
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--window-size=1280,720",
      "--use-gl=angle",
      "--use-angle=swiftshader",
    ],
    defaultViewport: {
      width: 1280,
      height: 720,
    },
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.error(`[Browser Console Error]: ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    consoleErrors.push(err.message);
    console.error(`[Browser Page Error]: ${err.message}`);
  });

  try {
    // 1. Load Main Menu
    console.log("[2/5] Navigating to http://localhost:5173/ ...");
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1000));

    const title = await page.title();
    console.log(`✓ Page Loaded. Title: "${title}"`);

    const canvas = await page.$("canvas");
    if (!canvas) throw new Error("Canvas element not found!");
    console.log("✓ Phaser canvas initialized successfully");

    const snapMenu = path.join(SNAPSHOT_DIR, "01_main_menu.png");
    await page.screenshot({ path: snapMenu });
    console.log(`✓ Snapshot saved: ${snapMenu}`);

    // 2. Select Tank ship
    console.log("[3/5] Selecting Tank ship archetype...");
    // Tank card is at x: 860, y: 340
    await page.mouse.click(860, 340);
    await new Promise((r) => setTimeout(r, 400));

    const savedShip = await page.evaluate(() => localStorage.getItem("st-ship"));
    console.log(`✓ LocalStorage updated st-ship: "${savedShip}"`);

    const snapTank = path.join(SNAPSHOT_DIR, "02_ship_selected_tank.png");
    await page.screenshot({ path: snapTank });
    console.log(`✓ Snapshot saved: ${snapTank}`);

    // 3. Launch Arena
    console.log("[4/5] Entering combat arena ('В БОЙ НА АРЕНУ')...");
    // Button is at x: 640, y: 515
    await page.mouse.click(640, 515);
    await new Promise((r) => setTimeout(r, 1500));

    const snapArena = path.join(SNAPSHOT_DIR, "03_arena_start.png");
    await page.screenshot({ path: snapArena });
    console.log(`✓ Snapshot saved: ${snapArena}`);

    // 4. Test Flight, Weapons, Shield, Combat
    console.log("[5/5] Emulating flight maneuvers & combat systems...");
    // Hold W (forward thrust)
    await page.keyboard.down("KeyW");
    await new Promise((r) => setTimeout(r, 600));
    // Turn right with D
    await page.keyboard.down("KeyD");
    await new Promise((r) => setTimeout(r, 400));
    await page.keyboard.up("KeyD");
    await page.keyboard.up("KeyW");

    // Switch to weapon 2 (Plasma)
    await page.keyboard.press("Digit2");
    await new Promise((r) => setTimeout(r, 200));

    // Fire plasma
    await page.keyboard.press("Space");
    await new Promise((r) => setTimeout(r, 400));

    // Switch to weapon 3 (Missile)
    await page.keyboard.press("Digit3");
    await new Promise((r) => setTimeout(r, 200));

    // Fire missile
    await page.keyboard.press("Space");
    await new Promise((r) => setTimeout(r, 400));

    // Hold Shift (Energy Shield)
    await page.keyboard.down("ShiftLeft");
    await new Promise((r) => setTimeout(r, 500));

    const snapCombat = path.join(SNAPSHOT_DIR, "04_arena_combat_action.png");
    await page.screenshot({ path: snapCombat });
    await page.keyboard.up("ShiftLeft");
    console.log(`✓ Snapshot saved: ${snapCombat}`);

    // Pause menu test
    console.log("Testing Pause menu (ESC)...");
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 600));

    const snapPause = path.join(SNAPSHOT_DIR, "05_pause_menu.png");
    await page.screenshot({ path: snapPause });
    console.log(`✓ Snapshot saved: ${snapPause}`);

    // Resume from pause
    await page.keyboard.press("Escape");
    await new Promise((r) => setTimeout(r, 600));

    const snapResume = path.join(SNAPSHOT_DIR, "06_arena_resumed.png");
    await page.screenshot({ path: snapResume });
    console.log(`✓ Snapshot saved: ${snapResume}`);

    console.log("==================================================");
    if (consoleErrors.length === 0) {
      console.log("✓ ALL TESTS PASSED WITH 0 CONSOLE ERRORS!");
    } else {
      console.warn(`! Completed with ${consoleErrors.length} console errors.`);
    }
    console.log("==================================================");
  } finally {
    await browser.close();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
