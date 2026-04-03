import type { ClawSocketClient } from "../../network/ClawSocketClient";
import type { AgentState } from "../../network/types";
import type { CharacterManager } from "../characters/CharacterManager";

export class AgentBridge {
	private onStart: (state: AgentState) => void;
	private onUpdate: (state: AgentState) => void;
	private onStop: (agentId: string) => void;

	constructor(
		private client: ClawSocketClient,
		private characters: CharacterManager,
	) {
		this.onStart = (state: AgentState) => this.handleStart(state);
		this.onUpdate = (state: AgentState) => this.handleUpdate(state);
		this.onStop = (agentId: string) => this.handleStop(agentId);

		this.client.on("agent:start", this.onStart);
		this.client.on("agent:update", this.onUpdate);
		this.client.on("agent:stop", this.onStop);
	}

	private handleStart(state: AgentState): void {
		if (state.role === "main") {
			this.characters.assignAgent(state.agentId, "michael");
			const michael = this.characters.getByName("michael");
			michael?.setState(state.status === "stopped" ? "idle" : state.status);
		} else {
			const char = this.characters.getNextAvailable();
			if (char) {
				char.assignAgent(state.agentId);
				char.setState(state.status === "stopped" ? "idle" : state.status);
			}
		}
	}

	private handleUpdate(state: AgentState): void {
		const char = this.characters.getByAgentId(state.agentId);
		if (!char) return;
		if (state.status === "stopped") {
			char.setState("idle");
			char.unassignAgent();
		} else {
			char.setState(state.status);
		}
	}

	private handleStop(agentId: string): void {
		const char = this.characters.getByAgentId(agentId);
		if (char) {
			char.setState("idle");
			char.unassignAgent();
		}
	}

	destroy(): void {
		this.client.off("agent:start", this.onStart);
		this.client.off("agent:update", this.onUpdate);
		this.client.off("agent:stop", this.onStop);
	}
}
