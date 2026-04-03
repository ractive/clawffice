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
			const tileset = map.addTilesetImage("office-tileset", "office-tileset");

			if (tileset) {
				const floorLayer = map.createLayer("Floor", tileset);
				const wallsLayer = map.createLayer("Walls", tileset);
				const furnitureLayer = map.createLayer("Furniture", tileset);
				const furnitureTopLayer = map.createLayer("FurnitureTop", tileset);

				if (wallsLayer) {
					wallsLayer.setCollisionByExclusion([-1]);
				}

				// Set depth ordering for layers
				floorLayer?.setDepth(0);
				wallsLayer?.setDepth(1);
				furnitureLayer?.setDepth(2);
				furnitureTopLayer?.setDepth(10000);

				// Camera bounds to map size
				camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
				mapLoaded = true;

				// Read spawn points from object layer
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
