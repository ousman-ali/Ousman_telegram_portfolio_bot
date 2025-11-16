import axios from "axios";
import { formatProject } from "../utils/formatProject.js";

export const handleProjects = async (bot, msg) => {
  const chatId = msg.chat.id;

  try {
    const { data: projects } = await axios.get(
      `${process.env.WEBHOOK_URL.replace("/api/webhook", "")}/api/projects`
    );

    if (projects.length === 0) {
      bot.sendMessage(chatId, "No projects found yet!");
      return;
    }

    for (const project of projects) {
      const formatted = formatProject(project);
      await bot.sendPhoto(chatId, project.imageUrl, {
        caption: formatted,
        parse_mode: "Markdown",
      });
    }
  } catch (error) {
    console.error("Error fetching projects:", error.message);
    bot.sendMessage(chatId, "⚠️ Failed to load projects.");
  }
};
