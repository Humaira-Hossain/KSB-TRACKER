import { Router } from "express";
import { archiveTask, completeTask, createTask, getTask, listTasks, updateTask } from "../controllers/tasks.controller.js";
import { createEvidence, listEvidenceForTask } from "../controllers/evidence.controller.js";

const router = Router();

router.get("/tasks", listTasks);
router.post("/tasks", createTask);
router.get("/tasks/:id", getTask);
router.patch("/tasks/:id", updateTask);
// DELETE archives rather than removes the task or its linked evidence.
router.delete("/tasks/:id", archiveTask);
router.post("/tasks/:id/complete", completeTask);
router.get("/tasks/:taskId/evidence", listEvidenceForTask);
router.post("/tasks/:taskId/evidence", createEvidence);

export default router;
