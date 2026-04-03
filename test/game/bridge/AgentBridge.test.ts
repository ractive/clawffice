import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { AgentState } from "../../../src/network/types";

// --- Mock ClawSocketClient ---

function createMockClient() {
	const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
	return {
		on: mock((event: string, handler: (...args: unknown[]) => void) => {
			if (!handlers.has(event)) handlers.set(event, new Set());
			handlers.get(event)?.add(handler);
		}),
		off: mock((event: string, handler: (...args: unknown[]) => void) => {
			handlers.get(event)?.delete(handler);
		}),
		emit(event: string, ...args: unknown[]) {
			const listeners = handlers.get(event);
			if (listeners) {
				for (const fn of listeners) fn(...args);
			}
		},
	};
}

// --- Mock OfficeCharacter ---

function createMockCharacter(name: string) {
	return {
		characterName: name,
		agentId: null as string | null,
		state: "idle" as string,
		assignAgent: mock(function (this: { agentId: string | null }, id: string) {
			this.agentId = id;
		}),
		unassignAgent: mock(function (this: { agentId: string | null }) {
			this.agentId = null;
		}),
		setState: mock(function (this: { state: string }, s: string) {
			this.state = s;
		}),
	};
}

// --- Mock CharacterManager ---

function createMockCharacterManager() {
	const characters = new Map<string, ReturnType<typeof createMockCharacter>>();
	const priorityOrder = [
		"dwight",
		"jim",
		"pam",
		"angela",
		"kevin",
		"oscar",
		"stanley",
	];

	// Pre-create characters
	characters.set("michael", createMockCharacter("michael"));
	for (const name of priorityOrder) {
		characters.set(name, createMockCharacter(name));
	}

	return {
		characters,
		getByName: mock((name: string) => characters.get(name.toLowerCase())),
		getByAgentId: mock((agentId: string) => {
			for (const char of characters.values()) {
				if (char.agentId === agentId) return char;
			}
			return undefined;
		}),
		getNextAvailable: mock(() => {
			for (const name of priorityOrder) {
				const char = characters.get(name);
				if (char && !char.agentId) return char;
			}
			return undefined;
		}),
		assignAgent: mock((agentId: string, characterName: string) => {
			const char = characters.get(characterName.toLowerCase());
			if (char) char.assignAgent(agentId);
		}),
	};
}

// Import AgentBridge (it only depends on types, not Phaser directly)
import { AgentBridge } from "../../../src/game/bridge/AgentBridge";

describe("AgentBridge", () => {
	let client: ReturnType<typeof createMockClient>;
	let charManager: ReturnType<typeof createMockCharacterManager>;
	let bridge: AgentBridge;

	beforeEach(() => {
		client = createMockClient();
		charManager = createMockCharacterManager();
		// biome-ignore lint/suspicious/noExplicitAny: mock objects
		bridge = new AgentBridge(client as any, charManager as any);
	});

	test("agent:start with role=main assigns to Michael", () => {
		const state: AgentState = {
			agentId: "main-1",
			status: "working",
			role: "main",
		};
		client.emit("agent:start", state);

		expect(charManager.assignAgent).toHaveBeenCalledWith("main-1", "michael");
		const michael = charManager.characters.get("michael")!;
		expect(michael.agentId).toBe("main-1");
		expect(michael.setState).toHaveBeenCalledWith("working");
	});

	test("agent:start with role=main and status=stopped sets idle", () => {
		const state: AgentState = {
			agentId: "main-1",
			status: "stopped",
			role: "main",
		};
		client.emit("agent:start", state);

		const michael = charManager.characters.get("michael")!;
		expect(michael.setState).toHaveBeenCalledWith("idle");
	});

	test("agent:start with role=sub assigns to next available (Dwight first)", () => {
		const state: AgentState = {
			agentId: "sub-1",
			status: "working",
			role: "sub",
		};
		client.emit("agent:start", state);

		expect(charManager.getNextAvailable).toHaveBeenCalled();
		const dwight = charManager.characters.get("dwight")!;
		expect(dwight.agentId).toBe("sub-1");
		expect(dwight.setState).toHaveBeenCalledWith("working");
	});

	test("agent:start with role=sub assigns Jim after Dwight is taken", () => {
		// First sub agent takes Dwight
		client.emit("agent:start", {
			agentId: "sub-1",
			status: "working",
			role: "sub",
		} satisfies AgentState);

		// Second sub agent should get Jim
		client.emit("agent:start", {
			agentId: "sub-2",
			status: "idle",
			role: "sub",
		} satisfies AgentState);

		const jim = charManager.characters.get("jim")!;
		expect(jim.agentId).toBe("sub-2");
	});

	test("agent:start with role=sub assigns Pam after Dwight and Jim are taken", () => {
		client.emit("agent:start", {
			agentId: "sub-1",
			status: "working",
			role: "sub",
		} satisfies AgentState);
		client.emit("agent:start", {
			agentId: "sub-2",
			status: "working",
			role: "sub",
		} satisfies AgentState);
		client.emit("agent:start", {
			agentId: "sub-3",
			status: "working",
			role: "sub",
		} satisfies AgentState);

		const pam = charManager.characters.get("pam")!;
		expect(pam.agentId).toBe("sub-3");
	});

	test("agent:update updates character state correctly", () => {
		// First assign a character
		client.emit("agent:start", {
			agentId: "sub-1",
			status: "idle",
			role: "sub",
		} satisfies AgentState);

		const dwight = charManager.characters.get("dwight")!;
		dwight.setState.mockClear();

		// Now update
		client.emit("agent:update", {
			agentId: "sub-1",
			status: "tool_running",
			role: "sub",
		} satisfies AgentState);

		expect(charManager.getByAgentId).toHaveBeenCalledWith("sub-1");
		expect(dwight.setState).toHaveBeenCalledWith("tool_running");
	});

	test("agent:update with status=stopped does not call setState", () => {
		client.emit("agent:start", {
			agentId: "sub-1",
			status: "working",
			role: "sub",
		} satisfies AgentState);

		const dwight = charManager.characters.get("dwight")!;
		dwight.setState.mockClear();

		client.emit("agent:update", {
			agentId: "sub-1",
			status: "stopped",
			role: "sub",
		} satisfies AgentState);

		expect(dwight.setState).not.toHaveBeenCalled();
	});

	test("agent:stop sets character to idle and unassigns", () => {
		// Start an agent
		client.emit("agent:start", {
			agentId: "sub-1",
			status: "working",
			role: "sub",
		} satisfies AgentState);

		const dwight = charManager.characters.get("dwight")!;
		dwight.setState.mockClear();

		// Stop the agent
		client.emit("agent:stop", "sub-1");

		expect(charManager.getByAgentId).toHaveBeenCalledWith("sub-1");
		expect(dwight.setState).toHaveBeenCalledWith("idle");
		expect(dwight.unassignAgent).toHaveBeenCalled();
		expect(dwight.agentId).toBeNull();
	});

	test("agent:stop for unknown agent is a no-op", () => {
		// Should not throw
		client.emit("agent:stop", "nonexistent");
		expect(charManager.getByAgentId).toHaveBeenCalledWith("nonexistent");
	});

	test("destroy removes all event listeners", () => {
		bridge.destroy();
		expect(client.off).toHaveBeenCalledTimes(3);
	});
});
