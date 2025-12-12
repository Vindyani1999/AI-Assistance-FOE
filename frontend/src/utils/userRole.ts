export type UserRole =
  | "undergraduate"
  | "lecturer"
  | "administration"
  | "invalid";

const LECTURER_DOMAINS = new Set([
  "cee.ruh.ac.lk",
  "mme.ruh.ac.lk",
  "eie.ruh.ac.lk",
  "is.ruh.ac.lk",
]);

function safeEmail(email?: string | null): string | null {
  if (!email || typeof email !== "string") return null;
  const e = email.trim().toLowerCase();
  if (!e) return null;
  return e;
}

export function ensureValidRuhEmail(email?: string | null): boolean {
  const e = safeEmail(email);
  if (!e) return false;
  const parts = e.split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return domain.endsWith("ruh.ac.lk");
}

export function getUserRole(email?: string | null): UserRole {
  const e = safeEmail(email);
  if (!e) return "invalid";

  const parts = e.split("@");
  if (parts.length !== 2) return "invalid";
  const local = parts[0];
  const domain = parts[1];

  if (!domain.endsWith("ruh.ac.lk")) return "invalid";

  if (e.includes("engug") || local.includes("engug")) return "undergraduate";

  if (LECTURER_DOMAINS.has(domain)) return "lecturer";

  return "administration";
}

export function isUndergraduate(email?: string | null): boolean {
  return getUserRole(email) === "undergraduate";
}

export function isLecturer(email?: string | null): boolean {
  return getUserRole(email) === "lecturer";
}

const userRoleUtils = {
  getUserRole,
  isUndergraduate,
  isLecturer,
  ensureValidRuhEmail,
};

export default userRoleUtils;
