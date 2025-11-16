// bot/index.js
import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiBase = process.env.API_BASE_URL || "http://localhost:5000";
const adminChatId = process.env.ADMIN_CHAT_ID;

// ---------- initialize bot ----------
// If you use webhook mode, create bot with { webHook: true } and set webhook elsewhere.
// If you use polling for dev, use { polling: true }. Choose one.
const usePolling = false; // set true for local polling debugging, false for webhook
const bot = usePolling
  ? new TelegramBot(token, { polling: true })
  : new TelegramBot(token, { webHook: true });

if (!usePolling) {
  // only when using webhook mode. Make sure WEBHOOK_URL is like https://xyz.ngrok.io/api/webhook
  const webhookUrl = `${process.env.WEBHOOK_URL}/${token}`;
  (async () => {
    try {
      await bot.setWebHook(webhookUrl);
      console.log("✅ Webhook set:", webhookUrl);
    } catch (err) {
      console.error("Failed to set webhook:", err.message);
    }
  })();
}

console.log("🤖 Bot initialized");

// ---------- helpers ----------
function escapeMarkdown(text = "") {
  // minimal MarkdownV2 escaping for Telegram (used if parse_mode is MarkdownV2)
  return text
    .replaceAll("_", "\\_")
    .replaceAll("*", "\\*")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
    .replaceAll("~", "\\~")
    .replaceAll("`", "\\`")
    .replaceAll(">", "\\>")
    .replaceAll("#", "\\#")
    .replaceAll("+", "\\+")
    .replaceAll("-", "\\-")
    .replaceAll("=", "\\=")
    .replaceAll("|", "\\|")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}")
    .replaceAll(".", "\\.")
    .replaceAll("!", "\\!");
}

function formatProjectMarkdown(project) {
  // return a markdown string for a project
  const title = project.title || "Untitled";
  const desc = project.description || "";
  const link = project.link ? `\n🔗 [View Project](${project.link})` : "";
  const tech =
    Array.isArray(project.techStack) && project.techStack.length
      ? `\n🛠️ Tech: ${project.techStack.join(", ")}`
      : "";
  return `*${escapeMarkdown(title)}*\n\n${escapeMarkdown(desc)}${tech}${link}`;
}

// ---------- /projects command ----------
// ---------- /projects command ----------
bot.onText(/\/projects/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, "🔎 Fetching projects...");

  try {
    // Fetch projects from your Express API
    const res = await axios.get(`${apiBase.replace(/\/$/, "")}/api/projects`);
    const projects = res.data;

    if (!projects || projects.length === 0) {
      await bot.sendMessage(chatId, "No projects found.");
      return;
    }

    for (const project of projects) {
      const title = project.title || "Untitled Project";
      const description = project.description || "";
      const link = project.link ? `🔗 ${project.link}` : "";
      const tech =
        project.techStack && project.techStack.length
          ? `🛠️ Tech: ${project.techStack.join(", ")}`
          : "";

      // Combine all info into one caption
      const caption = `*${escapeMarkdown(title)}*\n\n${escapeMarkdown(
        description
      )}\n\n${escapeMarkdown(tech)}\n${escapeMarkdown(link)}`;

      // --- CASE 1: if project has image, send image with caption ---
      if (project.imageUrl) {
        console.log("image", project.imageUrl);
        try {
          try {
            const response = await axios.get(project.imageUrl, {
              responseType: "arraybuffer",
            });
            const buffer = Buffer.from(response.data, "binary");

            await bot.sendPhoto(chatId, buffer, {
              caption,
              parse_mode: "MarkdownV2",
            });
          } catch (photoErr) {
            console.error("Failed to send photo:", photoErr.message);
            await bot.sendMessage(chatId, caption, {
              parse_mode: "MarkdownV2",
            });
          }
        } catch (photoErr) {
          console.error("Failed to send photo:", photoErr.message);
          // fallback: send as text
          await bot.sendMessage(chatId, caption, { parse_mode: "MarkdownV2" });
        }
      } else {
        // --- CASE 2: send only text ---
        await bot.sendMessage(chatId, caption, { parse_mode: "MarkdownV2" });
      }
    }
  } catch (err) {
    console.error("Error fetching projects:", err.message || err);
    await bot.sendMessage(chatId, "⚠️ Failed to fetch projects. Try later.");
  }
});

// ---------- Contact form flow (stateful) ----------
const userStates = {}; // { chatId: { step, name, email, message } }

// Start contact via /contact
bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;
  userStates[chatId] = { step: "name" };
  bot.sendMessage(chatId, "🧑 What's your *name*?", { parse_mode: "Markdown" });
});

// Central message handler — drives the contact conversation
bot.on("message", async (msg) => {
  // ignore non-text or messages that are commands (start with /)
  const text = msg.text;
  if (!text) return;
  if (text.startsWith("/")) return; // commands handled separately

  const chatId = msg.chat.id;
  const state = userStates[chatId];
  if (!state) return; // not in contact flow

  try {
    if (state.step === "name") {
      state.name = text.trim();
      state.step = "email";
      await bot.sendMessage(chatId, "📧 Please enter your *email*:", {
        parse_mode: "Markdown",
      });
      return;
    }

    if (state.step === "email") {
      state.email = text.trim();
      state.step = "message";
      await bot.sendMessage(chatId, "💬 Now type your *message*:", {
        parse_mode: "Markdown",
      });
      return;
    }

    if (state.step === "message") {
      state.message = text.trim();
      // 1) Send to your API
      try {
        await axios.post(`${apiBase.replace(/\/$/, "")}/api/contact`, {
          name: state.name,
          email: state.email,
          message: state.message,
        });
      } catch (apiErr) {
        console.error(
          "Failed to POST contact to API:",
          apiErr.message || apiErr
        );
        await bot.sendMessage(
          chatId,
          "⚠️ Failed to send your message to the server. Try again later."
        );
        delete userStates[chatId];
        return;
      }

      // 2) Notify admin via Telegram (if ADMIN_CHAT_ID set)
      if (adminChatId) {
        const adminText =
          `📩 *New Contact Message*\n\n` +
          `👤 Name: ${escapeMarkdown(state.name)}\n` +
          `📧 Email: ${escapeMarkdown(state.email)}\n` +
          `💬 Message: ${escapeMarkdown(state.message)}`;
        await bot.sendMessage(adminChatId, adminText, {
          parse_mode: "Markdown",
        });
      }

      // 3) Confirm to the user
      await bot.sendMessage(chatId, "✅ Thank you! Your message was sent.");

      // cleanup
      delete userStates[chatId];
      return;
    }
  } catch (err) {
    console.error("Contact flow error:", err);
    await bot.sendMessage(
      chatId,
      "⚠️ Something went wrong. Please try /contact again."
    );
    delete userStates[chatId];
  }
});

export default bot;
