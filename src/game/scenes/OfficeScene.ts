import { Scene } from "phaser";
import { ClawSocketClient } from "../../network/ClawSocketClient";
import { AgentBridge } from "../bridge/AgentBridge";
import type { SpawnPoint } from "../characters/CharacterManager";
import { CharacterManager } from "../characters/CharacterManager";

export class OfficeScene extends Scene {
	private client!: ClawSocketClient;
	private characterManager!: CharacterManager;
	private bridge!: AgentBridge;
	private isDragging = false;
	private lastPointer = { x: 0, y: 0 };

	constructor() {
		super("OfficeScene");
	}

	create(): void {
		const camera = this.cameras.main;

		// --- Tilemap setup ---
		let mapLoaded = false;
		try {
			const map = this.make.tilemap({ key: "office-map" });

			// Register all 9 LimeZu tilesets
			const tilesetNames = [
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
			const tilesets: Phaser.Tilemaps.Tileset[] = [];
			for (const name of tilesetNames) {
				const ts = map.addTilesetImage(name, name);
				if (ts) tilesets.push(ts);
			}

			if (tilesets.length > 0) {
				// Create all 8 tile layers with depth ordering
				const layerConfig: [string, number][] = [
					["Ground", 0],
					["Ground Details", 1],
					["Walls", 2],
					["Walls Details", 3],
					["Same Level", 4],
					["Same Level Details", 5],
					["Above Head", 10000],
					["Above Player Details", 10001],
				];

				for (const [layerName, depth] of layerConfig) {
					const layer = map.createLayer(layerName, tilesets);
					layer?.setDepth(depth);
				}

				// Layer-based collision on Walls + Walls Details
				const wallsLayer = map.getLayer("Walls")?.tilemapLayer;
				const wallsDetailsLayer = map.getLayer("Walls Details")?.tilemapLayer;
				wallsLayer?.setCollisionByExclusion([-1, 0]);
				wallsDetailsLayer?.setCollisionByExclusion([-1, 0]);

				// Camera bounds to map size (56×30 tiles at 32px = 1792×960)
				camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
				mapLoaded = true;

				// Read spawn points from object layer (forward-compatible)
				const spawnPoints: SpawnPoint[] = [];
				const objectLayer = map.getObjectLayer("Spawns");
				if (objectLayer) {
					for (const obj of objectLayer.objects) {
						if (obj.name && obj.x != null && obj.y != null) {
							spawnPoints.push({
								name: obj.name,
								x: obj.x,
								y: obj.y,
							});
						}
					}
				}

				// Fallback spawn points (approximate desk positions from DunderMifflin.png)
				if (spawnPoints.length === 0) {
					spawnPoints.push(
						{ name: "michael", x: 160, y: 224 },
						{ name: "dwight", x: 384, y: 448 },
						{ name: "jim", x: 480, y: 448 },
						{ name: "pam", x: 1056, y: 384 },
					);
				}

				this.setupCharacters(spawnPoints);
			} else {
				this.showFallback("Tileset not found — waiting for assets");
				this.setupCharacters([]);
			}
		} catch {
			this.showFallback("Tilemap failed to load — waiting for assets");
			this.setupCharacters([]);
		}

		if (!mapLoaded) {
			// Provide a fallback camera area
			camera.setBounds(0, 0, 1024, 768);
		}

		// --- Camera controls ---
		this.setupCameraControls(camera);

		// --- Network + Bridge ---
		this.client = new ClawSocketClient();
		this.bridge = new AgentBridge(this.client, this.characterManager);
		this.client.connect();

		// Clean up on scene shutdown
		this.events.on("shutdown", () => {
			this.bridge?.destroy();
			this.client?.destroy();
		});
	}

	private setupCharacters(spawnPoints: SpawnPoint[]): void {
		this.characterManager = new CharacterManager();
		this.characterManager.spawnCharacters(this, spawnPoints);
	}

	private setupCameraControls(camera: Phaser.Cameras.Scene2D.Camera): void {
		// Mouse wheel zoom
		this.input.on(
			"wheel",
			(
				_pointer: Phaser.Input.Pointer,
				_gos: unknown[],
				_dx: number,
				_dy: number,
				dz: number,
			) => {
				const zoomStep = 0.25;
				const newZoom =
					dz > 0
						? Math.max(1, camera.zoom - zoomStep)
						: Math.min(3, camera.zoom + zoomStep);
				camera.setZoom(newZoom);
			},
		);

		// Camera drag with middle mouse or shift+left
		this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
			if (
				pointer.middleButtonDown() ||
				(pointer.leftButtonDown() && pointer.event.shiftKey)
			) {
				this.isDragging = true;
				this.lastPointer.x = pointer.x;
				this.lastPointer.y = pointer.y;
			}
		});

		this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
			if (this.isDragging) {
				const dx = this.lastPointer.x - pointer.x;
				const dy = this.lastPointer.y - pointer.y;
				camera.scrollX += dx / camera.zoom;
				camera.scrollY += dy / camera.zoom;
				this.lastPointer.x = pointer.x;
				this.lastPointer.y = pointer.y;
			}
		});

		this.input.on("pointerup", () => {
			this.isDragging = false;
		});
	}

	private showFallback(message: string): void {
		this.add
			.text(512, 384, message, {
				fontFamily: "monospace",
				fontSize: "18px",
				color: "#aaaaaa",
				align: "center",
			})
			.setOrigin(0.5);
	}

	update(): void {
		this.characterManager?.update();
	}
}
