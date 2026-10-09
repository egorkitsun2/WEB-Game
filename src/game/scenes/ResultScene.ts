import Phaser from "phaser";
import type { CombatResult } from "../types";
import { SoundSystem } from "../systems/SoundSystem";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";

export class ResultScene extends Phaser.Scene {
  private result!: CombatResult;
  private soundSystem!: SoundSystem;
  private isNewRecord: boolean = false;

  constructor() {
    super("result");
  }

  init(data: CombatResult): void {
    this.result = data;
    this.soundSystem = SoundSystem.getInstance();

    const currentBest = parseInt(localStorage.getItem("st-best-score") || "0", 10);
    if (this.result.score > currentBest) {
      localStorage.setItem("st-best-score", this.result.score.toString());
      this.isNewRecord = true;
    } else {
      this.isNewRecord = false;
    }
  }

  create(): void {
    // Backdrop
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x060f1e, 0x060f1e, 0x020408, 0x020408, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative star particles
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      this.add.circle(x, y, Phaser.Math.Between(1, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.7));
    }

    const won = this.result.won;
    const titleText = won ? "ПОБЕДА!" : "ПОРАЖЕНИЕ";
    const titleColor = won ? "#00f0ff" : "#ff3355";

    // Title Banner
    this.add.text(GAME_WIDTH / 2, 110, titleText, {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "52px",
      color: titleColor,
      fontStyle: "bold",
    }).setOrigin(0.5);

    const subText = won
      ? "Вражеская эскадра полностью уничтожена"
      : "Ваш корабль был уничтожен в бою";
    this.add.text(GAME_WIDTH / 2, 165, subText, {
      fontFamily: "Rajdhani, sans-serif",
      fontSize: "20px",
      color: "#88aabb",
    }).setOrigin(0.5);

    // Score Card Box
    const boxWidth = 440;
    const boxHeight = 250;
    const boxX = GAME_WIDTH / 2;
    const boxY = 320;

    const box = this.add.graphics();
    box.fillStyle(0x0a1628, 0.85);
    box.lineStyle(2, won ? 0x00f0ff : 0xff3355, 0.7);
    box.fillRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 10);
    box.strokeRoundedRect(boxX - boxWidth / 2, boxY - boxHeight / 2, boxWidth, boxHeight, 10);

    // Breakdown Rows
    const rows = [
      { label: "Уничтожено врагов", val: `${this.result.enemiesKilled}` },
      { label: "Оставшийся корпус", val: `${Math.round(this.result.hullRemaining)}` },
      { label: "Оставшийся щит", val: `${Math.round(this.result.shieldRemaining)}` },
      { label: "ИТОГОВЫЙ СЧЁТ", val: `${this.result.score}`, highlight: true },
    ];

    rows.forEach((row, idx) => {
      const rowY = boxY - 80 + idx * 42;
      this.add.text(boxX - 180, rowY, row.label, {
        fontFamily: "Rajdhani, sans-serif",
        fontSize: row.highlight ? "20px" : "18px",
        color: row.highlight ? "#00f0ff" : "#99bbcc",
        fontStyle: row.highlight ? "bold" : "normal",
      });

      this.add.text(boxX + 180, rowY, row.val, {
        fontFamily: "Orbitron, sans-serif",
        fontSize: row.highlight ? "22px" : "18px",
        color: row.highlight ? "#ffffff" : "#ffffff",
        fontStyle: "bold",
      }).setOrigin(1, 0);
    });

    if (this.isNewRecord) {
      this.add.text(boxX, boxY + 95, "★ НОВЫЙ РЕКОРД! ★", {
        fontFamily: "Orbitron, sans-serif",
        fontSize: "16px",
        color: "#ffaa00",
        fontStyle: "bold",
      }).setOrigin(0.5);
    }

    // Action Buttons
    this.createButton(GAME_WIDTH / 2 - 150, 520, "ЕЩЁ РАЗ (ПРОБЕЛ)", () => {
      this.soundSystem.playUiClick();
      this.scene.start("arena", { shipId: this.result.shipId });
    });

    this.createButton(GAME_WIDTH / 2 + 150, 520, "В МЕНЮ", () => {
      this.soundSystem.playUiClick();
      this.scene.start("menu");
    });

    // Keyboard shortcuts
    this.input.keyboard?.on("keydown-SPACE", () => {
      this.soundSystem.playUiClick();
      this.scene.start("arena", { shipId: this.result.shipId });
    });

    this.input.keyboard?.on("keydown-ESC", () => {
      this.soundSystem.playUiClick();
      this.scene.start("menu");
    });
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): void {
    const width = 240;
    const height = 50;

    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    bg.fillStyle(0x00d4ff, 0.2);
    bg.lineStyle(1.5, 0x00d4ff, 0.9);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    container.add(bg);

    const label = this.add.text(0, 0, text, {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "15px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    container.add(label);

    const hit = this.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
    container.add(hit);

    hit.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x00d4ff, 0.5);
      bg.lineStyle(2, 0x00ffff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      container.setScale(1.04);
    });

    hit.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x00d4ff, 0.2);
      bg.lineStyle(1.5, 0x00d4ff, 0.9);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      container.setScale(1.0);
    });

    hit.on("pointerdown", onClick);
  }
}
