#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "./config.js";
import { registerAllTools } from "./tools/index.js";
import { disconnect } from "./ssh.js";

// MCP 서버 생성
const server = new McpServer({
  name: "nhn-server-mcp",
  version: "1.0.0",
});

// 모든 도구 등록
registerAllTools(server);

// 서버 시작
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("NHN Server MCP 시작됨");
  console.error(`Gateway: ${config.gateway.username}@${config.gateway.host}:${config.gateway.port}`);
  console.error(`허용 호스트: ${config.hosts.allowedHosts.length > 0 ? config.hosts.allowedHosts.join(", ") : "(제한 없음)"}`);
  console.error(`허용 명령어: ${config.commands.allowedCommands.join(", ")}`);
  if (Object.keys(config.serverInfo).length > 0) {
    console.error(`서버 정보 로드됨`);
  }
}

// 종료 처리
process.on("SIGINT", () => {
  disconnect();
  process.exit(0);
});

process.on("SIGTERM", () => {
  disconnect();
  process.exit(0);
});

main().catch((error) => {
  console.error("서버 시작 실패:", error);
  process.exit(1);
});
