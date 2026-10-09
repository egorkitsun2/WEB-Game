import Phaser from "phaser";

export class VfxSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public createHitSparks(x: number, y: number, color: number = 0xffffff): void {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const spark = this.scene.add.circle(x, y, Phaser.Math.Between(1, 3), color, 0.9);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(40, 160);

      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed * 0.25,
        y: y + Math.sin(angle) * speed * 0.25,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(150, 300),
        ease: "Cubic.easeOut",
        onComplete: () => {
          spark.destroy();
        },
      });
    }
  }

  public createShieldRipple(x: number, y: number, radius: number): void {
    const ring = this.scene.add.circle(x, y, radius, 0x00ffff, 0);
    ring.setStrokeStyle(3, 0x00f0ff, 0.9);

    this.scene.tweens.add({
      targets: ring,
      radius: radius * 1.5,
      alpha: 0,
      duration: 250,
      ease: "Quad.easeOut",
      onComplete: () => {
        ring.destroy();
      },
    });
  }

  public createExplosion(x: number, y: number, radius: number = 30): void {
    // Shockwave ring
    const shockwave = this.scene.add.circle(x, y, 10, 0xffa500, 0);
    shockwave.setStrokeStyle(4, 0xffaa00, 1);
    this.scene.tweens.add({
      targets: shockwave,
      radius: radius * 2.5,
      alpha: 0,
      duration: 450,
      ease: "Cubic.easeOut",
      onComplete: () => shockwave.destroy(),
    });

    // Fireball flash
    const flash = this.scene.add.circle(x, y, radius * 0.8, 0xffffff, 0.9);
    this.scene.tweens.add({
      targets: flash,
      scale: 1.8,
      alpha: 0,
      duration: 300,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });

    // Shrapnel particles
    for (let i = 0; i < 24; i++) {
      const pColor = Phaser.Math.RND.pick([0xff3300, 0xff9900, 0xffea00, 0xffffff]);
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), pColor, 1);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.FloatBetween(40, radius * 3.5);

      this.scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(350, 700),
        ease: "Quad.easeOut",
        onComplete: () => particle.destroy(),
      });
    }
  }
}
