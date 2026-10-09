import Phaser from "phaser";
import type { Faction, ShipCommand, ShipDef, WeaponId } from "../types";
import { DRAG, SHIELD_DRAIN_PER_SEC, SHIELD_MOVE_MUL } from "../data/constants";

export class Ship extends Phaser.Physics.Arcade.Sprite {
  public faction: Faction;
  public def: ShipDef;
  public hull: number;
  public shield: number;
  public alive: boolean = true;
  public heading: number = -Math.PI / 2; // Facing upwards by default
  public shieldUp: boolean = false;
  public currentWeapon: WeaponId = "laser";
  public lastShotAt: number = 0;

  // Visual effects attached to the ship
  private shieldGlow: Phaser.GameObjects.Arc;
  private thrusterGlow: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, def: ShipDef, faction: Faction) {
    super(scene, x, y, texture);

    this.def = def;
    this.faction = faction;
    this.hull = def.hull;
    this.shield = def.shield;
    this.currentWeapon = def.weapons[0] || "laser";

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(def.radius, (this.width / 2) - def.radius, (this.height / 2) - def.radius);
    body.setAllowRotation(false);
    body.setDamping(false);
    body.setCollideWorldBounds(false);

    // Visual shield bubble
    this.shieldGlow = scene.add.circle(x, y, def.radius + 6, 0x00f0ff, 0.25);
    this.shieldGlow.setStrokeStyle(2, 0x33ffff, 0.85);
    this.shieldGlow.setVisible(false);
    this.shieldGlow.setDepth(this.depth + 1);

    // Visual thruster trail glow
    this.thrusterGlow = scene.add.circle(x, y, 5, faction === "player" ? 0x00ccff : 0xff5533, 0.8);
    this.thrusterGlow.setVisible(false);
    this.thrusterGlow.setDepth(this.depth - 1);

    this.rotation = this.heading;
  }

  public applyCommand(cmd: ShipCommand, dt: number): void {
    if (!this.alive) return;

    // Apply rotation
    this.heading += cmd.turn * Phaser.Math.DegToRad(this.def.turnRateDeg) * dt;
    this.rotation = this.heading;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const acc = this.def.accel * (this.shieldUp ? SHIELD_MOVE_MUL : 1);

    // Apply thrust or brake
    if (cmd.thrust > 0) {
      body.velocity.x += Math.cos(this.heading) * acc * dt * cmd.thrust;
      body.velocity.y += Math.sin(this.heading) * acc * dt * cmd.thrust;
      this.thrusterGlow.setVisible(true);
      const trailX = this.x - Math.cos(this.heading) * (this.def.radius + 4);
      const trailY = this.y - Math.sin(this.heading) * (this.def.radius + 4);
      this.thrusterGlow.setPosition(trailX, trailY);
      this.thrusterGlow.setScale(Phaser.Math.FloatBetween(0.8, 1.4));
    } else if (cmd.thrust < 0) {
      body.velocity.scale(Math.max(0, 1 - DRAG * 3.5 * dt));
      this.thrusterGlow.setVisible(false);
    } else {
      body.velocity.scale(Math.max(0, 1 - DRAG * dt));
      this.thrusterGlow.setVisible(false);
    }

    // Limit maximum speed
    const speed = body.velocity.length();
    if (speed > this.def.maxSpeed) {
      body.velocity.scale(this.def.maxSpeed / speed);
    }

    // Shield management
    if (cmd.shield && this.shield > 0) {
      this.shieldUp = true;
      this.shield = Math.max(0, this.shield - SHIELD_DRAIN_PER_SEC * dt);
      this.shieldGlow.setVisible(true);
      this.shieldGlow.setPosition(this.x, this.y);
    } else {
      this.shieldUp = false;
      this.shield = Math.min(this.def.shield, this.shield + this.def.shieldRegenPerSec * dt);
      this.shieldGlow.setVisible(false);
    }

    if (cmd.weapon) {
      this.currentWeapon = cmd.weapon;
    }
  }

  public takeDamage(amount: number): { dead: boolean; absorbed: number } {
    if (!this.alive) return { dead: false, absorbed: 0 };

    let absorbed = 0;
    if (this.shieldUp && this.shield > 0) {
      absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed;
      amount -= absorbed;
    }

    this.hull -= amount;

    if (this.hull <= 0) {
      this.hull = 0;
      this.alive = false;
      this.shieldUp = false;
      this.shieldGlow.setVisible(false);
      this.thrusterGlow.setVisible(false);
      this.setActive(false).setVisible(false);
      (this.body as Phaser.Physics.Arcade.Body).stop();
      return { dead: true, absorbed };
    }

    return { dead: false, absorbed };
  }

  public destroy(fromScene?: boolean): void {
    if (this.shieldGlow) this.shieldGlow.destroy();
    if (this.thrusterGlow) this.thrusterGlow.destroy();
    super.destroy(fromScene);
  }
}
