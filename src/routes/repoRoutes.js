import express from "express";
import{ getLatestWorkflowDetails, getRepoFiles ,
    getClassrooms, getAssignments, getAssignmentRepos,getAssignmentGrades,
    addFeedbackToPR 
} from "../controllers/repoController.js";

const router = express.Router();

router.get("/:repo/workflow/details", getLatestWorkflowDetails);
router.get("/:repo/files", getRepoFiles);
router.get("/classrooms", getClassrooms);
router.get("/classrooms/:classroomId/assignments", getAssignments);
router.get("/assignments/:assignmentId/accepted_assignments", getAssignmentRepos);
router.get("/assignments/:assignmentId/grades", getAssignmentGrades);
router.post("/:repo/pr/feedback", addFeedbackToPR);
export default router;
