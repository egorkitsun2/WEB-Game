import Phaser from "phaser";
import { Ship } from "../entities/Ship";
import { Projectile } from "../entities/Projectile";
import { WEAPONS } from "../data/weapons";
import type { WeaponId } from "../types";
import { SoundSystem } from "./SoundSystem";
import { VfxSystem } from "./VfxSystem";

export class CombatSystem {
  private scene: Phaser.Scene;
  private projectiles: Phaser.Physics.Arcade.Group;
  private ships: Phaser.Physics.Arcade.Group;
  private sound: SoundSystem;
  private vfx: VfxSystem;
  private onShipDestroyed: (deadShip: Ship) => void;

  constructor(
    scene: Phaser.Scene,
    projectiles: Phaser.Physics.Arcade.Group,
    ships: Phaser.Physics.Arcade.Group,
    vfx: VfxSystem,
    onShipDestroyed: (deadShip: Ship) => void
  ) {
    this.scene = scene;
    this.projectiles = projectiles;
    this.ships = ships;
    this.sound = SoundSystem.getInstance();
    this.vfx = vfx;
    this.onShipDestroyed = onShipDestroyed;

    this.setupCollisions();
  }

  private setupCollisions(): void {
    this.scene.physics.add.overlap(
      this.projectiles,
      this.ships,
      (projObj, shipObj) => {
        const proj = projObj as Projectile;
        const ship = shipObj as Ship;

        if (!proj.active || !ship.active || !ship.alive) return;
        if (proj.faction === ship.faction) return;

        const { dead, absorbed } = ship.takeDamage(proj.damage);

        if (absorbed > 0) {
          this.vfx.createShieldRipple(ship.x, ship.y, ship.def.radius + 6);
          this.sound.playShieldAbsorb();
        }

        this.vfx.createHitSparks(proj.x, proj.y, WEAPONS[proj.weaponId]?.color ?? 0xffffff);
        this.sound.playHit();

        proj.destroy();

        if (dead) {
          this.vfx.createExplosion(ship.x, ship.y, ship.def.radius * 1.5);
          this.sound.playExplosion();
          this.onShipDestroyed(ship);
        }
      }
    );
  }

  public canFire(ship: Ship, now: number): boolean {
    const weaponDef = WEAPONS[ship.currentWeapon];
    if (!weaponDef) return false;
    return now - ship.lastShotAt >= weaponDef.cooldownMs;
  }

  public fire(ship: Ship, now: number, potentialTargets: Ship[]): void {
    if (!this.canFire(ship, now)) return;

    const weapon = WEAPONS[ship.currentWeapon];
    if (!weapon) return;

    ship.lastShotAt = now;

    // Calculate spread
    const spreadRad = Phaser.Math.DegToRad(weapon.spreadDeg);
    const angleOffset = Phaser.Math.FloatBetween(-spreadRad, spreadRad);
    const fireAngle = ship.heading + angleOffset;

    // Spawn at ship nose
    const spawnDist = ship.def.radius + weapon.radius + 4;
    const spawnX = ship.x + Math.cos(ship.heading) * spawnDist;
    const spawnY = ship.y + Math.sin(ship.heading) * spawnDist;

    // Target search for homing missiles
    let homingTarget: Ship | null = null;
    if (weapon.homing > 0) {
      let closestDist = Infinity;
      for (const target of potentialTargets) {
        if (target.alive && target.faction !== ship.faction) {
          const d = Phaser.Math.Distance.Between(ship.x, ship.y, target.x, target.y);
          if (d < closestDist) {
            closestDist = d;
            homingTarget = target;
          }
        }
      }
    }

    const proj = new Projectile(
      this.scene,
      spawnX,
      spawnY,
      `proj-${weapon.id}`,
      weapon.id,
      ship.faction,
      weapon.damage,
      weapon.speed,
      weapon.lifetimeMs,
      weapon.radius,
      weapon.homing,
      fireAngle,
      now,
      homingTarget
    );

    this.projectiles.add(proj);

    // Play weapon sound
    if (weapon.id === "laser") {
      this.sound.playLaser();
    } else if (weapon.id === "plasma") {
      this.sound.playPlasma();
    } else if (weapon.id === "missile") {
      this.sound.playMissile();
    }
  }

  public update(time: number): void {
    this.projectiles.getChildren().forEach((child) => {
      const proj = child as Projectile;
      if (proj.active) {
        proj.update(time);
      }
    });
  }
}
