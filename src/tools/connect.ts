import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { config } from "../config.js";
import { disconnect, isConnected, isAuthenticated } from "../ssh.js";

export function registerConnectTools(server: McpServer): void {
  // 연결 종료 Tool
  server.registerTool(
    "disconnect_server",
    {
      description: "Gateway 연결을 종료합니다.",
    },
    async () => {
      const wasConnected = isConnected();
      disconnect();
      return {
        content: [
          {
            type: "text" as const,
            text: wasConnected ? "Gateway 연결 종료됨" : "연결된 서버가 없습니다.",
          },
        ],
      };
    }
  );

  // 연결 상태 확인 Tool
  server.registerTool(
    "connection_status",
    {
      description: "현재 SSH 연결 상태를 확인합니다.",
    },
    async () => {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                gateway: {
                  host: config.gateway.host,
                  connected: isConnected(),
                },
                kerberos: {
                  authenticated: isAuthenticated(),
                },
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
