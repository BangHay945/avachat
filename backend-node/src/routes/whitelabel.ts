import { Router } from "express";
import { query } from "../db/db";
import { ok, error } from "../utils/response";
import { auth, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { whitelabelSchema } from "./validation-schemas";

const router = Router();

router.get("/", auth, adminOnly, async (_req, res) => {
  try {
    const { rows } = await query("SELECT * FROM whitelabel_settings LIMIT 1");
    if (rows.length === 0) { error(res, "not found", 404); return; }
    ok(res, rows[0]);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/", auth, adminOnly, validate(whitelabelSchema), async (req, res) => {
  try {
    const { company_name, logo_url, primary_color } = req.body;
    await query(
      "UPDATE whitelabel_settings SET company_name = COALESCE($1, company_name), logo_url = COALESCE($2, logo_url), primary_color = COALESCE($3, primary_color), updated_at = NOW() WHERE tenant_id = $4",
      [company_name, logo_url, primary_color, req.tenantId]
    );
    const { rows } = await query("SELECT * FROM whitelabel_settings WHERE tenant_id = $1", [req.tenantId]);
    ok(res, rows[0]);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
