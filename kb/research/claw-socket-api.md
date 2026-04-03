---
title: "claw-socket WebSocket API Summary"
type: research
tags: [research, api, websocket, integration]
date: 2026-04-03
---

# claw-socket API Summary

WebSocket server at `ws://localhost:3838` providing real-time Claude Code session events.

## Connection Flow
1. Connect to `ws://localhost:3838`
2. Server immediately sends `snapshot` with all current sessions and agents
3. Send `subscribe` with topic patterns to receive events
4. Events carry monotonic `seq` for replay on reconnect

## Key Events for Game

### Session Events (`session.*`)
- `session.discovered` — new session found
- `session.started` — session begins
- `session.state_changed` — session state update
- `session.removed` — session gone

### Agent Events (`agent.*`)
- `agent.started` — agent spawned (has `agentId`, `agentType`, `cwd`, `parentAgentId`)
- `agent.state_changed` — status change with full agent state array
- `agent.stopped` — agent done (has `reason`)

### Agent States: `working`, `tool_running`, `idle`, `offline`

### Agent State Object
```typescript
interface AgentState {
  agentId: string;
  agentType: string;       // "main", subagent type name
  sessionId: string;
  status: "working" | "tool_running" | "idle" | "offline";
  currentTool?: string;    // e.g. "Read", "Edit", "Bash"
  currentToolInput?: any;
  toolCount: number;
  tokenCount: number;
  cwd: string;
  toolHistory: string[];   // recent tool names
  startedAt: number;
  lastActivityAt: number;
  parentAgentId?: string;
}
```

### Tool Events (`tool.*`)
- `tool.started` — tool invocation begins (tool name, input)
- `tool.completed` — tool finished
- `tool.failed` — tool error

### Message Events (`message.*`)
- `message.user` — user prompt
- `message.assistant` — Claude response
- `message.result` — turn result

### Stream Events (`stream.*`)
- `stream.delta` — text output streaming
- `stream.thinking_delta` — thinking text
- `stream.tool_use_delta` — tool input streaming

## Client Commands
- `subscribe` — subscribe to topic patterns (e.g. `["agent.*", "tool.*"]`)
- `get_snapshot` — request current state
- `replay` — catch up after reconnect (send `lastSeq`)
- `subscribe_agent_log` — raw JSONL log for a session

## Game Integration Strategy
Subscribe to `agent.*` + `tool.*` + `session.*` to:
1. Map sessions → "The Office" (one session = one office instance)
2. Map agents → characters (main agent = Michael, subagents = team members)
3. Map agent status → character animations (working=typing, tool_running=specific action, idle=sitting)
4. Map tool usage → visual actions (Read=looking at paper, Edit=writing, Bash=typing fast)
