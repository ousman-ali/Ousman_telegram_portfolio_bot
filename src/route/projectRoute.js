import express from "express";
import { createProject, getProjects } from "../controller/projectController.js";
import multer from "multer";

const router = express.Router();

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // upload directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("imageUrl"), createProject);
router.get("/", getProjects);

export default router;
