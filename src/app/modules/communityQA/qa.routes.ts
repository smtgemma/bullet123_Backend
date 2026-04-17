import { Router } from "express";
import auth from "../../middlewares/auth";
import { QAController } from "./qa.controller";
import { QAValidation } from "./qa.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// ── Public Routes ──────────────────────────────────────────────────────────
// GET /api/v1/community-qa?tab=recent|trending|unanswered&searchTerm=&tag=
router.get("/", QAController.getAllQuestions);
router.get("/contributors", QAController.getTopContributors);
router.get("/tags", QAController.getPopularTags);
router.get("/:id", QAController.getSingleQuestion);

// ── Protected Routes ───────────────────────────────────────────────────────
router.post(
  "/",
  auth(),
  validateRequest(QAValidation.createQuestionSchema),
  QAController.createQuestion
);

// Post an answer to a question
router.post(
  "/:id/answers",
  auth(),
  validateRequest(QAValidation.postAnswerSchema),
  QAController.postAnswer
);

// Vote on a question (toggle)
router.post("/:id/vote", auth(), QAController.voteQuestion);

// Vote on an answer (toggle)
router.post("/:id/answers/:answerId/vote", auth(), QAController.voteAnswer);

// Accept an answer (question author only)
router.patch("/:id/answers/:answerId/accept", auth(), QAController.acceptAnswer);

// Delete question (owner or admin)
router.delete("/:id", auth(), QAController.deleteQuestion);

// Delete answer (owner or admin)
router.delete("/:id/answers/:answerId", auth(), QAController.deleteAnswer);

export const QARoutes = router;
