import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { executeCommand, isHostAllowed } from "../ssh.js";
import { validateCommand } from "../commands.js";
import { config } from "../config.js";

export function registerExecTools(server: McpServer): void {
  // 명령어 실행 Tool
  server.registerTool(
    "exec",
    {
      description: "서버에서 명령어를 실행합니다.",
      inputSchema: {
        host: z.string().describe("명령어를 실행할 서버 호스트명"),
        user: z.string().describe("SSH 접속 사용자명 (예: irteam, irteamsu)"),
        command: z.string().describe("실행할 명령어 (화이트리스트 명령어만 허용)"),
      },
    },
    async ({ host, user, command }) => {
      // 호스트 허용 여부 확인
      if (!isHostAllowed(host)) {
        const allowedList = config.hosts.allowedHosts.join(", ") || "(제한 없음)";
        return {
          content: [
            {
              type: "text" as const,
              text: `허용되지 않은 호스트: ${host}\n허용된 호스트: ${allowedList}`,
            },
          ],
          isError: true,
        };
      }

      // 명령어 검증
      const validation = validateCommand(command);
      if (!validation.valid) {
        return {
          content: [
            {
              type: "text" as const,
              text: `명령어 차단됨: ${validation.reason}`,
            },
          ],
          isError: true,
        };
      }

      try {
        const { stdout, stderr } = await executeCommand(host, user, command);

        const parts: string[] = [];
        if (stdout) {
          parts.push(`[stdout]\n${stdout.trim()}`);
        }
        if (stderr) {
          parts.push(`[stderr]\n${stderr.trim()}`);
        }

        return {
          content: [
            {
              type: "text" as const,
              text: parts.length > 0 ? parts.join("\n\n") : "(출력 없음)",
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `명령 실행 실패: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
