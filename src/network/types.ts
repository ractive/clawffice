export interface AgentState {
	agentId: string;
	status: "idle" | "working" | "tool_running" | "stopped";
	role: "main" | "sub";
	name?: string;
	currentTool?: string;
}

export interface ClawSocketEvents {
	"agent:update": (state: AgentState) => void;
	"agent:start": (state: AgentState) => void;
	"agent:stop": (agentId: string) => void;
	"connection:change": (connected: boolean) => void;
}

export type ClawSocketEventName = keyof ClawSocketEvents;

export interface ClawSocketMessage {
	type: string;
	agentId?: string;
	status?: AgentState["status"];
	role?: AgentState["role"];
	name?: string;
	currentTool?: string;
	[key: string]: unknown;
}
