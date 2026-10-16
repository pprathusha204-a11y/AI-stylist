import { Router, json, type ErrorRequestHandler } from "express";
import { z } from "zod";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { callbackServices, saveCallback, allowCallbackRequest, type CallbackDetails } from "../services/callback.service";

export const callbackSchema = z.object({
  name: z.string().trim().min(2).max(100).regex(/^[\p{L}\p{M} .'’-]+$/u),
  phone: z.string().max(25).refine(value => /^\+[1-9]\d{6,14}$/.test(value) && !!parsePhoneNumberFromString(value)?.isValid()),
  service: z.enum(callbackServices as [string, ...string[]]),
  requestId: z.uuid(),
  website: z.literal(""),
  startedAt: z.number().int().positive(),
});
export function createCallbackRouter(save: (data: CallbackDetails) => Promise<{ id: string; created: boolean }> = saveCallback, allow: (ip: string) => Promise<boolean> = allowCallbackRequest) {
  const router = Router();
  router.get("/services", (_req, res) => { res.json({ services: callbackServices }); });
  router.post("/", json({ limit: "4kb" }), async (req, res) => {
    const origin = req.get("origin");
    if (origin && origin !== (process.env.CLIENT_URL || "http://localhost:5173")) { res.status(403).json({ message: "Please submit from the company website." }); return; }
    try {
      if (!await allow(req.ip || "unknown")) { res.set("Retry-After", "900").status(429).json({ message: "Too many attempts. Please wait 15 minutes before trying again." }); return; }
    } catch { res.status(503).json({ message: "Callback requests are temporarily unavailable. Please retry shortly." }); return; }
    const parsed = callbackSchema.safeParse(req.body);
    if (!parsed.success || Date.now() - (parsed.success ? parsed.data.startedAt : Date.now()) < 1500 || (parsed.success && Date.now() - parsed.data.startedAt > 86400000)) { res.status(400).json({ message: "Please check your name, phone number and service, then try again." }); return; }
    try {
      const saved = await save(parsed.data);
      res.status(saved.created ? 201 : 200).json({ success: true, id: saved.id });
    } catch {
      console.error("Callback request could not be saved; check database connection and migration.");
      res.status(503).json({ message: "We couldn't confirm your request. Please retry in a moment." });
    }
  });
  const parseError: ErrorRequestHandler = (error, _req, res, next) => {
    if (error.type === "entity.too.large" || error.type === "entity.parse.failed") { res.status(error.type === "entity.too.large" ? 413 : 400).json({ message: "Please send only your name, phone number and selected service." }); return; }
    next(error);
  };
  router.use(parseError);
  return router;
}
export default createCallbackRouter();
