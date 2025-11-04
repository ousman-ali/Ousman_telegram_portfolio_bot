// server.js
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import bot from "./bot/index.js";

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Webhook route
app.post(`/api/webhook/${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Test route
app.get("/", (req, res) => {
  res.send("🚀 Telegram Portfolio Bot Server Running!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
