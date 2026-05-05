import { Router } from "express";
import { query } from "../db/db";
import { sanitizeUser } from "../utils/sanitize";
import { ok, error } from "../utils/response";
import { auth } from "../middleware/auth";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM users WHERE tenant_id = $1", [req.tenantId]);
    ok(res, rows.map(sanitizeUser));
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
