import type { Scene } from "phaser";
import { OfficeCharacter } from "./OfficeCharacter";

/** Default character roster in assignment priority order */
const CHARACTER_NAMES = [
	"michael",
	"dwight",
	"jim",
	"pam",
	"angela",
	"kevin",
	"oscar",
	"stanley",
];

export interface SpawnPoint {
	name: string;
	x: number;
	y: number;
}

export class CharacterManager {
	private characters = new Map<string, OfficeCharacter>();
	private assignmentOrder: string[] = [];

	spawnCharacters(scene: Scene, spawnPoints: SpawnPoint[]): void {
		// Build a lookup of spawn points by name (lowercased)
		const spawnMap = new Map<string, SpawnPoint>();
		for (const sp of spawnPoints) {
			spawnMap.set(sp.name.toLowerCase(), sp);
		}

		for (const name of CHARACTER_NAMES) {
			const sp = spawnMap.get(name);
			// If no spawn point for this character, place in a default grid position
			const x = sp?.x ?? 100 + this.characters.size * 80;
			const y = sp?.y ?? 400;

			const character = new OfficeCharacter(scene, x, y, name);
			this.characters.set(name, character);
			this.assignmentOrder.push(name);
		}
	}

	getByName(name: string): OfficeCharacter | undefined {
		return this.characters.get(name.toLowerCase());
	}

	getByAgentId(agentId: string): OfficeCharacter | undefined {
		for (const char of this.characters.values()) {
			if (char.agentId === agentId) return char;
		}
		return undefined;
	}

	assignAgent(agentId: string, characterName: string): void {
		const char = this.getByName(characterName);
		if (char) {
			char.assignAgent(agentId);
		}
	}

	getNextAvailable(): OfficeCharacter | undefined {
		// Priority: dwight, jim, pam, then rest
		const priority = ["dwight", "jim", "pam"];
		for (const name of priority) {
			const char = this.characters.get(name);
			if (char && !char.agentId) return char;
		}
		// Fall back to any unassigned
		for (const name of this.assignmentOrder) {
			const char = this.characters.get(name);
			if (char && !char.agentId) return char;
		}
		return undefined;
	}

	/** Call each frame for Y-depth sorting */
	update(): void {
		for (const char of this.characters.values()) {
			char.sprite.setDepth(char.sprite.y);
		}
	}
}
