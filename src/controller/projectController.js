import projectModel from "../model/projectModel.js";

// POST new project (with image upload)
// export const createProject = async (req, res) => {
//   try {
//     const { title, description, link, techStack } = req.body;

//     // If an image is uploaded, generate full URL
//     const imageUrl = req.file
//       ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
//       : null;

//     const parsedTechStack =
//       typeof techStack === "string"
//         ? techStack.split(",").map((t) => t.trim()) // allow comma-separated input
//         : techStack;

//     const project = await projectModel.create({
//       title,
//       description,
//       link,
//       imageUrl,
//       techStack: parsedTechStack || [],
//     });

//     res.status(201).json({
//       message: "✅ Project created successfully",
//       project,
//     });
//   } catch (error) {
//     console.error("❌ Error creating project:", error);
//     res.status(400).json({ message: "Error creating project", error });
//   }
// };

export const createProject = async (req, res) => {
  try {
    const { title, description, link, techStack } = req.body;

    // Use the IMG_BASE_URL from .env
    const baseUrl = process.env.IMG_BASE_URL?.replace(/\/$/, ""); // remove trailing slash if any

    // If an image is uploaded, combine base URL with the filename
    const imageUrl = req.file
      ? `${baseUrl}/uploads/${req.file.filename}`
      : null;

    // Parse techStack if it's a comma-separated string
    const parsedTechStack =
      typeof techStack === "string"
        ? techStack.split(",").map((t) => t.trim())
        : techStack;

    // Create project entry in the DB
    const project = await projectModel.create({
      title,
      description,
      link,
      imageUrl,
      techStack: parsedTechStack || [],
    });

    res.status(201).json({
      message: "✅ Project created successfully",
      project,
    });
  } catch (error) {
    console.error("❌ Error creating project:", error);
    res.status(400).json({ message: "Error creating project", error });
  }
};

// GET all projects
export const getProjects = async (req, res) => {
  try {
    const projects = await projectModel.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({ message: "Server error fetching projects" });
  }
};
