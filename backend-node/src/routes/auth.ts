import { Router } from "express";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { config } from "../config/env";
import { signToken } from "../utils/jwt";
import { sanitize, sanitizeUser } from "../utils/sanitize";
import { ok, created, error } from "../utils/response";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { loginSchema, registerSchema } from "./validation-schemas";

const router = Router();

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (rows.length === 0) { error(res, "invalid credentials", 401); return; }
    const user = rows[0];
    const validPassword = user.password.startsWith("$2")
      ? await bcrypt.compare(password, user.password)
      : password === user.password;
    if (!validPassword) { error(res, "invalid credentials", 401); return; }
    const token = signToken({ userId: user.id, tenantId: user.tenant_id, email: user.email, role: user.role });
    ok(res, { token, user: sanitizeUser(user) });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/register", validate(registerSchema), async (req, res) => {
  try {
    const { email, password, name, tenantName } = req.body;
    const { rows: existing } = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.length > 0) { error(res, "email already registered", 409); return; }
    const hashedPassword = await bcrypt.hash(password, config.SALT_ROUNDS);
    const tenantId = uuid();
    const userId = uuid();
    const safeName = sanitize(name);
    const safeEmail = email.toLowerCase().trim();
    await query(
      "INSERT INTO users (id, tenant_id, email, password, name, role, status) VALUES ($1, $2, $3, $4, $5, 'admin', 'online')",
      [userId, tenantId, safeEmail, hashedPassword, safeName]
    );
    const token = signToken({ userId, tenantId, email: safeEmail, role: "admin" });
    created(res, {
      token,
      user: { id: userId, tenant_id: tenantId, email: safeEmail, name: safeName, role: "admin", status: "online" },
      tenant: { id: tenantId, name: tenantName ? sanitize(tenantName) : safeName, slug: (tenantName || name).toLowerCase().trim(), plan: "trial" },
    });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/me", auth, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (rows.length === 0) { error(res, "not found", 404); return; }
    ok(res, sanitizeUser(rows[0]));
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
