import { beforeEach, describe, expect, mock, test } from "bun:test";

// --- Minimal Phaser mocks ---

function createMockSprite(x: number, y: number) {
	return {
		x,
		y,
		depth: 0,
		setOrigin: mock(() => {}),
		setDepth(d: number) {
			this.depth = d;
		},
		play: mock(() => {}),
		anims: {
			animationManager: {
				exists: mock(() => false),
			},
		},
	};
}

function createMockScene() {
	const sprites: ReturnType<typeof createMockSprite>[] = [];
	return {
		sprites,
		add: {
			sprite(x: number, y: number, _texture: string) {
				const s = createMockSprite(x, y);
				sprites.push(s);
				return s;
			},
		},
		anims: {
			exists: mock(() => false),
			generateFrameNames: mock(() => []),
			create: mock(() => {}),
		},
	};
}

// Phaser is mocked above via mock.module, so static imports resolve to the mock
import { CharacterManager } from "../../../src/game/characters/CharacterManager";

const SPAWN_POINTS = [
	{ name: "michael", x: 100, y: 200 },
	{ name: "dwight", x: 150, y: 250 },
	{ name: "jim", x: 200, y: 300 },
	{ name: "pam", x: 250, y: 350 },
	{ name: "angela", x: 300, y: 400 },
	{ name: "kevin", x: 350, y: 450 },
	{ name: "oscar", x: 400, y: 500 },
	{ name: "stanley", x: 450, y: 550 },
];

describe("CharacterManager", () => {
	let manager: InstanceType<typeof CharacterManager>;
	let scene: ReturnType<typeof createMockScene>;

	beforeEach(() => {
		manager = new CharacterManager();
		scene = createMockScene();
		// biome-ignore lint/suspicious/noExplicitAny: mock scene
		manager.spawnCharacters(scene as any, SPAWN_POINTS);
	});

	test("getByName returns correct character", () => {
		const michael = manager.getByName("michael");
		expect(michael).toBeDefined();
		expect(michael?.characterName).toBe("michael");

		const pam = manager.getByName("pam");
		expect(pam).toBeDefined();
		expect(pam?.characterName).toBe("pam");
	});

	test("getByName is case-insensitive", () => {
		const char = manager.getByName("Michael");
		expect(char).toBeDefined();
		expect(char?.characterName).toBe("michael");
	});

	test("getByName returns undefined for unknown name", () => {
		expect(manager.getByName("toby")).toBeUndefined();
	});

	test("assignAgent links agent ID, retrievable via getByAgentId", () => {
		manager.assignAgent("agent-1", "jim");
		const char = manager.getByAgentId("agent-1");
		expect(char).toBeDefined();
		expect(char?.characterName).toBe("jim");
	});

	test("getByAgentId returns undefined for unassigned agent", () => {
		expect(manager.getByAgentId("nonexistent")).toBeUndefined();
	});

	test("getNextAvailable returns characters in priority order (dwight, jim, pam)", () => {
		const first = manager.getNextAvailable();
		expect(first).toBeDefined();
		expect(first?.characterName).toBe("dwight");
	});

	test("getNextAvailable skips already-assigned characters", () => {
		// Assign dwight
		manager.assignAgent("agent-1", "dwight");
		const next = manager.getNextAvailable();
		expect(next).toBeDefined();
		expect(next?.characterName).toBe("jim");

		// Assign jim too
		manager.assignAgent("agent-2", "jim");
		const next2 = manager.getNextAvailable();
		expect(next2).toBeDefined();
		expect(next2?.characterName).toBe("pam");

		// Assign pam — falls back to assignmentOrder (skips michael, goes to angela)
		manager.assignAgent("agent-3", "pam");
		const next3 = manager.getNextAvailable();
		expect(next3).toBeDefined();
		expect(next3?.characterName).toBe("angela");
	});

	test("getNextAvailable returns undefined when all assigned", () => {
		const names = [
			"michael",
			"dwight",
			"jim",
			"pam",
			"angela",
			"kevin",
			"oscar",
			"stanley",
		];
		for (let i = 0; i < names.length; i++) {
			manager.assignAgent(`agent-${i}`, names[i]);
		}
		expect(manager.getNextAvailable()).toBeUndefined();
	});

	test("update() sets sprite depth to sprite y (Y-depth sorting)", () => {
		manager.update();
		// Each sprite's depth should match its y
		for (const sp of SPAWN_POINTS) {
			const char = manager.getByName(sp.name);
			expect(char).toBeDefined();
			expect(char?.sprite.depth).toBe(sp.y);
		}
		// Characters with higher y should have higher depth
		const dwight = manager.getByName("dwight")!;
		const stanley = manager.getByName("stanley")!;
		expect(stanley.sprite.depth).toBeGreaterThan(dwight.sprite.depth);
	});
});
