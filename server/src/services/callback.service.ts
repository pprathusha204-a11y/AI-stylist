import { createPool, type RowDataPacket } from "mysql2/promise";
import nodemailer from "nodemailer";
import { randomUUID, createHash } from "node:crypto";

export const callbackServices = ["Virtual Try-On", "Measurement Help", "Customize Design", "Order Support", "Corporate Orders"];
export type CallbackDetails = { name: string; phone: string; service: string; requestId: string };
let pool: ReturnType<typeof createPool> | undefined;
export function callbackDatabase() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) throw new Error("Callback database is not configured");
  return pool ??= createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 5, timezone: "Z" });
}
export async function allowCallbackRequest(ip: string): Promise<boolean> {
  const db = callbackDatabase();
  const key = createHash("sha256").update(ip).digest("hex");
  const window = Math.floor(Date.now() / 900000);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("INSERT INTO callback_rate_limits (rate_key, window_start, attempts) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE attempts = IF(window_start = VALUES(window_start), attempts + 1, 1), window_start = VALUES(window_start)", [key, window]);
    const [rows] = await connection.execute<RowDataPacket[]>("SELECT attempts FROM callback_rate_limits WHERE rate_key = ?", [key]);
    await connection.commit();
    return rows[0].attempts <= 5;
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
export async function saveCallback(details: CallbackDetails): Promise<{ id: string; created: boolean }> {
  const db = callbackDatabase();
  const id = randomUUID();
  // The unique request key also protects retries after an interrupted response.
  await db.execute("INSERT INTO callback_requests (id, request_key, name, phone, service) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE request_key = request_key", [id, details.requestId, details.name, details.phone, details.service]);
  const [rows] = await db.execute<RowDataPacket[]>("SELECT id, name, phone, service FROM callback_requests WHERE request_key = ?", [details.requestId]);
  const saved = rows[0];
  if (!saved || saved.name !== details.name || saved.phone !== details.phone || saved.service !== details.service) throw new Error("Request key conflict");
  return { id: saved.id, created: saved.id === id };
}
export async function notifyCallback(details: CallbackDetails, id: string) {
  if (!process.env.SMTP_HOST || !process.env.CALLBACK_NOTIFY_TO || !process.env.SMTP_FROM) throw new Error("Callback email is not configured");
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined, connectionTimeout: 10000, socketTimeout: 15000 });
  const result = await transport.sendMail({ from: process.env.SMTP_FROM, to: process.env.CALLBACK_NOTIFY_TO, subject: "Tech-Tailor: new callback request", text: `Request: ${id}\nName: ${details.name}\nPhone: ${details.phone}\nService: ${details.service}\nStatus: Pending\nReceived: ${new Date().toISOString()}` });
  if (!result.accepted.length || result.rejected.length) throw new Error("Notification recipient rejected");
}
// Durable email outbox: the request remains saved even when SMTP is unavailable.
export async function deliverCallbackNotifications() {
  const db = callbackDatabase();
  const connection = await db.getConnection();
  try {
    await connection.execute("DELETE FROM callback_rate_limits WHERE window_start < ?", [Math.floor(Date.now() / 900000) - 96]);
    const [locks] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK('callback_notifications', 0) AS acquired");
    if (!locks[0]?.acquired) return;
    try {
      const [rows] = await connection.query<RowDataPacket[]>("SELECT id, request_key, name, phone, service FROM callback_requests WHERE notification_status = 'Pending' AND (notification_attempted_at IS NULL OR notification_attempted_at < UTC_TIMESTAMP() - INTERVAL 5 MINUTE) ORDER BY created_at LIMIT 10");
      for (const row of rows) {
        await connection.execute("UPDATE callback_requests SET notification_attempted_at = UTC_TIMESTAMP(), notification_attempts = notification_attempts + 1 WHERE id = ?", [row.id]);
        try {
          await notifyCallback({ name: row.name, phone: row.phone, service: row.service, requestId: row.request_key }, row.id);
          await connection.execute("UPDATE callback_requests SET notification_status = 'Sent' WHERE id = ?", [row.id]);
        } catch { console.warn("Callback notification pending; check server SMTP configuration."); }
      }
    } finally { await connection.query("SELECT RELEASE_LOCK('callback_notifications')"); }
  } finally { connection.release(); }
}
