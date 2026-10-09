import Phaser from "phaser";
import { SHIPS } from "../data/ships";
import type { ShipId } from "../types";
import { SoundSystem } from "../systems/SoundSystem";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

export class MenuScene extends Phaser.Scene {
  private selectedShipId: ShipId = "interceptor";
  private soundSystem!: SoundSystem;
  private shipCards: Map<ShipId, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super("menu");
  }

  create(): void {
    this.soundSystem = SoundSystem.getInstance();

    // Read stored ship preference
    const savedShip = localStorage.getItem("st-ship") as ShipId;
    if (savedShip && SHIPS[savedShip]) {
      this.selectedShipId = savedShip;
    }

    const bestScore = localStorage.getItem("st-best-score") || "0";

    // Starfield background
    this.createBackground();

    // Title & Subtitle
    this.add.text(GAME_WIDTH / 2, 70, "SPACE TACTICS", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "44px",
      color: "#00f0ff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 115, "ТАКТИЧЕСКИЙ КОСМИЧЕСКИЙ БОЙ В РЕАЛЬНОМ ВРЕМЕНИ", {
      fontFamily: "Rajdhani, sans-serif",
      fontSize: "18px",
      color: "#66aacc",
      letterSpacing: 2,
    }).setOrigin(0.5);

    // Best Score Display
    this.add.text(GAME_WIDTH / 2, 155, `ЛУЧШИЙ РЕКОРД: ${bestScore}`, {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "16px",
      color: "#ffaa00",
    }).setOrigin(0.5);

    // Ship Selection Section Title
    this.add.text(GAME_WIDTH / 2, 205, "ВЫБЕРИТЕ БОЕВОЙ КОРАБЛЬ", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
    }).setOrigin(0.5);

    // Render 2 Ship Cards
    this.createShipCard("interceptor", GAME_WIDTH / 2 - 220, 340);
    this.createShipCard("tank", GAME_WIDTH / 2 + 220, 340);
    this.updateCardSelections();

    // Start Combat Button
    this.createStartButton();

    // Controls Legend at bottom
    this.createControlsLegend();

    // Sound toggle button in top right
    this.createSoundToggle();
  }

  private createBackground(): void {
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x060c18, 0x060c18, 0x020408, 0x020408, 1);
    bgGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Twinkling stars
    for (let i = 0; i < 90; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const size = Phaser.Math.Between(1, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);

      this.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 1),
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createShipCard(shipId: ShipId, x: number, y: number): void {
    const def = SHIPS[shipId];
    const container = this.add.container(x, y);
    const width = 340;
    const height = 230;

    const bg = this.add.graphics();
    container.add(bg);

    // Preview Sprite
    const textureName = shipId === "interceptor" ? "ship-interceptor-player" : "ship-tank-player";
    const sprite = this.add.sprite(0, -60, textureName);
    sprite.setScale(1.5);
    sprite.setRotation(-Math.PI / 2);
    container.add(sprite);

    // Ship Title
    const title = this.add.text(0, -15, def.label.toUpperCase(), {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    container.add(title);

    // Stats
    const stats = [
      { label: "Корпус", val: `${def.hull} HP`, ratio: def.hull / 140 },
      { label: "Щит", val: `${def.shield} EP`, ratio: def.shield / 80 },
      { label: "Скорость", val: `${def.maxSpeed}`, ratio: def.maxSpeed / 340 },
      { label: "Манёвр", val: `${def.turnRateDeg}°/с`, ratio: def.turnRateDeg / 220 },
    ];

    stats.forEach((st, idx) => {
      const rowY = 22 + idx * 24;

      const lbl = this.add.text(-140, rowY, st.label, {
        fontFamily: "Rajdhani, sans-serif",
        fontSize: "14px",
        color: "#88aabb",
      });
      container.add(lbl);

      const val = this.add.text(140, rowY, st.val, {
        fontFamily: "Rajdhani, sans-serif",
        fontSize: "14px",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(1, 0);
      container.add(val);

      // Stat Bar
      const barBg = this.add.graphics();
      barBg.fillStyle(0x0a1a2f, 0.8);
      barBg.fillRect(-50, rowY + 3, 110, 8);
      barBg.fillStyle(0x00d4ff, 1);
      barBg.fillRect(-50, rowY + 3, 110 * st.ratio, 8);
      container.add(barBg);
    });

    // Interactive Click Area
    const hitArea = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    container.add(hitArea);

    hitArea.on("pointerdown", () => {
      this.soundSystem.playUiClick();
      this.selectedShipId = shipId;
      localStorage.setItem("st-ship", shipId);
      this.updateCardSelections();
    });

    hitArea.on("pointerover", () => {
      if (this.selectedShipId !== shipId) {
        this.tweens.add({ targets: container, scale: 1.03, duration: 120 });
      }
    });

    hitArea.on("pointerout", () => {
      if (this.selectedShipId !== shipId) {
        this.tweens.add({ targets: container, scale: 1.0, duration: 120 });
      }
    });

    this.shipCards.set(shipId, container);
  }

  private updateCardSelections(): void {
    const width = 340;
    const height = 230;

    this.shipCards.forEach((container, sId) => {
      const bg = container.getAt(0) as Phaser.GameObjects.Graphics;
      bg.clear();

      const isSelected = this.selectedShipId === sId;

      if (isSelected) {
        bg.fillStyle(0x0a2238, 0.85);
        bg.lineStyle(3, 0x00f0ff, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        container.setScale(1.05);
      } else {
        bg.fillStyle(0x06111e, 0.65);
        bg.lineStyle(1.5, 0x004466, 0.6);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 10);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 10);
        container.setScale(1.0);
      }
    });
  }

  private createStartButton(): void {
    const btnX = GAME_WIDTH / 2;
    const btnY = 515;
    const width = 300;
    const height = 54;

    const btnContainer = this.add.container(btnX, btnY);
    const bg = this.add.graphics();

    bg.fillStyle(0x00d4ff, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    btnContainer.add(bg);

    const txt = this.add.text(0, 0, "В БОЙ НА АРЕНУ", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "20px",
      color: "#050c18",
      fontStyle: "bold",
    }).setOrigin(0.5);
    btnContainer.add(txt);

    const hitZone = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    btnContainer.add(hitZone);

    hitZone.on("pointerover", () => {
      this.tweens.add({ targets: btnContainer, scale: 1.06, duration: 100 });
      bg.clear();
      bg.fillStyle(0x44ffff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    hitZone.on("pointerout", () => {
      this.tweens.add({ targets: btnContainer, scale: 1.0, duration: 100 });
      bg.clear();
      bg.fillStyle(0x00d4ff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 8);
    });

    hitZone.on("pointerdown", () => {
      this.soundSystem.playUiClick();
      this.scene.start("arena", { shipId: this.selectedShipId });
    });
  }

  private createControlsLegend(): void {
    const legendText = "УПРАВЛЕНИЕ: W — газ  •  S — тормоз  •  A/D — поворот  •  SHIFT — щит  •  SPACE/ЛКМ — огонь  •  1,2,3 — оружие  •  ESC — пауза";
    this.add.text(GAME_WIDTH / 2, 675, legendText, {
      fontFamily: "Rajdhani, sans-serif",
      fontSize: "15px",
      color: "#5588aa",
      letterSpacing: 1,
    }).setOrigin(0.5);
  }

  private createSoundToggle(): void {
    const isMuted = this.soundSystem.isMuted();
    const soundBtn = this.add.text(GAME_WIDTH - 40, 30, isMuted ? "🔇" : "🔊", {
      fontSize: "24px",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    soundBtn.on("pointerdown", () => {
      const nowMuted = this.soundSystem.toggleMute();
      soundBtn.setText(nowMuted ? "🔇" : "🔊");
    });
  }
}
