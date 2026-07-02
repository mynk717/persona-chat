import path from "node:path";

export function parseArgs(argv) {
  const args = {};

  for (let index = 2; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

export function requireArg(args, key) {
  const value = args[key];
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required argument: --${key}`);
  }
  return value.trim();
}

export function asOptionalString(value) {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function safeBasename(filePath) {
  return path.basename(filePath).replace(/[^\w.\-]+/g, "_");
}

