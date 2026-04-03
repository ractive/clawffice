import { Scene } from "phaser";

export class Preloader extends Scene {
	constructor() {
		super("Preloader");
	}

	init(): void {
		// Loading bar outline
		this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);

		// Loading bar fill
		const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

		this.load.on("progress", (progress: number) => {
			bar.width = 4 + 460 * progress;
		});
	}

	preload(): void {
		// Tileset
		this.load.image("office-tileset", "assets/tiles/office-tileset.png");

		// Tilemap
		this.load.tilemapTiledJSON("office-map", "assets/tiles/office-map.json");

		// Character spritesheet atlas
		this.load.atlas(
			"characters",
			"assets/sprites/characters.png",
			"assets/sprites/characters.json",
		);
	}

	create(): void {
		this.scene.start("OfficeScene");
	}
}
