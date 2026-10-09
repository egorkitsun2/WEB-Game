import Phaser from "phaser";
import { SoundSystem } from "../systems/SoundSystem";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import type { ShipId } from "../types";

export class PauseScene extends Phaser.Scene {
  private soundSystem!: SoundSystem;
  private shipId: ShipId = "interceptor";

  constructor() {
    super("pause");
  }

  init(data: { shipId: ShipId }): void {
    this.shipId = data.shipId || "interceptor";
  }

  create(): void {
    this.soundSystem = SoundSystem.getInstance();

    // Dark semi-transparent backdrop
    const overlay = this.add.graphics();
    overlay.fillStyle(0x02050a, 0.75);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Pause Dialog Box
    const box = this.add.graphics();
    box.fillStyle(0x0a1628, 0.95);
    box.lineStyle(2, 0x00f0ff, 0.8);
    box.fillRoundedRect(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2 - 160, 400, 320, 12);
    box.strokeRoundedRect(GAME_WIDTH / 2 - 200, GAME_HEIGHT / 2 - 160, 400, 320, 12);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, "ПАУЗА", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "32px",
      color: "#00f0ff",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Resume Button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "ПРОДОЛЖИТЬ (ESC)", () => {
      this.soundSystem.playUiClick();
      this.scene.stop();
      this.scene.resume("arena");
    });

    // Restart Button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, "ЗАНОВО", () => {
      this.soundSystem.playUiClick();
      this.scene.stop();
      this.scene.stop("arena");
      this.scene.start("arena", { shipId: this.shipId });
    });

    // Exit to Menu Button
    this.createButton(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, "В ГЛАВНОЕ МЕНЮ", () => {
      this.soundSystem.playUiClick();
      this.scene.stop();
      this.scene.stop("arena");
      this.scene.start("menu");
    });

    // ESC to resume
    this.input.keyboard?.on("keydown-ESC", () => {
      this.soundSystem.playUiClick();
      this.scene.stop();
      this.scene.resume("arena");
    });
  }

  private createButton(x: number, y: number, text: string, onClick: () => void): void {
    const width = 280;
    const height = 44;

    const container = this.add.container(x, y);
    const bg = this.add.graphics();

    bg.fillStyle(0x00d4ff, 0.15);
    bg.lineStyle(1.5, 0x00d4ff, 0.8);
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
      bg.fillStyle(0x00d4ff, 0.4);
      bg.lineStyle(2, 0x00ffff, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      container.setScale(1.03);
    });

    hit.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x00d4ff, 0.15);
      bg.lineStyle(1.5, 0x00d4ff, 0.8);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
      container.setScale(1.0);
    });

    hit.on("pointerdown", onClick);
  }
}
