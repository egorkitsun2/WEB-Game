import Phaser from "phaser";
import { gameConfig } from "./game/config";

// Initialize Phaser 3 Game instance
window.addEventListener("DOMContentLoaded", () => {
  new Phaser.Game(gameConfig);
});
