import axios from "axios";

export const handleContact = (bot, msg) => {
  const chatId = msg.chat.id;
  const userStates = {}; // temp memory

  userStates[chatId] = { step: "name" };
  bot.sendMessage(chatId, "🧑 What’s your *name*?", { parse_mode: "Markdown" });

  bot.on("message", async (message) => {
    if (message.chat.id !== chatId) return; // only handle same user

    const user = userStates[chatId];
    if (!user) return;

    switch (user.step) {
      case "name":
        user.name = message.text;
        user.step = "email";
        bot.sendMessage(chatId, "📧 Please enter your *email*:", {
          parse_mode: "Markdown",
        });
        break;

      case "email":
        user.email = message.text;
        user.step = "message";
        bot.sendMessage(chatId, "💬 Type your *message*:", {
          parse_mode: "Markdown",
        });
        break;

      case "message":
        user.message = message.text;

        // Send to API
        await axios.post(
          `${process.env.WEBHOOK_URL.replace("/api/webhook", "")}/api/contact`,
          user
        );

        bot.sendMessage(
          chatId,
          `✅ Thank you, ${user.name}! Your message has been sent to Ousman.`
        );
        delete userStates[chatId];
        break;
    }
  });
};
