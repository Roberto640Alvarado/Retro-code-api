import express from "express";
import { generateFeedback, getFeedbackByRepo } from "../controllers/feedbackController.js";
const router = express.Router();

router.post("/:repo", generateFeedback);
router.get("/:repo", getFeedbackByRepo);

export default router;
