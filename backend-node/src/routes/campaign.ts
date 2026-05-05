import { Router } from "express";
import { ok, created, error } from "../utils/response";
import { auth, adminOrSupervisor } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { listCampaigns, createCampaign, updateCampaign, deleteCampaign } from "../services/crm";
import { query } from "../db/db";
import { campaignSchema, campaignUpdateSchema, trackClickSchema } from "./validation-schemas";

const router = Router();
const linkClicks: Record<string, { campaignId: string; link: string; clickedAt: string; ip?: string }[]> = {};

router.get("/", auth, adminOrSupervisor, async (req, res) => {
  try {
    const campaigns = await listCampaigns(req.tenantId);
    ok(res, campaigns);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/", auth, adminOrSupervisor, validate(campaignSchema), async (req, res) => {
  try {
    const campaign = await createCampaign(req.tenantId, req.body);
    created(res, campaign);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/:id", auth, adminOrSupervisor, validate(campaignUpdateSchema), async (req, res) => {
  try {
    const updated = await updateCampaign(req.params.id, req.tenantId, req.body);
    if (!updated) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.delete("/:id", auth, adminOrSupervisor, async (req, res) => {
  try {
    const deleted = await deleteCampaign(req.params.id, req.tenantId);
    if (!deleted) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/:id/tracking", auth, adminOrSupervisor, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM campaigns WHERE id = $1 AND tenant_id = $2", [req.params.id, req.tenantId]);
    if (rows.length === 0) { error(res, "not found", 404); return; }
    const campaign = rows[0];
    const clicks = linkClicks[req.params.id] || [];
    const uniqueClicks = new Set(clicks.map((c) => c.link)).size;
    const openRate = campaign.delivered > 0 ? Math.round((campaign.opened / campaign.delivered) * 100) : 0;
    const clickRate = campaign.delivered > 0 ? Math.round((clicks.length / campaign.delivered) * 100) : 0;
    ok(res, {
      campaignId: campaign.id, totalSent: campaign.sent, totalDelivered: campaign.delivered, totalOpened: campaign.opened,
      totalClicks: clicks.length, uniqueClicks, openRate, clickRate,
      links: [...new Set(clicks.map((c) => c.link))],
    });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export { linkClicks };
export default router;
