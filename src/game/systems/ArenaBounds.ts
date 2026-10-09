import Phaser from "phaser";
import { ARENA_RADIUS } from "../data/constants";
import type { Ship } from "../entities/Ship";

export class ArenaBounds {
  private boundaryGraphic: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.boundaryGraphic = scene.add.graphics();
    this.drawBoundary();
  }

  private drawBoundary(): void {
    this.boundaryGraphic.clear();

    // Outer warning border
    this.boundaryGraphic.lineStyle(2, 0x004466, 0.4);
    this.boundaryGraphic.strokeCircle(0, 0, ARENA_RADIUS);

    // Dotted / glowing grid ring
    this.boundaryGraphic.lineStyle(4, 0x00d4ff, 0.7);
    this.boundaryGraphic.strokeCircle(0, 0, ARENA_RADIUS - 4);

    // Hazard markers around boundary
    const markerCount = 36;
    for (let i = 0; i < markerCount; i++) {
      const angle = (i / markerCount) * Math.PI * 2;
      const x1 = Math.cos(angle) * (ARENA_RADIUS - 15);
      const y1 = Math.sin(angle) * (ARENA_RADIUS - 15);
      const x2 = Math.cos(angle) * ARENA_RADIUS;
      const y2 = Math.sin(angle) * ARENA_RADIUS;

      this.boundaryGraphic.lineStyle(2, 0x00f0ff, 0.8);
      this.boundaryGraphic.lineBetween(x1, y1, x2, y2);
    }
  }

  public clamp(ship: Ship, dt: number): void {
    if (!ship.alive) return;

    const dist = Math.hypot(ship.x, ship.y);
    if (dist > ARENA_RADIUS) {
      const nx = ship.x / dist;
      const ny = ship.y / dist;

      const body = ship.body as Phaser.Physics.Arcade.Body;
      const pushStrength = 900;

      // Smooth push back toward origin
      body.velocity.x -= nx * pushStrength * dt;
      body.velocity.y -= ny * pushStrength * dt;

      // Hard clamp if pushed way too far
      if (dist > ARENA_RADIUS + 80) {
        ship.setPosition(nx * (ARENA_RADIUS + 80), ny * (ARENA_RADIUS + 80));
      }
    }
  }
}
