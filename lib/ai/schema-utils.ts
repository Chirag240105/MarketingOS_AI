import { z } from "zod";

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean).join("; ");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["text", "value", "summary", "insight", "description", "name", "title", "content", "message"]) {
      const normalized = stringifyValue(record[key]);
      if (normalized) return normalized;
    }
    return Object.entries(record)
      .map(([key, entry]) => {
        const normalized = stringifyValue(entry);
        return normalized ? `${key}: ${normalized}` : "";
      })
      .filter(Boolean)
      .join("; ");
  }
  return "";
}

function arrayValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(arrayValue).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,(?=\s*\S)|;(?=\s*\S)/)
      .map((entry) => entry.replace(/^[-*\u2022\d.)\s]+/, "").trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["items", "list", "points", "values", "differentiators", "opportunities", "risks", "messages", "pillars", "scenes"]) {
      if (key in record) return arrayValue(record[key]);
    }
    return Object.values(record).flatMap(arrayValue).filter(Boolean);
  }
  const normalized = stringifyValue(value);
  return normalized ? [normalized] : [];
}

export const aiString = z.preprocess((value) => stringifyValue(value), z.string());

export function aiOptionalString() {
  return z.preprocess((value) => {
    const normalized = stringifyValue(value);
    return normalized || undefined;
  }, z.string().optional());
}

export function aiStringArray(min = 0) {
  return z.preprocess((value) => arrayValue(value), z.array(z.string()).min(min));
}

export const aiBoolean = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return ["true", "yes", "approved", "pass", "safe"].includes(value.trim().toLowerCase());
  return Boolean(value);
}, z.boolean());

export const aiConfidence = z.preprocess((value) => {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  if (typeof parsed === "number" && parsed > 1 && parsed <= 100) return parsed / 100;
  return parsed;
}, z.number().min(0).max(1).catch(0.75));

export function aiEnum<const T extends readonly [string, ...string[]]>(values: T, aliases: Partial<Record<string, T[number]>> = {}) {
  return z.preprocess((value) => {
    const normalized = stringifyValue(value).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return aliases[normalized] || normalized;
  }, z.enum(values));
}
