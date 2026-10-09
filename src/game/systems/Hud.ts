import Phaser from "phaser";
import type { Ship } from "../entities/Ship";
import { WEAPONS } from "../data/weapons";
import { ARENA_RADIUS } from "../data/constants";
import type { WeaponId } from "../types";

export class Hud {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private graphics: Phaser.GameObjects.Graphics;

  private hullText: Phaser.GameObjects.Text;
  private shieldText: Phaser.GameObjects.Text;
  private speedText: Phaser.GameObjects.Text;
  private weaponTexts: Record<WeaponId, Phaser.GameObjects.Text>;
  private enemiesLeftText: Phaser.GameObjects.Text;

  private radarCenterX: number = 1180;
  private radarCenterY: number = 100;
  private radarRadius: number = 65;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    this.graphics = scene.add.graphics();
    this.container.add(this.graphics);

    const fontHeader = { fontFamily: "Orbitron, sans-serif", fontSize: "14px", color: "#00e5ff" };
    const fontValue = { fontFamily: "Rajdhani, sans-serif", fontSize: "16px", color: "#ffffff", fontStyle: "bold" };

    // Hull text
    this.hullText = scene.add.text(32, 28, "HULL: 100/100", fontValue);
    this.container.add(this.hullText);

    // Shield text
    this.shieldText = scene.add.text(32, 68, "SHIELD: 50/50 [OFF]", fontValue);
    this.container.add(this.shieldText);

    // Speed readout
    this.speedText = scene.add.text(32, 108, "SPEED: 0", fontValue);
    this.container.add(this.speedText);

