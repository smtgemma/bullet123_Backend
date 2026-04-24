import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { QaServices } from "./qa.service";

// --- Questions ---

const createQuestion = catchAsync(async (req, res) => {
  const authorId = req.user?.id as string;
  const result = await QaServices.createQuestion({ ...req.body, authorId });
  sendResponse(res, {
    statusCode: status.CREATED,

    message: "Question created successfully",
    data: result,
  });
});

const getAllQuestions = catchAsync(async (req, res) => {
  const result = await QaServices.getAllQuestions(req.query);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Questions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getQuestionById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QaServices.getQuestionById(id as string);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Question details retrieved",
    data: result,
  });
});

const upvoteQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QaServices.upvoteQuestion(id as string);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Question upvoted!",
    data: result,
  });
});

const updateQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const result = await QaServices.updateQuestion(id as string, userId, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Question updated successfully",
    data: result,
  });
});

const deleteQuestion = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const role = req.user?.role as string;

  await QaServices.deleteQuestion(id as string, userId, role);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Question deleted successfully",
  });
});

// --- Answers ---

const createAnswer = catchAsync(async (req, res) => {
  const authorId = req.user?.id as string;
  const result = await QaServices.createAnswer({ ...req.body, authorId });
  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Answer added successfully",
    data: result,
  });
});

const updateAnswer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const result = await QaServices.updateAnswer(id as string, userId, req.body);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Answer updated successfully",
    data: result,
  });
});

const upvoteAnswer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await QaServices.upvoteAnswer(id as string);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Answer upvoted!",
    data: result,
  });
});

const acceptAnswer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const result = await QaServices.acceptAnswer(id as string, userId);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Answer accepted!",
    data: result,
  });
});

const deleteAnswer = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const role = req.user?.role as string;

  await QaServices.deleteAnswer(id as string, userId, role);
  sendResponse(res, {
    statusCode: status.OK,

    message: "Answer deleted successfully",
  });
});

const getTopContributors = catchAsync(async (req, res) => {
  const result = await QaServices.getTopContributors();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Top contributors retrieved",
    data: result,
  });
});

const getPopularTags = catchAsync(async (req, res) => {
  const result = await QaServices.getPopularTags();
  sendResponse(res, {
    statusCode: status.OK,
    message: "Popular tags retrieved",
    data: result,
  });
});

export const QaController = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  upvoteQuestion,
  updateQuestion,
  deleteQuestion,

  createAnswer,
  upvoteAnswer,
  updateAnswer,
  acceptAnswer,
  deleteAnswer,
  getTopContributors,
  getPopularTags
};
