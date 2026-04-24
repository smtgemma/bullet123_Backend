import status from "http-status";
import AppError from "../../errors/AppError";
import prisma from "../../utils/prisma";
import QueryBuilder from "../../builder/QueryBuilder";
import { Question, Answer } from "@prisma/client";

// --- Questions ---

const createQuestion = async (payload: Partial<Question> & { authorId: string }) => {
  if (!payload.title || !payload.details) {
    throw new AppError(status.BAD_REQUEST, "Title and Details are required");
  }

  const question = await prisma.question.create({
    data: {
      title: payload.title,
      details: payload.details,
      tags: payload.tags || [],
      category: payload.category || null,
      authorId: payload.authorId,
    },
  });

  return question;
};

const getAllQuestions = async (query: Record<string, unknown>) => {
  // Custom query builder behavior for Trending / Unanswered
  const rawFilterInput: any = {};

  // Inject sorting/filtering based on filterType
  if (query.filterType === "trending") {
    query.sort = "-upvotes,-views";
  } else if (query.filterType === "unanswered") {
    rawFilterInput.answers = { none: {} };
    query.sort = "-createdAt";
  } else if (query.filterType === "recent") {
    query.sort = "-createdAt";
  }

  // Tag filtering (Array match check)
  if (query.tag) {
    rawFilterInput.tags = { has: query.tag as string };
  }

  const queryBuilder = new QueryBuilder(prisma.question, query)
    .search(["title", "details", "category"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include({
      author: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
          role: true,
        },
      },
      _count: {
        select: { answers: true }
      },
      answers: {
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              profilePic: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    });

  // Apply custom raw filters
  queryBuilder.rawFilter(rawFilterInput);

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

const getQuestionById = async (id: string) => {
  // Increment view count whenever fetch occurs
  await prisma.question.update({
    where: { id },
    data: { views: { increment: 1 } }
  });

  const question = await prisma.question.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, fullName: true, profilePic: true, role: true },
      },
      answers: {
        orderBy: { upvotes: "desc" },
        include: {
          author: {
            select: { id: true, fullName: true, profilePic: true, role: true },
          }
        }
      },
      _count: {
        select: { answers: true }
      }
    },
  });

  if (!question) throw new AppError(status.NOT_FOUND, "Question not found");
  return question;
};

const upvoteQuestion = async (id: string) => {
  const question = await prisma.question.update({
    where: { id },
    data: { upvotes: { increment: 1 } },
  });
  return question;
};

const updateQuestion = async (id: string, userId: string, payload: Partial<Question>) => {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) throw new AppError(status.NOT_FOUND, "Question not found");

  if (question.authorId !== userId) {
    throw new AppError(status.FORBIDDEN, "Not authorized to update this question");
  }

  const updatedQuestion = await prisma.question.update({
    where: { id },
    data: payload,
  });
  return updatedQuestion;
};

const deleteQuestion = async (id: string, userId: string, role: string) => {
  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) throw new AppError(status.NOT_FOUND, "Question not found");

  if (question.authorId !== userId && role !== "SUPER_ADMIN" && role !== "ADMIN") {
    throw new AppError(status.FORBIDDEN, "Not authorized to delete this question");
  }

  await prisma.question.delete({ where: { id } });
  return true;
};

// --- Answers ---

const createAnswer = async (payload: Partial<Answer> & { authorId: string, questionId: string }) => {
  if (!payload.content || !payload.questionId) {
    throw new AppError(status.BAD_REQUEST, "Content and questionId are required");
  }

  const answer = await prisma.answer.create({
    data: {
      content: payload.content,
      questionId: payload.questionId,
      authorId: payload.authorId,
    },
  });
  return answer;
};


const upvoteAnswer = async (id: string) => {
  const answer = await prisma.answer.update({
    where: { id },
    data: { upvotes: { increment: 1 } },
  });
  return answer;
};

const acceptAnswer = async (id: string, userId: string) => {
  const answer = await prisma.answer.findUnique({
    where: { id },
    include: { question: true }
  });

  if (!answer) throw new AppError(status.NOT_FOUND, "Answer not found");

  if (answer.question.authorId !== userId) {
    throw new AppError(status.FORBIDDEN, "Only the question author can accept an answer");
  }

  const updatedAnswer = await prisma.answer.update({
    where: { id },
    data: { isAccepted: true },
  });

  return updatedAnswer;
};

const updateAnswer = async (id: string, userId: string, payload: Partial<Answer>) => {
  const answer = await prisma.answer.findUnique({ where: { id } });
  if (!answer) throw new AppError(status.NOT_FOUND, "Answer not found");

  if (answer.authorId !== userId) {
    throw new AppError(status.FORBIDDEN, "Not authorized to update this answer");
  }

  const updatedAnswer = await prisma.answer.update({
    where: { id },
    data: payload,
  });
  return updatedAnswer;
};

const deleteAnswer = async (id: string, userId: string, role: string) => {
  const answer = await prisma.answer.findUnique({ where: { id } });
  if (!answer) throw new AppError(status.NOT_FOUND, "Answer not found");

  if (answer.authorId !== userId && role !== "SUPER_ADMIN" && role !== "ADMIN") {
    throw new AppError(status.FORBIDDEN, "Not authorized to delete this answer");
  }

  await prisma.answer.delete({ where: { id } });
  return true;
};

// --- Statistics / Aggregates ---

const getTopContributors = async () => {
  const contributors = await prisma.user.findMany({
    where: {
      answers: { some: {} }
    },
    select: {
      id: true,
      fullName: true,
      profilePic: true,
      role: true,
      _count: {
        select: { answers: true }
      }
    },
    orderBy: {
      answers: {
        _count: "desc"
      }
    },
    take: 5
  });

  return contributors;
};

const getPopularTags = async () => {
  // Prisma doesn't support direct aggregation on string arrays yet.
  // We use a raw query and cast the count to integer (::int) to avoid BigInt serialization issues.
  const result: any = await prisma.$queryRaw`
    SELECT unnest(tags) as tag, count(*)::int as count
    FROM questions
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 10
  `;

  return result;
};

export const QaServices = {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  upvoteQuestion,
  updateQuestion,
  deleteQuestion,

  createAnswer,
  upvoteAnswer,
  acceptAnswer,
  updateAnswer,
  deleteAnswer,
  getTopContributors,
  getPopularTags
};
