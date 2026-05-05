import type { Response } from "express";

export function ok(res: Response, data: unknown, status = 200) {
  res.status(status).json(data);
}

export function created(res: Response, data: unknown) {
  res.status(201).json(data);
}

export function error(res: Response, message: string, status: number, details?: unknown) {
  res.status(status).json({ error: { code: status, message, details } });
}
