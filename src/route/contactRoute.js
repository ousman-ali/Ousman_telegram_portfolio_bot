import express from "express";
import { createContact, getContacts } from "../controller/contactController.js";

const router = express.Router();

router.get("/", getContacts);
router.post("/", createContact);

export default router;
