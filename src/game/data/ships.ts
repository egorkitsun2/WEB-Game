import type { ShipDef, ShipId } from "../types";

export const SHIPS: Record<ShipId, ShipDef> = {
  interceptor: {
    id: "interceptor",
    label: "Перехватчик",
    hull: 80,
    shield: 40,
    shieldRegenPerSec: 8,
    accel: 420,
    maxSpeed: 340,
    turnRateDeg: 220,
    radius: 16,
    weapons: ["laser", "plasma", "missile"],
    color: 0x00d4ff,
  },
  tank: {
    id: "tank",
    label: "Танк",
    hull: 140,
    shield: 80,
    shieldRegenPerSec: 5,
    accel: 260,
    maxSpeed: 220,
    turnRateDeg: 140,
    radius: 22,
    weapons: ["laser", "plasma", "missile"],
    color: 0xffaa33,
  },
};
