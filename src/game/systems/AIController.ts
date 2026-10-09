import Phaser from "phaser";
import type { ShipCommand, WeaponId } from "../types";
import type { Ship } from "../entities/Ship";

export class AIController {
  public think(me: Ship, target: Ship): ShipCommand {
    if (!me.alive || !target.alive) {
      return {
        thrust: 0,
        turn: 0,
        shield: false,
        fire: false,
        weapon: me.currentWeapon,
      };
    }

    const dist = Phaser.Math.Distance.Between(me.x, me.y, target.x, target.y);
    const toTargetAngle = Math.atan2(target.y - me.y, target.x - me.x);
    const angleDiff = Phaser.Math.Angle.Wrap(toTargetAngle - me.heading);

    // Turn toward target
    let turn = 0;
    if (Math.abs(angleDiff) > 0.06) {
      turn = Math.sign(angleDiff);
    }

    // Shield defense if hull is critically low (< 35%) and shield has energy
    const shield = (me.hull < me.def.hull * 0.35) && (me.shield > 8);

    // Distance-based maneuvers
    let thrust = 0;
    let fire = false;
    let weapon: WeaponId = "laser";

    if (dist > 520) {
      // Chase
      thrust = 1.0;
      fire = false;
      weapon = "missile";
    } else if (dist >= 240 && dist <= 520) {
      // Mid-range tactical engagement
      thrust = 0.45;
      const angleTolerance = Phaser.Math.DegToRad(14);
      fire = Math.abs(angleDiff) < angleTolerance;
      weapon = dist > 360 ? "missile" : "plasma";
    } else {
      // Close quarters dogfight
      thrust = -0.3; // Back off slightly
      const angleTolerance = Phaser.Math.DegToRad(20);
      fire = Math.abs(angleDiff) < angleTolerance;
      weapon = "laser";
    }

    return {
      thrust,
      turn,
      shield,
      fire,
      weapon,
    };
  }
}
