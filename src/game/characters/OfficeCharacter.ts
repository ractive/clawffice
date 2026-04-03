import type { GameObjects, Scene } from "phaser";

export type CharacterState = "idle" | "working" | "tool_running";

export class OfficeCharacter {
	readonly sprite: GameObjects.Sprite;
	readonly characterName: string;
	private _agentId: string | null = null;
	private _state: CharacterState = "idle";

	get agentId(): string | null {
		return this._agentId;
	}

	get state(): CharacterState {
		return this._state;
	}

	constructor(scene: Scene, x: number, y: number, characterName: string) {
		this.characterName = characterName;

		this.sprite = scene.add.sprite(x, y, "characters");
		this.sprite.setOrigin(0.5, 1);

		this.createAnimations(scene);
		this.setState("idle");
	}

	private createAnimations(scene: Scene): void {
		const name = this.characterName;
		const anims = scene.anims;

		const idleKey = `${name}-idle-sit`;
		if (!anims.exists(idleKey)) {
			const idleFrames = anims.generateFrameNames("characters", {
				prefix: `${name}-idle-sit-`,
				start: 0,
				end: 3,
				zeroPad: 0,
			});
			// Only create if frames exist in the atlas
			if (idleFrames.length > 0) {
				anims.create({
					key: idleKey,
					frames: idleFrames,
					frameRate: 4,
					repeat: -1,
				});
			}
		}

		const typingKey = `${name}-typing`;
		if (!anims.exists(typingKey)) {
			const typingFrames = anims.generateFrameNames("characters", {
				prefix: `${name}-typing-`,
				start: 0,
				end: 3,
				zeroPad: 0,
			});
			if (typingFrames.length > 0) {
				anims.create({
					key: typingKey,
					frames: typingFrames,
					frameRate: 6,
					repeat: -1,
				});
			}
		}
	}

	setState(state: CharacterState): void {
		this._state = state;

		const animMap: Record<CharacterState, string> = {
			idle: `${this.characterName}-idle-sit`,
			working: `${this.characterName}-typing`,
			tool_running: `${this.characterName}-typing`,
		};

		const animKey = animMap[state];
		this.playAnimation(animKey);
	}

	playAnimation(name: string): void {
		if (this.sprite.anims.animationManager.exists(name)) {
			this.sprite.play(name, true);
		}
	}

	assignAgent(agentId: string): void {
		this._agentId = agentId;
	}

	unassignAgent(): void {
		this._agentId = null;
	}
}
