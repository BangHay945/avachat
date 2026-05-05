import { Router } from "express";
import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { sanitize } from "../utils/sanitize";
import { ok, created, error } from "../utils/response";
import { auth, adminOrSupervisor } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { broadcast } from "../websocket/hub";
import { cannedSchema, cannedUpdateSchema } from "./validation-schemas";

const router = Router();

router.get("/", auth, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = "SELECT * FROM canned_responses WHERE tenant_id = $1";
    const params: unknown[] = [req.tenantId];
    if (category && category !== "all") { sql += ` AND category = $2`; params.push(category); }
    sql += " ORDER BY category, title";
    const { rows } = await query(sql, params);
    ok(res, rows);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/", auth, adminOrSupervisor, validate(cannedSchema), async (req, res) => {
  try {
    const id = uuid();
    const title = sanitize(req.body.title);
    const content = sanitize(req.body.content);
    const shortcut = req.body.shortcut || `/${title.toLowerCase().replace(/\s+/g, "-")}`;
    const category = req.body.category ? sanitize(req.body.category) : "umum";
    await query(
      "INSERT INTO canned_responses (id, tenant_id, title, content, shortcut, category) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, req.tenantId, title, content, shortcut, category]
    );
    const item = { id, tenant_id: req.tenantId, title, content, shortcut, category };
    broadcast("all", { type: "canned_created", canned: item, timestamp: new Date().toISOString() });
    created(res, item);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/:id", auth, adminOrSupervisor, validate(cannedUpdateSchema), async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM canned_responses WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenantId]);
    if (rows.length === 0) { error(res, "not found", 404); return; }
    const { title, content, shortcut, category } = req.body;
    await query(
      "UPDATE canned_responses SET title = COALESCE($1, title), content = COALESCE($2, content), shortcut = COALESCE($3, shortcut), category = COALESCE($4, category), updated_at = NOW() WHERE id = $5",
      [title, content, shortcut, category, req.params.id]
    );
    broadcast("all", { type: "canned_updated", canned: { id: req.params.id }, timestamp: new Date().toISOString() });
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.delete("/:id", auth, adminOrSupervisor, async (req, res) => {
  try {
    const { rowCount } = await query("DELETE FROM canned_responses WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenantId]);
    if (rowCount === 0) { error(res, "not found", 404); return; }
    broadcast("all", { type: "canned_deleted", cannedId: req.params.id, timestamp: new Date().toISOString() });
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
