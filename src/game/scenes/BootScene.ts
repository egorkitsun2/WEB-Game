import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    this.generateProceduralAssets();
    this.scene.start("menu");
  }

  private generateProceduralAssets(): void {
    const g = this.make.graphics({ x: 0, y: 0 });

    // 1. Player Interceptor Texture (36x36) - Sleek fighter
    g.clear();
    g.fillStyle(0x00d4ff, 1);
    g.beginPath();
    g.moveTo(34, 18);
    g.lineTo(4, 4);
    g.lineTo(10, 18);
    g.lineTo(4, 32);
    g.closePath();
    g.fillPath();

    // Cockpit
    g.fillStyle(0xffffff, 0.9);
    g.beginPath();
    g.moveTo(24, 18);
    g.lineTo(14, 15);
    g.lineTo(14, 21);
    g.closePath();
    g.fillPath();

    g.lineStyle(1.5, 0x88ffff, 1);
    g.strokePath();
    g.generateTexture("ship-interceptor-player", 36, 36);

    // 2. Enemy Interceptor Texture (36x36) - Red fighter
    g.clear();
    g.fillStyle(0xff3355, 1);
    g.beginPath();
    g.moveTo(34, 18);
    g.lineTo(4, 4);
    g.lineTo(10, 18);
    g.lineTo(4, 32);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffea00, 0.9);
    g.beginPath();
    g.moveTo(24, 18);
    g.lineTo(14, 15);
    g.lineTo(14, 21);
    g.closePath();
    g.fillPath();

    g.lineStyle(1.5, 0xff8899, 1);
    g.strokePath();
    g.generateTexture("ship-interceptor-enemy", 36, 36);

    // 3. Player Tank Texture (44x44) - Heavy battlecruiser
    g.clear();
    g.fillStyle(0x00aa88, 1);
    g.beginPath();
    g.moveTo(42, 22);
    g.lineTo(18, 4);
    g.lineTo(4, 10);
    g.lineTo(12, 22);
    g.lineTo(4, 34);
    g.lineTo(18, 40);
    g.closePath();
    g.fillPath();

    g.fillStyle(0x88ffdd, 0.9);
    g.fillRect(16, 18, 12, 8);

    g.lineStyle(2, 0x44ffbb, 1);
    g.strokePath();
    g.generateTexture("ship-tank-player", 44, 44);

    // 4. Enemy Tank Texture (44x44) - Heavy enemy dreadnought
    g.clear();
    g.fillStyle(0xcc4400, 1);
    g.beginPath();
    g.moveTo(42, 22);
    g.lineTo(18, 4);
    g.lineTo(4, 10);
    g.lineTo(12, 22);
    g.lineTo(4, 34);
    g.lineTo(18, 40);
    g.closePath();
    g.fillPath();

    g.fillStyle(0xffaa44, 0.9);
    g.fillRect(16, 18, 12, 8);

    g.lineStyle(2, 0xff6622, 1);
    g.strokePath();
    g.generateTexture("ship-tank-enemy", 44, 44);

    // 5. Laser Projectile (16x6)
    g.clear();
    g.fillStyle(0x00ffff, 1);
    g.fillRect(0, 1, 16, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(2, 2, 12, 2);
    g.generateTexture("proj-laser", 16, 6);

    // 6. Plasma Projectile (18x18)
    g.clear();
    g.fillStyle(0xff00bb, 0.6);
    g.fillCircle(9, 9, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 9, 4);
    g.generateTexture("proj-plasma", 18, 18);

    // 7. Missile Projectile (18x10)
    g.clear();
    g.fillStyle(0xffaa00, 1);
    g.beginPath();
    g.moveTo(17, 5);
    g.lineTo(3, 1);
    g.lineTo(1, 5);
    g.lineTo(3, 9);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xff3300, 1);
    g.fillRect(0, 3, 3, 4);
    g.generateTexture("proj-missile", 18, 10);

    // 8. Background Star (4x4)
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(2, 2, 2);
    g.generateTexture("star", 4, 4);

    g.destroy();
  }
}
