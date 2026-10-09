import Phaser from "phaser";
import type { ShipCommand, WeaponId } from "../types";

export class InputController {
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyUp!: Phaser.Input.Keyboard.Key;
  private keyDown!: Phaser.Input.Keyboard.Key;
  private keyLeft!: Phaser.Input.Keyboard.Key;
  private keyRight!: Phaser.Input.Keyboard.Key;

  private keyShift!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private key1!: Phaser.Input.Keyboard.Key;
  private key2!: Phaser.Input.Keyboard.Key;
  private key3!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  private scene: Phaser.Scene;
  private selectedWeapon: WeaponId = "laser";

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const kb = scene.input.keyboard;

    if (kb) {
      this.keyW = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyS = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyA = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);

      this.keyUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
      this.keyDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
      this.keyLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
      this.keyRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);

      this.keyShift = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
      this.keySpace = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.key1 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      this.key2 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      this.key3 = kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
      this.keyEsc = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }
  }

  public read(currentWeapon: WeaponId): ShipCommand {
    this.selectedWeapon = currentWeapon;

    if (this.key1?.isDown) this.selectedWeapon = "laser";
    if (this.key2?.isDown) this.selectedWeapon = "plasma";
    if (this.key3?.isDown) this.selectedWeapon = "missile";

    const thrustForward = (this.keyW?.isDown || this.keyUp?.isDown) ? 1 : 0;
    const thrustBackward = (this.keyS?.isDown || this.keyDown?.isDown) ? 1 : 0;
    const thrust = thrustForward - thrustBackward;

    const turnRight = (this.keyD?.isDown || this.keyRight?.isDown) ? 1 : 0;
    const turnLeft = (this.keyA?.isDown || this.keyLeft?.isDown) ? 1 : 0;
    const turn = turnRight - turnLeft;

    const shield = this.keyShift?.isDown ?? false;
    const isPointerDown = this.scene.input.activePointer?.isDown ?? false;
    const fire = (this.keySpace?.isDown || isPointerDown) ?? false;

    return {
      thrust,
      turn,
      shield,
      fire,
      weapon: this.selectedWeapon,
    };
  }

  public isPauseJustPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.keyEsc);
  }
}
