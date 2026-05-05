import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { error } from "../utils/response";
import type { UserClaims } from "../models/types";

declare global {
  namespace Express {
    interface Request {
      user: UserClaims;
      tenantId: string;
      userId: string;
      role: UserClaims["role"];
    }
  }
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    error(res, "missing authorization", 401);
    return;
  }
  try {
    const token = header.split(" ")[1];
    const claims = verifyToken(token);
    req.user = claims;
    req.tenantId = claims.tenantId;
    req.userId = claims.userId;
    req.role = claims.role;
    next();
  } catch {
    error(res, "invalid token", 401);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.role)) {
      error(res, "insufficient permissions", 403);
      return;
    }
    next();
  };
}

export const adminOnly = requireRole("admin");
export const adminOrSupervisor = requireRole("admin", "supervisor");
