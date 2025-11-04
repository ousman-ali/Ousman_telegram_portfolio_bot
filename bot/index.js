// bot/index.js
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webhookUrl = `${process.env.WEBHOOK_URL}/${token}`;

// ✅ Initialize bot in webhook mode
const bot = new TelegramBot(token, { webHook: true });

// ✅ Register webhook URL
await bot.setWebHook(webhookUrl);

// Temporary in-memory storage for user form states
const userStates = {}; // { chatId: { step, name, email, message } }

// /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  console.log("Chat ID:", chatId);

  bot.sendMessage(
    chatId,
    `👋 Hello ${msg.from.first_name}!\nWelcome to *Ousman's Portfolio Bot*.\n\nType /contact to reach out directly.`,
    { parse_mode: "Markdown" }
  );
});

// /contact command
bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: "name" };
  bot.sendMessage(chatId, "🧑 What’s your *name*?", { parse_mode: "Markdown" });
});

// Step-by-step message handler
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands like /start or /contact
  if (text.startsWith("/")) return;

  const user = userStates[chatId];
  if (!user) return; // not in contact flow

  switch (user.step) {
    case "name":
      user.name = text;
      user.step = "email";
      bot.sendMessage(chatId, "📧 Please enter your *email*:", {
        parse_mode: "Markdown",
      });
      break;

    case "email":
      user.email = text;
      user.step = "message";
      bot.sendMessage(chatId, "💬 Finally, type your *message*:", {
        parse_mode: "Markdown",
      });
      break;

    case "message":
      user.message = text;
      user.step = "done";

      bot.sendMessage(
        chatId,
        `✅ Thank you, ${user.name}!\nHere’s what you sent:\n\n📧 ${user.email}\n💬 ${user.message}\n\nI'll forward this to Ousman!`
      );

      // Forward message to admin
      const adminChatId = process.env.ADMIN_CHAT_ID;
      if (adminChatId) {
        bot.sendMessage(
          adminChatId,
          `📩 *New Contact Message!*\n\n👤 Name: ${user.name}\n📧 Email: ${user.email}\n💬 Message: ${user.message}`,
          { parse_mode: "Markdown" }
        );
      }

      delete userStates[chatId];
      break;
  }
});

export default bot;
