import type {
	AgentState,
	ClawSocketEventName,
	ClawSocketEvents,
	ClawSocketMessage,
} from "./types";

type Listener<K extends ClawSocketEventName> = ClawSocketEvents[K];

const DEMO_AGENTS: AgentState[] = [
	{ agentId: "demo-main", status: "idle", role: "main", name: "Main Agent" },
	{
		agentId: "demo-sub-1",
		status: "idle",
		role: "sub",
		name: "Sub Agent 1",
	},
	{
		agentId: "demo-sub-2",
		status: "idle",
		role: "sub",
		name: "Sub Agent 2",
	},
	{
		agentId: "demo-sub-3",
		status: "idle",
		role: "sub",
		name: "Sub Agent 3",
	},
];

const DEMO_STATUSES: AgentState["status"][] = [
	"idle",
	"working",
	"tool_running",
];

export class ClawSocketClient {
	private ws: WebSocket | null = null;
	private listeners = new Map<
		ClawSocketEventName,
		Set<Listener<ClawSocketEventName>>
	>();
	private reconnectDelay = 1000;
	private reconnectAttempts = 0;
	private maxReconnectDelay = 30000;
	private maxAttemptsBeforeDemo = 3;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private demoTimer: ReturnType<typeof setInterval> | null = null;
	private demoMode = false;
	private demoTickIndex = 0;
	private _connected = false;
	private destroyed = false;

	get connected(): boolean {
		return this._connected;
	}

	constructor(private url = "ws://localhost:3838") {}

	connect(): void {
		if (this.destroyed || this.demoMode) return;

		// Close existing socket if any
		if (this.ws) {
			this.ws.onclose = null;
			this.ws.onerror = null;
			this.ws.close();
			this.ws = null;
		}

		// Clear any pending reconnect timer
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		try {
			this.ws = new WebSocket(this.url);
		} catch {
			this.handleConnectionFailure();
			return;
		}

		this.ws.onopen = () => {
			this._connected = true;
			this.reconnectDelay = 1000;
			this.reconnectAttempts = 0;
			this.emit("connection:change", true);

			this.ws?.send(
				JSON.stringify({
					type: "subscribe",
					patterns: ["agent.*", "tool.*", "session.*"],
				}),
			);
		};

		this.ws.onmessage = (event) => {
			try {
				const msg = JSON.parse(event.data as string) as ClawSocketMessage;
				this.handleMessage(msg);
			} catch {
				// Ignore malformed messages
			}
		};

		this.ws.onclose = () => {
			const wasConnected = this._connected;
			this._connected = false;
			if (wasConnected) {
				this.emit("connection:change", false);
			}
			this.scheduleReconnect();
		};

		this.ws.onerror = () => {
			// onclose will fire after onerror, so reconnect is handled there
		};
	}

	private handleMessage(msg: ClawSocketMessage): void {
		if (!msg.type || !msg.agentId) return;

		const state: AgentState = {
			agentId: msg.agentId,
			status: msg.status ?? "idle",
			role: msg.role ?? "sub",
			name: msg.name,
			currentTool: msg.currentTool,
		};

		switch (msg.type) {
			case "agent.started":
				this.emit("agent:start", state);
				break;
			case "agent.stopped":
				this.emit("agent:stop", msg.agentId);
				break;
			case "agent.updated":
			case "tool.started":
			case "tool.completed":
				this.emit("agent:update", state);
				break;
		}
	}

	private handleConnectionFailure(): void {
		this.scheduleReconnect();
	}

	private scheduleReconnect(): void {
		if (this.destroyed || this.demoMode) return;

		this.reconnectAttempts++;
		if (this.reconnectAttempts >= this.maxAttemptsBeforeDemo) {
			this.startDemoMode();
			return;
		}

		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
		}

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connect();
		}, this.reconnectDelay);

		this.reconnectDelay = Math.min(
			this.reconnectDelay * 2,
			this.maxReconnectDelay,
		);
	}

	private startDemoMode(): void {
		this.demoMode = true;
		this._connected = false;
		this.emit("connection:change", false);

		// Emit initial agent starts
		for (const agent of DEMO_AGENTS) {
			this.emit("agent:start", { ...agent });
		}

		// Cycle through states every 3 seconds
		this.demoTimer = setInterval(() => {
			this.demoTickIndex++;
			for (let i = 0; i < DEMO_AGENTS.length; i++) {
				const agent = DEMO_AGENTS[i];
				const statusIndex = (this.demoTickIndex + i) % DEMO_STATUSES.length;
				const status = DEMO_STATUSES[statusIndex];
				this.emit("agent:update", { ...agent, status });
			}
		}, 3000);
	}

	on<K extends ClawSocketEventName>(
		event: K,
		listener: ClawSocketEvents[K],
	): void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		this.listeners.get(event)?.add(listener as Listener<ClawSocketEventName>);
	}

	off<K extends ClawSocketEventName>(
		event: K,
		listener: ClawSocketEvents[K],
	): void {
		this.listeners
			.get(event)
			?.delete(listener as Listener<ClawSocketEventName>);
	}

	private emit<K extends ClawSocketEventName>(
		event: K,
		...args: Parameters<ClawSocketEvents[K]>
	): void {
		const listeners = this.listeners.get(event);
		if (!listeners) return;
		for (const listener of listeners) {
			(listener as (...a: unknown[]) => void)(...args);
		}
	}

	destroy(): void {
		this.destroyed = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.demoTimer) {
			clearInterval(this.demoTimer);
			this.demoTimer = null;
		}
		if (this.ws) {
			this.ws.onclose = null;
			this.ws.onerror = null;
			this.ws.onmessage = null;
			this.ws.onopen = null;
			this.ws.close();
			this.ws = null;
		}
		this._connected = false;
		this.listeners.clear();
	}
}
