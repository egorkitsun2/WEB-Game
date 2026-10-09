import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { ArenaScene } from "./scenes/ArenaScene";
import { PauseScene } from "./scenes/PauseScene";
import { ResultScene } from "./scenes/ResultScene";

import { GAME_WIDTH, GAME_HEIGHT } from "./data/constants";

export { GAME_WIDTH, GAME_HEIGHT };

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#05070c",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, ArenaScene, PauseScene, ResultScene],
};
