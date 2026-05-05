import { Router } from "express";
import { ok } from "../utils/response";
import { linkClicks } from "./campaign";

const router = Router();

// Click tracker for campaign links
router.post("/click", (req, res) => {
  const { campaignId, link } = req.body;
  if (!campaignId || !link) { res.status(400).json({ error: "campaignId and link required" }); return; }
  if (!linkClicks[campaignId]) linkClicks[campaignId] = [];
  linkClicks[campaignId].push({ campaignId, link, clickedAt: new Date().toISOString(), ip: req.ip });
  ok(res, { status: "ok" });
});

export default router;
