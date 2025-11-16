import contactModel from "../model/contactModel.js";

// POST a new contact message
export const createContact = async (req, res) => {
  try {
    const contact = await contactModel.create(req.body);
    res.status(201).json({ message: "Contact saved successfully!", contact });
  } catch (error) {
    res.status(400).json({ message: "Error saving contact", error });
  }
};

// GET all contacts (optional - for admin)
export const getContacts = async (req, res) => {
  try {
    const contacts = await contactModel.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching contacts" });
  }
};
