// Art assets: LimeZu Modern Office + Modern Interiors (https://limezu.itch.io)
import { AUTO, Game } from "phaser";
import { Boot } from "./scenes/Boot";
import { OfficeScene } from "./scenes/OfficeScene";
import { Preloader } from "./scenes/Preloader";

const config: Phaser.Types.Core.GameConfig = {
	type: AUTO,
	width: 1024,
	height: 768,
	parent: "game-container",
	backgroundColor: "#2d2d2d",
	pixelArt: true,
	roundPixels: true,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { x: 0, y: 0 },
		},
	},
	scene: [Boot, Preloader, OfficeScene],
};

const StartGame = (parent: string) => {
	return new Game({ ...config, parent });
};

export default StartGame;
