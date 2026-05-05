export function sanitize(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}

export function sanitizeUser(user: { password?: string; [key: string]: unknown }) {
  const { password, ...rest } = user;
  return rest;
}

export function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
