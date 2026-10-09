export type WeaponId = "laser" | "plasma" | "missile";
export type Faction = "player" | "enemy";
export type ShipId = "interceptor" | "tank";

export interface WeaponDef {
  id: WeaponId;
  label: string;
  damage: number;
  cooldownMs: number;
  speed: number;
  lifetimeMs: number;
  radius: number;
  spreadDeg: number;
  homing: number; // 0 = нет, 0.04 = слабое наведение ракеты
  color: number;
}

export interface ShipDef {
  id: ShipId;
  label: string;
  hull: number;
  shield: number;
  shieldRegenPerSec: number;
  accel: number;
  maxSpeed: number;
  turnRateDeg: number;
  radius: number;
  weapons: WeaponId[];
  color: number;
}

export interface CombatResult {
  won: boolean;
  score: number;
  shipId: ShipId;
  enemiesKilled: number;
  hullRemaining: number;
  shieldRemaining: number;
}

export interface ShipCommand {
  thrust: number;   // -1..1 (газ / тормоз)
  turn: number;     // -1..1 (поворот)
  shield: boolean;  // удержание щита
  fire: boolean;    // огонь
  weapon: WeaponId; // текущее оружие
}
