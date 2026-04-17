import status from "http-status";
import { QAService } from "./qa.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// ── Get All Questions ──────────────────────────────────────────────────────
const getAllQuestions = catchAsync(async (req, res) => {
  const result = await QAService.getAllQuestionsFromDB(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Questions retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// ── Get Single Question ────────────────────────────────────────────────────
const getSingleQuestion = catchAsync(async (req, res) => {
  const result = await QAService.getSingleQuestionFromDB(req.params.id);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Question retrieved successfully",
    data: result,
  });
});

// ── Create Question ────────────────────────────────────────────────────────
const createQuestion = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await QAService.createQuestionIntoDB(userId, req.body);
  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Question posted successfully",
    data: result,
  });
});

// ── Post Answer ────────────────────────────────────────────────────────────
const postAnswer = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const { id: questionId } = req.params;
  const result = await QAService.postAnswerIntoDB(questionId, userId, req.body.content);
  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Answer posted successfully",
    data: result,
  });
});

// ── Vote Question ──────────────────────────────────────────────────────────
const voteQuestion = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await QAService.voteQuestionIntoDB(req.params.id, userId);
  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
    data: result,
  });
});

// ── Vote Answer ────────────────────────────────────────────────────────────
const voteAnswer = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await QAService.voteAnswerIntoDB(req.params.answerId, userId);
  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
    data: result,
  });
});

// ── Accept Answer ──────────────────────────────────────────────────────────
const acceptAnswer = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await QAService.acceptAnswerIntoDB(req.params.answerId, userId);
  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
  });
});

// ── Delete Question ────────────────────────────────────────────────────────
const deleteQuestion = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const userRole = req.user?.role as string;
  await QAService.deleteQuestionFromDB(req.params.id, userId, userRole);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Question deleted successfully",
  });
});

// ── Delete Answer ──────────────────────────────────────────────────────────
const deleteAnswer = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const userRole = req.user?.role as string;
  await QAService.deleteAnswerFromDB(req.params.answerId, userId, userRole);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Answer deleted successfully",
  });
});

// ── Get Top Contributors ───────────────────────────────────────────────────
const getTopContributors = catchAsync(async (req, res) => {
  const result = await QAService.getTopContributorsFromDB();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Top contributors retrieved successfully",
    data: result,
  });
});

// ── Get Popular Tags ───────────────────────────────────────────────────────
const getPopularTags = catchAsync(async (req, res) => {
  const result = await QAService.getPopularTagsFromDB();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Popular tags retrieved successfully",
    data: result,
  });
});

export const QAController = {
  getAllQuestions,
  getSingleQuestion,
  createQuestion,
  postAnswer,
  voteQuestion,
  voteAnswer,
  acceptAnswer,
  deleteQuestion,
  deleteAnswer,
  getTopContributors,
  getPopularTags,
};
