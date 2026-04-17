import status from "http-status";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";

// ── Get All Questions (Recent / Trending / Unanswered) ─────────────────────
const getAllQuestionsFromDB = async (query: Record<string, unknown>) => {
  const { tab, searchTerm, category, role, tag, ...rest } = query;

  // Build base where clause
  let baseWhere: Record<string, any> = {};

  if (tab === "unanswered") {
    baseWhere.isAnswered = false;
  }

  if (tag) {
    baseWhere.tags = { has: tag as string };
  }

  // Sorting strategy per tab
  let sortField = "-createdAt"; // default: Recent
  if (tab === "trending") {
    sortField = "-votes";
  } else if (tab === "unanswered") {
    sortField = "-createdAt";
  }

  const queryBuilder = new QueryBuilder(prisma.question, {
    searchTerm,
    sort: sortField,
    ...rest,
  })
    .search(["title", "details"])
    .rawFilter(baseWhere)
    .sort()
    .paginate()
    .include({
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        },
      },
      _count: {
        select: { answers: true },
      },
    });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

// ── Get Single Question with Answers ───────────────────────────────────────
const getSingleQuestionFromDB = async (id: string) => {
  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        },
      },
      answers: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true,
              role: true,
            },
          },
        },
        orderBy: [{ isAccepted: "desc" }, { votes: "desc" }, { createdAt: "asc" }],
      },
      _count: { select: { answers: true } },
    },
  });

  if (!question) throw new ApiError(status.NOT_FOUND, "Question not found!");

  // Increment views (non-blocking)
  prisma.question
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  return question;
};

// ── Create Question ────────────────────────────────────────────────────────
const createQuestionIntoDB = async (
  userId: string,
  payload: { title: string; details?: string; tags?: string[] }
) => {
  const question = await prisma.question.create({
    data: {
      title: payload.title,
      details: payload.details,
      tags: payload.tags || [],
      userId,
    },
    include: {
      user: {
        select: { id: true, fullName: true, profilePic: true, role: true },
      },
    },
  });

  return question;
};

// ── Post Answer ────────────────────────────────────────────────────────────
const postAnswerIntoDB = async (
  questionId: string,
  userId: string,
  content: string
) => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new ApiError(status.NOT_FOUND, "Question not found!");

  const answer = await prisma.$transaction(async (tx) => {
    const newAnswer = await tx.answer.create({
      data: { content, questionId, userId },
      include: {
        user: {
          select: { id: true, fullName: true, profilePic: true, role: true },
        },
      },
    });

    // Mark question as answered
    await tx.question.update({
      where: { id: questionId },
      data: { isAnswered: true },
    });

    return newAnswer;
  });

  return answer;
};

// ── Vote Question (toggle) ─────────────────────────────────────────────────
const voteQuestionIntoDB = async (questionId: string, userId: string) => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new ApiError(status.NOT_FOUND, "Question not found!");

  const existingVote = await prisma.questionVote.findUnique({
    where: { questionId_userId: { questionId, userId } },
  });

  if (existingVote) {
    // Un-vote
    await prisma.$transaction([
      prisma.questionVote.delete({ where: { questionId_userId: { questionId, userId } } }),
      prisma.question.update({ where: { id: questionId }, data: { votes: { decrement: 1 } } }),
    ]);
    return { voted: false, message: "Vote removed" };
  } else {
    // Vote
    await prisma.$transaction([
      prisma.questionVote.create({ data: { questionId, userId } }),
      prisma.question.update({ where: { id: questionId }, data: { votes: { increment: 1 } } }),
    ]);
    return { voted: true, message: "Voted successfully" };
  }
};

// ── Vote Answer (toggle) ───────────────────────────────────────────────────
const voteAnswerIntoDB = async (answerId: string, userId: string) => {
  const answer = await prisma.answer.findUnique({ where: { id: answerId } });
  if (!answer) throw new ApiError(status.NOT_FOUND, "Answer not found!");

  const existingVote = await prisma.answerVote.findUnique({
    where: { answerId_userId: { answerId, userId } },
  });

  if (existingVote) {
    await prisma.$transaction([
      prisma.answerVote.delete({ where: { answerId_userId: { answerId, userId } } }),
      prisma.answer.update({ where: { id: answerId }, data: { votes: { decrement: 1 } } }),
    ]);
    return { voted: false, message: "Vote removed" };
  } else {
    await prisma.$transaction([
      prisma.answerVote.create({ data: { answerId, userId } }),
      prisma.answer.update({ where: { id: answerId }, data: { votes: { increment: 1 } } }),
    ]);
    return { voted: true, message: "Voted successfully" };
  }
};

// ── Accept Answer ──────────────────────────────────────────────────────────
const acceptAnswerIntoDB = async (answerId: string, userId: string) => {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    include: { question: true },
  });

  if (!answer) throw new ApiError(status.NOT_FOUND, "Answer not found!");
  if (answer.question.userId !== userId) {
    throw new ApiError(status.FORBIDDEN, "Only the question author can accept an answer");
  }

  // Unaccept all other answers for this question, then accept this one
  await prisma.$transaction([
    prisma.answer.updateMany({
      where: { questionId: answer.questionId },
      data: { isAccepted: false },
    }),
    prisma.answer.update({
      where: { id: answerId },
      data: { isAccepted: true },
    }),
  ]);

  return { message: "Answer accepted successfully" };
};

// ── Delete Question ────────────────────────────────────────────────────────
const deleteQuestionFromDB = async (id: string, userId: string, userRole: string) => {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) throw new ApiError(status.NOT_FOUND, "Question not found!");

  const isOwnerOrAdmin = question.userId === userId || ["ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isOwnerOrAdmin) throw new ApiError(status.FORBIDDEN, "You are not allowed to delete this question");

  await prisma.question.delete({ where: { id } });
  return null;
};

// ── Delete Answer ──────────────────────────────────────────────────────────
const deleteAnswerFromDB = async (id: string, userId: string, userRole: string) => {
  const answer = await prisma.answer.findUnique({ where: { id } });
  if (!answer) throw new ApiError(status.NOT_FOUND, "Answer not found!");

  const isOwnerOrAdmin = answer.userId === userId || ["ADMIN", "SUPER_ADMIN"].includes(userRole);
  if (!isOwnerOrAdmin) throw new ApiError(status.FORBIDDEN, "You are not allowed to delete this answer");

  await prisma.answer.delete({ where: { id } });
  return null;
};

// ── Get Top Contributors ───────────────────────────────────────────────────
const getTopContributorsFromDB = async () => {
  const contributors = await prisma.user.findMany({
    where: {
      answers: { some: {} },
    },
    select: {
      id: true,
      fullName: true,
      profilePic: true,
      role: true,
      _count: { select: { answers: true } },
    },
    orderBy: {
      answers: { _count: "desc" },
    },
    take: 5,
  });

  return contributors;
};

// ── Get Popular Tags ───────────────────────────────────────────────────────
const getPopularTagsFromDB = async () => {
  const questions = await prisma.question.findMany({
    select: { tags: true },
  });

  const tagCount: Record<string, number> = {};
  questions.forEach((q) => {
    q.tags.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  const sorted = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return sorted;
};

export const QAService = {
  getAllQuestionsFromDB,
  getSingleQuestionFromDB,
  createQuestionIntoDB,
  postAnswerIntoDB,
  voteQuestionIntoDB,
  voteAnswerIntoDB,
  acceptAnswerIntoDB,
  deleteQuestionFromDB,
  deleteAnswerFromDB,
  getTopContributorsFromDB,
  getPopularTagsFromDB,
};
