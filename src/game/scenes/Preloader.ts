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
		// Tilesets (9 LimeZu sheets used by the DunderMifflin map)
		const tilesets = [
			"1_Generic_32x32",
			"2_LivingRoom_32x32",
			"3_Bathroom_32x32",
			"12_Kitchen_32x32",
			"18_Jail_32x32",
			"19_Hospital_32x32",
			"Modern_Office_Shadowless_32x32",
			"Room_Builder_32x32",
			"Room_Builder_Office_32x32",
		];
		for (const name of tilesets) {
			this.load.image(name, `assets/tiles/${name}.png`);
		}

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
