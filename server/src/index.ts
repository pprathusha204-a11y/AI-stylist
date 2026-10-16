import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat.routes";
import callbackRouter from "./routes/callback.routes";
import { deliverCallbackNotifications } from "./services/callback.service";

dotenv.config();

const app = express();
// Set only to the known number of trusted reverse-proxy hops.
if (process.env.TRUST_PROXY_HOPS) app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use("/api/callback", callbackRouter);
app.use(express.json({ limit: "8mb" }));
app.use("/api/chat", chatRouter);

app.get("/api/health", (_request, response) => {
  response.status(200).json({
    success: true,
    message: "Tech-Tailor AI backend is running",
  });
});

app.use((_request, response) => {
  response.status(404).json({
    success: false,
    message: "API route not found",
  });
});

app.listen(PORT, () => {
  console.log(
    `Tech-Tailor AI server running at http://localhost:${PORT}`,
  );
});
let notifying = false;
const notificationTimer = setInterval(async () => {
  if (notifying) return;
  notifying = true;
  try { await deliverCallbackNotifications(); } catch { console.warn("Callback outbox unavailable; check database configuration and migration."); }
  finally { notifying = false; }
}, 30000);
notificationTimer.unref();
