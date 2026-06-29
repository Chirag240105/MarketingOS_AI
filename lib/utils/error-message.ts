type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : undefined;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function fromObject(value: unknown): string | undefined {
  const object = asObject(value);
  if (!object) return undefined;
  const error = asObject(object.error);
  return firstString(
    object.error_user_msg,
    object.message,
    error?.error_user_msg,
    error?.message,
    error?.error_user_title,
  );
}

export function toReadableErrorMessage(value: unknown): string {
  if (value instanceof Error) return toReadableErrorMessage(value.message);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return fromObject(parsed) || value;
    } catch {
      return value;
    }
  }
  return fromObject(value) || "Something went wrong.";
}
