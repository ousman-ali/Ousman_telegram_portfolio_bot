import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    link: { type: String },
    imageUrl: { type: String },
    techStack: [String],
  },
  { timestamps: true }
);

export default mongoose.model("ProjectModel", projectSchema);
