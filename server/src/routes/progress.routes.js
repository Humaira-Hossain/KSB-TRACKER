import { Router } from "express";
import { progress } from "../controllers/progress.controller.js";

const router = Router();
router.get("/progress", progress);

export default router;
