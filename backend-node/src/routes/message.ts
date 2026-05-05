import { Router } from "express";
import { query } from "../db/db";
import { ok, created, error } from "../utils/response";
import { auth } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { sendMessage, getMessages } from "../services/message";
import { sendToChannel } from "../services/channel-service";
import { broadcast } from "../websocket/hub";
import { sendMessageSchema } from "./validation-schemas";

const router = Router();

router.get("/:convId/messages", auth, async (req, res) => {
  try {
    const msgs = await getMessages(req.params.convId);
    ok(res, msgs);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

router.post("/:convId/messages", auth, validate(sendMessageSchema), async (req, res) => {
  try {
    const { rows: userRows } = await query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (userRows.length === 0) { error(res, "unauthorized", 401); return; }
    const user = userRows[0];
    const msg = await sendMessage(req.params.convId, user.id, user.name, req.body.content, req.body.type);
    broadcast(req.params.convId, { type: "new_message", message: msg, timestamp: new Date().toISOString() });

    // Deliver to channel (Telegram, etc)
    sendToChannel(req.params.convId, req.body.content).then((sent) => {
      if (sent) console.log(`📤 Delivered to channel`);
    }).catch(() => {});

    created(res, msg);
  } catch (err) { console.error(err); error(res, "internal server error", 500); }
});

export default router;
