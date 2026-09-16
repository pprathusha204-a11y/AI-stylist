import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat.routes";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3001;
const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
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