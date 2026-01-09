import { config } from "./config.js";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// 명령어 검증 함수
export function validateCommand(command: string): ValidationResult {
  const trimmed = command.trim();

  // config에서 차단 패턴 가져오기
  for (const pattern of config.commands.blockedPatterns) {
    if (trimmed.includes(pattern)) {
      return { valid: false, reason: `차단된 패턴: ${pattern}` };
    }
  }

  // 파이프로 분리된 각 명령어 검증
  const parts = trimmed.split(/\s*\|\s*/);
  for (const part of parts) {
    const baseCommand = part.trim().split(/\s+/)[0];
    const isAllowed = config.commands.allowedCommands.some((allowed) => {
      if (allowed.includes(" ")) {
        return part.trim().startsWith(allowed);
      }
      return baseCommand === allowed;
    });

    if (!isAllowed) {
      return { valid: false, reason: `허용되지 않은 명령어: ${baseCommand}` };
    }
  }

  return { valid: true };
}
