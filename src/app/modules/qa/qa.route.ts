import { Router } from "express";
import auth from "../../middlewares/auth";
import { QaController } from "./qa.controller";

const router = Router();

// ========================
// QUESTIONS
// ========================

// 1. Ask a question
router.post("/questions/ask", auth(), QaController.createQuestion);

// 2. Get all questions (Feed, Trending, Unanswered filter)
router.get("/questions", QaController.getAllQuestions);

// 3. Get single question with its answers
router.get("/questions/:id", QaController.getQuestionById);

// 4. Upvote a question
router.patch("/questions/:id/upvote", auth(), QaController.upvoteQuestion);

// 5. Update a question
router.patch("/questions/:id", auth(), QaController.updateQuestion);

// 6. Delete a question
router.delete("/questions/:id", auth(), QaController.deleteQuestion);

// ========================
// ANSWERS
// ========================

// 1. Reply (add answer)
router.post("/answers/reply", auth(), QaController.createAnswer);

// 2. Upvote an answer
router.patch("/answers/:id/upvote", auth(), QaController.upvoteAnswer);

// 3. Accept an answer
router.patch("/answers/:id/accept", auth(), QaController.acceptAnswer);

// 4. Update an answer
router.patch("/answers/:id", auth(), QaController.updateAnswer);

// 5. Delete an answer
router.delete("/answers/:id", auth(), QaController.deleteAnswer);

// ========================
// STATISTICS / AGGREGATES
// ========================

router.get("/top-contributors", QaController.getTopContributors);
router.get("/popular-tags", QaController.getPopularTags);

export const QaRoutes = router;
