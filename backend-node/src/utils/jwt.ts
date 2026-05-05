import jwt from "jsonwebtoken";
import { config } from "../config/env";
import type { UserClaims } from "../models/types";

export function signToken(claims: Omit<UserClaims, "iat" | "exp">): string {
  return jwt.sign(
    { userId: claims.userId, tenantId: claims.tenantId, email: claims.email, role: claims.role },
    config.JWT_SECRET,
    { expiresIn: "24h" }
  );
}

export function verifyToken(token: string): UserClaims {
  const decoded = jwt.verify(token, config.JWT_SECRET) as { userId: string; tenantId: string; email: string; role: string };
  return {
    userId: decoded.userId,
    tenantId: decoded.tenantId,
    email: decoded.email,
    role: decoded.role as UserClaims["role"],
  };
}
