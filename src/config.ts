import { readFileSync } from "fs";

// Gateway SSH 설정
export interface GatewayConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

// 명령어 설정
export interface CommandConfig {
  allowedCommands: string[];
  blockedPatterns: string[]; // 차단할 패턴 목록
}

// Kerberos 설정
export interface KerberosConfig {
  password: string;
}

// 호스트 설정
export interface HostConfig {
  allowedHosts: string[];
}

// 서버 정보 (AI에게 노출되는 정보)
export interface ServerInfo {
  [key: string]: unknown;
}

// 전체 설정
export interface Config {
  gateway: GatewayConfig;
  kerberos: KerberosConfig;
  hosts: HostConfig;
  commands: CommandConfig;
  serverInfo: ServerInfo;
}

// CONFIG_FILE 로드
function loadConfigFile(): Record<string, unknown> {
  const configPath = process.env.CONFIG_FILE;
  if (!configPath) {
    return {};
  }
  try {
    const content = readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("CONFIG_FILE 읽기 실패:", err);
    return {};
  }
}

// Gateway 설정 파싱
function parseGatewayConfig(configFile: Record<string, unknown>): GatewayConfig {
  const connection = (configFile.gatewayConnection as string) || "root@localhost:22";
  const password = (configFile.gatewayPassword as string) || "";

  const match = connection.match(/^([^@]+)@([^:]+)(?::(\d+))?$/);
  if (!match) {
    throw new Error(
      `잘못된 gatewayConnection 형식: ${connection} (올바른 형식: user@host:port)`
    );
  }

  return {
    username: match[1],
    host: match[2],
    port: parseInt(match[3] || "22", 10),
    password,
  };
}

// Kerberos 설정 파싱
function parseKerberosConfig(configFile: Record<string, unknown>): KerberosConfig {
  return {
    password: (configFile.kinitPassword as string) || "",
  };
}

// 호스트 설정 파싱
function parseHostConfig(configFile: Record<string, unknown>): HostConfig {
  let allowedHosts: string[] = [];
  if (Array.isArray(configFile.allowedHosts)) {
    allowedHosts = configFile.allowedHosts as string[];
  }

  return {
    allowedHosts,
  };
}

// 명령어 설정 파싱
function parseCommandConfig(configFile: Record<string, unknown>): CommandConfig {
  const defaultAllowed = [
    "tail", "head", "cat", "grep", "less", "more", "zcat", "zgrep",
    "ls", "pwd", "whoami", "hostname", "uptime",
    "df", "du", "free", "top", "ps", "htop",
    "netstat", "ss", "ping", "curl", "wget",
    "date", "wc", "sort", "uniq", "awk", "sed", "cut",
    "find", "which", "echo", "journalctl",
    "systemctl status", "docker ps", "docker logs",
  ];

  // 기본 차단 패턴 (보안)
  const defaultBlockedPatterns = [
    ">",      // 리다이렉션
    "`",      // 백틱
    "$(",     // 서브쉘
    ";",      // 명령어 체이닝
    "&&",     // AND 체이닝
    "||",     // OR 체이닝
  ];

  let allowedCommands: string[] = defaultAllowed;
  if (Array.isArray(configFile.allowedCommands)) {
    allowedCommands = configFile.allowedCommands as string[];
  }

  let blockedPatterns: string[] = defaultBlockedPatterns;
  if (Array.isArray(configFile.blockedPatterns)) {
    blockedPatterns = configFile.blockedPatterns as string[];
  }

  return {
    allowedCommands,
    blockedPatterns,
  };
}

// serverInfo 파싱 (AI에게 노출되는 정보)
function parseServerInfo(configFile: Record<string, unknown>): ServerInfo {
  const serverInfo = configFile.serverInfo as Record<string, unknown> | undefined;
  return serverInfo || {};
}

// 전체 설정 로드
export function loadConfig(): Config {
  const configFile = loadConfigFile();

  return {
    gateway: parseGatewayConfig(configFile),
    kerberos: parseKerberosConfig(configFile),
    hosts: parseHostConfig(configFile),
    commands: parseCommandConfig(configFile),
    serverInfo: parseServerInfo(configFile),
  };
}

export let config = loadConfig();

// config 재로드
export function reloadConfig(): void {
  config = loadConfig();
  console.error("설정 재로드 완료");
}