    // Enemies remaining
    this.enemiesLeftText = scene.add.text(640, 24, "ENEMIES: 3", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "18px",
      color: "#ff3366",
      fontStyle: "bold",
    }).setOrigin(0.5, 0);
    this.container.add(this.enemiesLeftText);

    // Weapon slots
    this.weaponTexts = {
      laser: scene.add.text(32, 640, "[1] ЛАЗЕР", fontHeader),
      plasma: scene.add.text(180, 640, "[2] ПЛАЗМА", fontHeader),
      missile: scene.add.text(340, 640, "[3] РАКЕТА", fontHeader),
    };

    Object.values(this.weaponTexts).forEach((t) => this.container.add(t));

    // Radar Header
    const radarTitle = scene.add.text(this.radarCenterX, this.radarCenterY - this.radarRadius - 18, "ТАКТИЧЕСКИЙ РАДАР", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "10px",
      color: "#00d4ff",
    }).setOrigin(0.5, 0);
    this.container.add(radarTitle);
  }

  public sync(player: Ship, enemies: Ship[], now: number): void {
    this.graphics.clear();

    const maxHull = player.def.hull;
    const currentHull = Math.max(0, player.hull);
    const hullRatio = Math.max(0, currentHull / maxHull);

    const maxShield = player.def.shield;
    const currentShield = Math.max(0, player.shield);
    const shieldRatio = Math.max(0, currentShield / maxShield);

    // 1. Draw Status Bars Background Panels
    this.graphics.fillStyle(0x0a1122, 0.7);
    this.graphics.lineStyle(1, 0x00d4ff, 0.3);
    this.graphics.fillRoundedRect(20, 16, 260, 120, 6);
    this.graphics.strokeRoundedRect(20, 16, 260, 120, 6);

    // Hull Bar
    this.graphics.fillStyle(0x220505, 0.8);
    this.graphics.fillRect(32, 48, 236, 12);
    this.graphics.fillStyle(hullRatio > 0.3 ? 0x00ff88 : 0xff3333, 1);
    this.graphics.fillRect(32, 48, 236 * hullRatio, 12);

    this.hullText.setText(`КОРПУС: ${Math.round(currentHull)} / ${maxHull}`);

    // Shield Bar
    this.graphics.fillStyle(0x001a33, 0.8);
    this.graphics.fillRect(32, 88, 236, 12);
    this.graphics.fillStyle(player.shieldUp ? 0x00f0ff : 0x0088cc, 1);
    this.graphics.fillRect(32, 88, 236 * shieldRatio, 12);

    const shieldStatus = player.shieldUp ? "АКТИВЕН" : "РЕГЕН";
    this.shieldText.setText(`ЩИТ: ${Math.round(currentShield)} / ${maxShield} [${shieldStatus}]`);
    this.shieldText.setColor(player.shieldUp ? "#00ffff" : "#aaaaaa");

    // Speed
    const body = player.body as Phaser.Physics.Arcade.Body;
    const currentSpeed = body ? Math.round(body.velocity.length()) : 0;
    this.speedText.setText(`СКОРОСТЬ: ${currentSpeed} / ${player.def.maxSpeed}`);

    // Enemies remaining
    const aliveEnemies = enemies.filter((e) => e.alive);
    this.enemiesLeftText.setText(`ЦЕЛИ: ${aliveEnemies.length}`);

    // 2. Draw Weapon Selection & Cooldowns
    const weaponKeys: WeaponId[] = ["laser", "plasma", "missile"];
    const slotWidth = 140;

    weaponKeys.forEach((wId, idx) => {
      const def = WEAPONS[wId];
      const isSelected = player.currentWeapon === wId;
      const x = 24 + idx * (slotWidth + 12);
      const y = 630;

      // Cooldown progress
      const timeSinceShot = now - player.lastShotAt;
      const cdRatio = isSelected
        ? Math.min(1, timeSinceShot / def.cooldownMs)
        : 1;

      // Slot background
      this.graphics.fillStyle(isSelected ? 0x0c2540 : 0x08101a, 0.8);
      this.graphics.lineStyle(isSelected ? 2 : 1, isSelected ? 0x00f0ff : 0x005577, isSelected ? 1 : 0.5);
      this.graphics.fillRoundedRect(x, y, slotWidth, 64, 4);
      this.graphics.strokeRoundedRect(x, y, slotWidth, 64, 4);

      // Cooldown indicator bar
      this.graphics.fillStyle(0x002233, 0.6);
      this.graphics.fillRect(x + 8, y + 44, slotWidth - 16, 6);
      this.graphics.fillStyle(cdRatio >= 1 ? 0x00ffcc : 0xffaa00, 1);
      this.graphics.fillRect(x + 8, y + 44, (slotWidth - 16) * cdRatio, 6);

      const label = this.weaponTexts[wId];
      label.setPosition(x + 12, y + 10);
      label.setColor(isSelected ? "#ffffff" : "#668899");
    });

    // 3. Mini-Radar
    this.drawRadar(player, aliveEnemies);
  }

  private drawRadar(player: Ship, enemies: Ship[]): void {
    const cx = this.radarCenterX;
    const cy = this.radarCenterY;
    const r = this.radarRadius;

    // Radar background
    this.graphics.fillStyle(0x050c18, 0.85);
    this.graphics.fillCircle(cx, cy, r);
    this.graphics.lineStyle(2, 0x00aacc, 0.6);
    this.graphics.strokeCircle(cx, cy, r);

    // Crosshairs
    this.graphics.lineStyle(1, 0x004466, 0.5);
    this.graphics.lineBetween(cx - r, cy, cx + r, cy);
    this.graphics.lineBetween(cx, cy - r, cx, cy + r);
    this.graphics.strokeCircle(cx, cy, r * 0.5);

    // Player blip (center cyan dot with heading tick)
    this.graphics.fillStyle(0x00ffcc, 1);
    this.graphics.fillCircle(cx, cy, 3);
    const tickX = cx + Math.cos(player.heading) * 7;
    const tickY = cy + Math.sin(player.heading) * 7;
    this.graphics.lineStyle(2, 0x00ffcc, 1);
    this.graphics.lineBetween(cx, cy, tickX, tickY);

    // Enemy blips relative to player
    const maxRange = ARENA_RADIUS;
    enemies.forEach((enemy) => {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.hypot(dx, dy);

      const clampedDist = Math.min(dist, maxRange);
      const radarDist = (clampedDist / maxRange) * (r - 6);
      const angle = Math.atan2(dy, dx);

      const bx = cx + Math.cos(angle) * radarDist;
      const by = cy + Math.sin(angle) * radarDist;

      this.graphics.fillStyle(0xff3355, 1);
      this.graphics.fillCircle(bx, by, 3.5);
    });
  }

  public destroy(): void {
    this.container.destroy();
  }
}
