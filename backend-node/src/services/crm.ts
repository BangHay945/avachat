import { v4 as uuid } from "uuid";
import { query } from "../db/db";
import { sanitize } from "../utils/sanitize";
import type { CRContact, Deal, Campaign } from "../models/types";

// Contacts
export async function listContacts(tenantId: string, filters: { search?: string; channel?: string; segment?: string; sentiment?: string }) {
  let sql = "SELECT * FROM crm_contacts WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  let paramIdx = 2;
  if (filters.search) { sql += ` AND (name ILIKE $${paramIdx} OR phone ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`; params.push(`%${sanitize(filters.search)}%`); paramIdx++; }
  if (filters.channel && filters.channel !== "all") { sql += ` AND channel = $${paramIdx}`; params.push(filters.channel); paramIdx++; }
  if (filters.segment && filters.segment !== "all") { sql += ` AND segment = $${paramIdx}`; params.push(filters.segment); paramIdx++; }
  if (filters.sentiment && filters.sentiment !== "all") { sql += ` AND sentiment = $${paramIdx}`; params.push(filters.sentiment); paramIdx++; }
  sql += " ORDER BY updated_at DESC";
  const { rows } = await query(sql, params);
  return rows as CRContact[];
}

export async function getContact(id: string, tenantId: string) {
  const { rows } = await query("SELECT * FROM crm_contacts WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return rows.length > 0 ? (rows[0] as CRContact) : null;
}

export async function createContact(tenantId: string, data: { name: string; phone?: string; email?: string; channel?: string; segment?: string; location?: string; source?: string; tags?: string[] }) {
  const id = uuid();
  await query(
    "INSERT INTO crm_contacts (id, tenant_id, name, phone, email, channel, tags, segment, location, source, last_contact, total_chats, sentiment) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), 0, 'neutral')",
    [id, tenantId, sanitize(data.name), data.phone || null, data.email || null, data.channel || "livechat", data.tags || [], data.segment || "Lead", data.location || null, data.source || null]
  );
  return { id, tenant_id: tenantId, name: sanitize(data.name) };
}

export async function updateContact(id: string, tenantId: string, data: Record<string, unknown>) {
  const fields = ["name", "phone", "email", "channel", "tags", "segment", "location", "source", "sentiment"];
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  fields.forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = COALESCE($${idx}, ${f})`); params.push(data[f]); idx++; }
  });
  if (sets.length === 0) return false;
  sets.push(`updated_at = NOW()`);
  params.push(id, tenantId);
  const { rowCount } = await query(
    `UPDATE crm_contacts SET ${sets.join(", ")} WHERE id = $${idx} AND tenant_id = $${idx + 1}`,
    params
  );
  return rowCount! > 0;
}

export async function deleteContact(id: string, tenantId: string) {
  const { rowCount } = await query("DELETE FROM crm_contacts WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return rowCount! > 0;
}

// Deals
export async function listDeals(tenantId: string, stage?: string) {
  let sql = "SELECT * FROM crm_deals WHERE tenant_id = $1";
  const params: unknown[] = [tenantId];
  if (stage && stage !== "all") { sql += ` AND stage = $2`; params.push(stage); }
  sql += " ORDER BY updated_at DESC";
  const { rows } = await query(sql, params);
  return rows as Deal[];
}

export async function getDeal(id: string, tenantId: string) {
  const { rows } = await query("SELECT * FROM crm_deals WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return rows.length > 0 ? (rows[0] as Deal) : null;
}

export async function createDeal(tenantId: string, data: { title: string; contactId?: string; contactName?: string; value?: number; stage?: string; probability?: number; notes?: string }) {
  const id = uuid();
  await query(
    "INSERT INTO crm_deals (id, tenant_id, contact_id, contact_name, title, value, stage, probability, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
    [id, tenantId, data.contactId || "", data.contactName || "", sanitize(data.title), data.value || 0, data.stage || "lead", data.probability || 10, data.notes || ""]
  );
  return { id, tenant_id: tenantId, title: sanitize(data.title) };
}

export async function updateDeal(id: string, tenantId: string, data: Record<string, unknown>) {
  const fields = ["title", "value", "stage", "probability", "notes", "contact_name"];
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  fields.forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = COALESCE($${idx}, ${f})`); params.push(data[f]); idx++; }
  });
  if (sets.length === 0) return false;
  sets.push(`updated_at = NOW()`);
  params.push(id, tenantId);
  const { rowCount } = await query(
    `UPDATE crm_deals SET ${sets.join(", ")} WHERE id = $${idx} AND tenant_id = $${idx + 1}`,
    params
  );
  return rowCount! > 0;
}

export async function deleteDeal(id: string, tenantId: string) {
  const { rowCount } = await query("DELETE FROM crm_deals WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return rowCount! > 0;
}

// Campaigns
export async function listCampaigns(tenantId: string) {
  const { rows } = await query("SELECT * FROM campaigns WHERE tenant_id = $1 ORDER BY created_at DESC", [tenantId]);
  return rows as Campaign[];
}

export async function createCampaign(tenantId: string, data: { name: string; message: string; channel?: string; segment?: string; status?: string; scheduledAt?: string }) {
  const id = uuid();
  await query(
    "INSERT INTO campaigns (id, tenant_id, name, channel, segment, message, status, scheduled_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [id, tenantId, sanitize(data.name), data.channel || "whatsapp", data.segment || "All Customers", sanitize(data.message), data.status || "draft", data.scheduledAt || null]
  );
  return { id, tenant_id: tenantId, name: sanitize(data.name) };
}

export async function updateCampaign(id: string, tenantId: string, data: Record<string, unknown>) {
  const fields = ["name", "channel", "segment", "message", "status", "scheduled_at"];
  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  fields.forEach((f) => {
    if (data[f] !== undefined) { sets.push(`${f} = COALESCE($${idx}, ${f})`); params.push(data[f]); idx++; }
  });
  if (sets.length === 0) return false;
  sets.push(`updated_at = NOW()`);
  params.push(id, tenantId);
  const { rowCount } = await query(
    `UPDATE campaigns SET ${sets.join(", ")} WHERE id = $${idx} AND tenant_id = $${idx + 1}`,
    params
  );
  return rowCount! > 0;
}

export async function deleteCampaign(id: string, tenantId: string) {
  const { rowCount } = await query("DELETE FROM campaigns WHERE id = $1 AND tenant_id = $2", [id, tenantId]);
  return rowCount! > 0;
}
