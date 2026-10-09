import Phaser from "phaser";
import type { Faction, WeaponId } from "../types";
import { ARENA_RADIUS } from "../data/constants";
import type { Ship } from "./Ship";

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  public weaponId: WeaponId;
  public faction: Faction;
  public damage: number;
  public speed: number;
  public homing: number;
  public target: Ship | null = null;
  public bornAt: number;
  public lifetimeMs: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    weaponId: WeaponId,
    faction: Faction,
    damage: number,
    speed: number,
    lifetimeMs: number,
    radius: number,
    homing: number,
    angleRad: number,
    bornAt: number,
    target: Ship | null = null
  ) {
    super(scene, x, y, texture);

    this.weaponId = weaponId;
    this.faction = faction;
    this.damage = damage;
    this.speed = speed;
    this.lifetimeMs = lifetimeMs;
    this.homing = homing;
    this.bornAt = bornAt;
    this.target = target;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(radius, (this.width / 2) - radius, (this.height / 2) - radius);
    body.setCollideWorldBounds(false);

    // Initial velocity
    body.velocity.x = Math.cos(angleRad) * speed;
    body.velocity.y = Math.sin(angleRad) * speed;
    this.rotation = angleRad;
  }

  public update(time: number): void {
    if (!this.active) return;

    if (time - this.bornAt > this.lifetimeMs) {
      this.destroy();
      return;
    }

    if (Math.hypot(this.x, this.y) > ARENA_RADIUS * 1.25) {
      this.destroy();
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.homing > 0 && this.target && this.target.alive) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.001) {
        const desiredX = (dx / dist) * this.speed;
        const desiredY = (dy / dist) * this.speed;

        body.velocity.x += (desiredX - body.velocity.x) * this.homing;
        body.velocity.y += (desiredY - body.velocity.y) * this.homing;

        // Maintain constant speed
        const currentSpeed = body.velocity.length();
        if (currentSpeed > 0) {
          body.velocity.scale(this.speed / currentSpeed);
        }

        this.rotation = Math.atan2(body.velocity.y, body.velocity.x);
      }
    }
  }
}
