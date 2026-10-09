import Phaser from "phaser";
import { Ship } from "../entities/Ship";
import { SHIPS } from "../data/ships";
import { ARENA_RADIUS } from "../data/constants";
import type { CombatResult, ShipId } from "../types";
import { InputController } from "../systems/InputController";
import { CombatSystem } from "../systems/CombatSystem";
import { AIController } from "../systems/AIController";
import { ArenaBounds } from "../systems/ArenaBounds";
import { Hud } from "../systems/Hud";
import { VfxSystem } from "../systems/VfxSystem";

export class ArenaScene extends Phaser.Scene {
  private playerShipId: ShipId = "interceptor";
  private player!: Ship;
  private enemies: Ship[] = [];
  private totalEnemies: number = 0;
  private killedEnemiesCount: number = 0;

  private inputController!: InputController;
  private combatSystem!: CombatSystem;
  private aiController!: AIController;
  private arenaBounds!: ArenaBounds;
  private hud!: Hud;
  private vfx!: VfxSystem;

  private isMatchOver: boolean = false;

  constructor() {
    super("arena");
  }

  init(data: { shipId?: ShipId }): void {
    this.playerShipId = data.shipId || "interceptor";
    this.enemies = [];
    this.killedEnemiesCount = 0;
    this.isMatchOver = false;
  }

  create(): void {
    // 1. Create Parallax Starfield Background
    this.createStarfield();

    // 2. Arena Boundary Visuals and Logic
    this.arenaBounds = new ArenaBounds(this);
    this.vfx = new VfxSystem(this);

    // 3. Physics Groups
    const playerGroup = this.physics.add.group();
    const enemiesGroup = this.physics.add.group();
    const allShipsGroup = this.physics.add.group();
    const projectilesGroup = this.physics.add.group();

    // 4. Create Player Ship at (0, 0)
    const playerDef = SHIPS[this.playerShipId];
    const playerTexture = `ship-${this.playerShipId}-player`;
    this.player = new Ship(this, 0, 0, playerTexture, playerDef, "player");
    playerGroup.add(this.player);
    allShipsGroup.add(this.player);

    // 5. Create AI Enemy Squadron (3 enemies: 2 Interceptors, 1 Tank)
    const enemySpawns = [
      { id: "interceptor" as ShipId, x: -650, y: -450 },
      { id: "tank" as ShipId, x: 750, y: 150 },
      { id: "interceptor" as ShipId, x: -200, y: 700 },
    ];

    this.totalEnemies = enemySpawns.length;

    enemySpawns.forEach((spawn) => {
      const def = SHIPS[spawn.id];
      const texture = `ship-${spawn.id}-enemy`;
      const enemy = new Ship(this, spawn.x, spawn.y, texture, def, "enemy");
      // Face towards player at spawn
      enemy.heading = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
      enemy.rotation = enemy.heading;

      this.enemies.push(enemy);
      enemiesGroup.add(enemy);
      allShipsGroup.add(enemy);
    });

    // 6. Controllers and Systems
    this.inputController = new InputController(this);
    this.aiController = new AIController();

    this.combatSystem = new CombatSystem(
      this,
      projectilesGroup,
      allShipsGroup,
      this.vfx,
      (deadShip) => this.handleShipDestroyed(deadShip)
    );

    this.hud = new Hud(this);

    // 7. Camera follow configuration
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(
      -ARENA_RADIUS - 300,
      -ARENA_RADIUS - 300,
      (ARENA_RADIUS + 300) * 2,
      (ARENA_RADIUS + 300) * 2
    );
  }

  private createStarfield(): void {
    // Background deep space
    const bg = this.add.graphics();
    bg.fillStyle(0x040810, 1);
    bg.fillRect(
      -ARENA_RADIUS - 500,
      -ARENA_RADIUS - 500,
      (ARENA_RADIUS + 500) * 2,
      (ARENA_RADIUS + 500) * 2
    );

    // Star layers with parallax
    const starCount = 140;
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(-ARENA_RADIUS, ARENA_RADIUS);
      const y = Phaser.Math.Between(-ARENA_RADIUS, ARENA_RADIUS);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 0.9);
      const color = Phaser.Math.RND.pick([0xffffff, 0x88ddff, 0xffeedd, 0x00ffff]);

      const star = this.add.circle(x, y, size, color, alpha);
      const scrollFactor = Phaser.Math.FloatBetween(0.3, 0.7);
      star.setScrollFactor(scrollFactor);
    }
  }

  update(time: number, delta: number): void {
    // Check pause request
    if (this.inputController.isPauseJustPressed()) {
      this.scene.pause();
      this.scene.launch("pause", { shipId: this.playerShipId });
      return;
    }

    const dt = delta / 1000;

    // 1. Player Step
    if (this.player.alive) {
      const playerCmd = this.inputController.read(this.player.currentWeapon);
      this.player.applyCommand(playerCmd, dt);

      if (playerCmd.fire) {
        this.combatSystem.fire(this.player, time, this.enemies);
      }

      this.arenaBounds.clamp(this.player, dt);
    }

    // 2. AI Enemies Step
    this.enemies.forEach((enemy) => {
      if (enemy.alive) {
        const aiCmd = this.aiController.think(enemy, this.player);
        enemy.applyCommand(aiCmd, dt);

        if (aiCmd.fire) {
          this.combatSystem.fire(enemy, time, [this.player]);
        }

        this.arenaBounds.clamp(enemy, dt);
      }
    });

    // 3. Combat System Step
    this.combatSystem.update(time);

    // 4. Tactical HUD Step
    this.hud.sync(this.player, this.enemies, time);

    // 5. Match Outcome Verification
    this.checkMatchConditions();
  }

  private handleShipDestroyed(deadShip: Ship): void {
    if (deadShip.faction === "enemy") {
      this.killedEnemiesCount++;
    }
  }

  private checkMatchConditions(): void {
    if (this.isMatchOver) return;

    // Defeat Condition
    if (!this.player.alive) {
      this.isMatchOver = true;
      const score = this.killedEnemiesCount * 100;

      this.time.delayedCall(1200, () => {
        const result: CombatResult = {
          won: false,
          score,
          shipId: this.playerShipId,
          enemiesKilled: this.killedEnemiesCount,
          hullRemaining: 0,
          shieldRemaining: 0,
        };
        this.scene.start("result", result);
      });
      return;
    }

    // Victory Condition
    const allEnemiesDead = this.enemies.every((e) => !e.alive);
    if (allEnemiesDead && this.totalEnemies > 0) {
      this.isMatchOver = true;
      const score =
        this.killedEnemiesCount * 100 +
        Math.floor(this.player.hull) +
        Math.floor(this.player.shield);

      this.time.delayedCall(1200, () => {
        const result: CombatResult = {
          won: true,
          score,
          shipId: this.playerShipId,
          enemiesKilled: this.killedEnemiesCount,
          hullRemaining: this.player.hull,
          shieldRemaining: this.player.shield,
        };
        this.scene.start("result", result);
      });
    }
  }
}
