import { Router } from "express";
import { query } from "../db/db";
import { ok, error } from "../utils/response";
import { auth, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { daysFromNow } from "../utils/sanitize";
import { PLAN_PRICES, PLAN_FEATURES } from "../models/types";
import type { Subscription, SubscriptionPlan, Invoice } from "../models/types";
import { subscriptionPlanSchema } from "./validation-schemas";

const router = Router();

router.get("/", auth, adminOnly, async (req, res) => {
  try {
    let { rows } = await query("SELECT * FROM subscriptions WHERE tenant_id = $1", [req.tenantId]);
    if (rows.length === 0) {
      const trialEnd = daysFromNow(14);
      await query(
        "INSERT INTO subscriptions (tenant_id, plan, status, trial_start, trial_end, billing_period, auto_renew) VALUES ($1, 'trial', 'active', NOW(), $2, 'monthly', true)",
        [req.tenantId, trialEnd]
      );
      rows = (await query("SELECT * FROM subscriptions WHERE tenant_id = $1", [req.tenantId])).rows;
    }
    const sub = rows[0] as Subscription;
    const trialDaysLeft = Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / 86400000));
    const price = PLAN_PRICES[sub.plan];
    ok(res, {
      ...sub,
      trialDaysLeft,
      price: sub.plan === "enterprise" ? "Custom" : price[sub.billing_period as "monthly" | "yearly"],
      priceMonthly: price.monthly,
      features: PLAN_FEATURES[sub.plan],
    });
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.put("/plan", auth, adminOnly, validate(subscriptionPlanSchema), async (req, res) => {
  try {
    await query(
      "INSERT INTO subscriptions (tenant_id, plan, status, billing_period, auto_renew, updated_at) VALUES ($1, $2, 'active', $3, true, NOW()) ON CONFLICT (tenant_id) DO UPDATE SET plan = $2, status = 'active', billing_period = COALESCE($3, subscriptions.billing_period), auto_renew = true, updated_at = NOW()",
      [req.tenantId, req.body.plan, req.body.billingPeriod || "monthly"]
    );
    const { rows } = await query("SELECT * FROM subscriptions WHERE tenant_id = $1", [req.tenantId]);
    ok(res, rows[0]);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/cancel", auth, adminOnly, async (req, res) => {
  try {
    await query("UPDATE subscriptions SET status = 'cancelled', auto_renew = false, updated_at = NOW() WHERE tenant_id = $1", [req.tenantId]);
    const { rows } = await query("SELECT * FROM subscriptions WHERE tenant_id = $1", [req.tenantId]);
    if (rows.length === 0) { error(res, "no subscription", 404); return; }
    ok(res, rows[0]);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/reactivate", auth, adminOnly, async (req, res) => {
  try {
    await query("UPDATE subscriptions SET status = 'active', auto_renew = true, updated_at = NOW() WHERE tenant_id = $1", [req.tenantId]);
    const { rows } = await query("SELECT * FROM subscriptions WHERE tenant_id = $1", [req.tenantId]);
    if (rows.length === 0) { error(res, "no subscription", 404); return; }
    ok(res, rows[0]);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.get("/invoices", auth, adminOnly, async (req, res) => {
  try {
    const { rows } = await query("SELECT id, tenant_id, date, amount, status, description FROM invoices WHERE tenant_id = $1 ORDER BY date DESC", [req.tenantId]);
    ok(res, rows.map((inv: Invoice) => ({ ...inv, amountFormatted: `Rp ${inv.amount.toLocaleString("id-ID")}` })));
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
