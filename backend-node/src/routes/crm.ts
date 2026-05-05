import { Router } from "express";
import { query } from "../db/db";
import { sanitize } from "../utils/sanitize";
import { ok, created, error } from "../utils/response";
import { auth, adminOrSupervisor } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { listContacts, getContact, createContact, updateContact, deleteContact, listDeals, getDeal, createDeal, updateDeal, deleteDeal } from "../services/crm";
import type { CRContact } from "../models/types";
import { contactSchema, contactUpdateSchema, dealSchema, dealUpdateSchema } from "./validation-schemas";

const router = Router();

// Contacts
router.get("/contacts", auth, adminOrSupervisor, async (req, res) => {
  try {
    const contacts = await listContacts(req.tenantId, {
      search: req.query.search as string,
      channel: req.query.channel as string,
      segment: req.query.segment as string,
      sentiment: req.query.sentiment as string,
    });
    ok(res, contacts);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/contacts/:id", auth, adminOrSupervisor, async (req, res) => {
  try {
    const contact = await getContact(req.params.id, req.tenantId);
    if (!contact) { error(res, "not found", 404); return; }
    ok(res, contact);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/contacts", auth, adminOrSupervisor, validate(contactSchema), async (req, res) => {
  try {
    const contact = await createContact(req.tenantId, req.body);
    created(res, contact);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/contacts/:id", auth, adminOrSupervisor, validate(contactUpdateSchema), async (req, res) => {
  try {
    const updated = await updateContact(req.params.id, req.tenantId, req.body);
    if (!updated) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.delete("/contacts/:id", auth, adminOrSupervisor, async (req, res) => {
  try {
    const deleted = await deleteContact(req.params.id, req.tenantId);
    if (!deleted) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

// Segmentation
router.get("/segments", auth, adminOrSupervisor, async (req, res) => {
  try {
    const { rows } = await query("SELECT * FROM crm_contacts WHERE tenant_id = $1", [req.tenantId]);
    const segmentMap = new Map<string, { count: number; sentiment: Record<string, number> }>();
    rows.forEach((c: CRContact) => {
      const seg = c.segment || "Uncategorized";
      if (!segmentMap.has(seg)) segmentMap.set(seg, { count: 0, sentiment: { positive: 0, neutral: 0, negative: 0 } });
      const entry = segmentMap.get(seg)!;
      entry.count++;
      entry.sentiment[c.sentiment]++;
    });
    const segmentsArray = Array.from(segmentMap.entries()).map(([segment, data]) => ({ segment, ...data }));
    const allTags = new Set<string>();
    rows.forEach((c: CRContact) => c.tags?.forEach((t: string) => allTags.add(t)));
    ok(res, { segments: segmentsArray, total: rows.length, tags: Array.from(allTags) });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

// Deals
router.get("/deals", auth, adminOrSupervisor, async (req, res) => {
  try {
    const deals = await listDeals(req.tenantId, req.query.stage as string);
    ok(res, deals);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/deals/:id", auth, adminOrSupervisor, async (req, res) => {
  try {
    const deal = await getDeal(req.params.id, req.tenantId);
    if (!deal) { error(res, "not found", 404); return; }
    ok(res, deal);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/deals", auth, adminOrSupervisor, validate(dealSchema), async (req, res) => {
  try {
    const deal = await createDeal(req.tenantId, req.body);
    created(res, deal);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/deals/:id", auth, adminOrSupervisor, validate(dealUpdateSchema), async (req, res) => {
  try {
    const updated = await updateDeal(req.params.id, req.tenantId, req.body);
    if (!updated) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.delete("/deals/:id", auth, adminOrSupervisor, async (req, res) => {
  try {
    const deleted = await deleteDeal(req.params.id, req.tenantId);
    if (!deleted) { error(res, "not found", 404); return; }
    ok(res, { status: "ok" });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
