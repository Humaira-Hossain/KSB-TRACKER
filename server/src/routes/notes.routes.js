import { Router } from "express";
import { createNote, deleteNote, listNotes, updateNote } from "../controllers/notes.controller.js";

const router = Router();

router.get("/notes", listNotes);
router.post("/notes", createNote);
router.patch("/notes/:id", updateNote);
router.delete("/notes/:id", deleteNote);

export default router;
