import status from "http-status";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { StoryCategory } from "@prisma/client";

interface CreateStoryPayload {
  title: string;
  category: StoryCategory;
  location: string;
  completedDate: string;
  beforeImage: string;
  afterImage: string;
  investment: number;
  duration: number;
  roi: number;
  storyText: string;
  quote?: string;
  quoteAuthor?: string;
  quoteAuthorRole?: string;
  isFeatured?: boolean;
  teamMembers?: { name: string; role: string; profilePic?: string }[];
}

// ── Get Platform Stats ─────────────────────────────────────────────────────
const getPlatformStatsFromDB = async () => {
  const [totalStories, allStories] = await Promise.all([
    prisma.successStory.count(),
    prisma.successStory.findMany({
      select: { investment: true, roi: true, location: true },
    }),
  ]);

  const totalInvestment = allStories.reduce((sum, s) => sum + s.investment, 0);
  const avgRoi =
    allStories.length > 0
      ? Math.round(allStories.reduce((sum, s) => sum + s.roi, 0) / allStories.length)
      : 0;

  // Count unique cities
  const cities = new Set(allStories.map((s) => s.location.split(",")[1]?.trim() || s.location));

  return {
    propertiesCompleted: totalStories,
    totalInvestment,
    averageRoi: avgRoi,
    citiesServed: cities.size,
  };
};

// ── Get All Success Stories ────────────────────────────────────────────────
const getAllSuccessStoriesFromDB = async (query: Record<string, unknown>) => {
  const { category, ...rest } = query;

  const baseWhere: Record<string, any> = {};
  if (category && category !== "ALL") {
    baseWhere.category = category;
  }

  const queryBuilder = new QueryBuilder(prisma.successStory, {
    sort: "-createdAt",
    ...rest,
  })
    .search(["title", "location", "storyText"])
    .rawFilter(baseWhere)
    .sort()
    .paginate()
    .include({ teamMembers: true });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

// ── Get Featured Stories ───────────────────────────────────────────────────
const getFeaturedStoriesFromDB = async () => {
  return prisma.successStory.findMany({
    where: { isFeatured: true },
    include: { teamMembers: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  });
};

// ── Get Single Story ───────────────────────────────────────────────────────
const getSingleSuccessStoryFromDB = async (id: string) => {
  const story = await prisma.successStory.findUnique({
    where: { id },
    include: { teamMembers: true },
  });

  if (!story) throw new ApiError(status.NOT_FOUND, "Success story not found!");

  // Increment views (non-blocking)
  prisma.successStory
    .update({ where: { id }, data: { views: { increment: 1 } } })
    .catch(() => {});

  return story;
};

// ── Create Story (Admin only) ──────────────────────────────────────────────
const createSuccessStoryIntoDB = async (payload: CreateStoryPayload) => {
  const { teamMembers, ...storyData } = payload;

  const story = await prisma.successStory.create({
    data: {
      ...storyData,
      completedDate: new Date(storyData.completedDate),
      teamMembers: {
        create: teamMembers || [],
      },
    },
    include: { teamMembers: true },
  });

  return story;
};

// ── Update Story (Admin only) ──────────────────────────────────────────────
const updateSuccessStoryIntoDB = async (
  id: string,
  payload: Partial<CreateStoryPayload>
) => {
  const story = await prisma.successStory.findUnique({ where: { id } });
  if (!story) throw new ApiError(status.NOT_FOUND, "Success story not found!");

  const { teamMembers, ...storyData } = payload;

  const updated = await prisma.$transaction(async (tx) => {
    // Delete old team members and recreate if provided
    if (teamMembers !== undefined) {
      await tx.storyTeamMember.deleteMany({ where: { storyId: id } });
    }

    return tx.successStory.update({
      where: { id },
      data: {
        ...storyData,
        ...(storyData.completedDate
          ? { completedDate: new Date(storyData.completedDate) }
          : {}),
        ...(teamMembers !== undefined
          ? { teamMembers: { create: teamMembers } }
          : {}),
      },
      include: { teamMembers: true },
    });
  });

  return updated;
};

// ── Delete Story (Admin only) ──────────────────────────────────────────────
const deleteSuccessStoryFromDB = async (id: string) => {
  const story = await prisma.successStory.findUnique({ where: { id } });
  if (!story) throw new ApiError(status.NOT_FOUND, "Success story not found!");

  await prisma.successStory.delete({ where: { id } });
  return null;
};

const getCategories = async () => {
  return Object.values(StoryCategory);
};

export const SuccessStoryService = {
  getCategories,
  getPlatformStatsFromDB,
  getAllSuccessStoriesFromDB,
  getFeaturedStoriesFromDB,
  getSingleSuccessStoryFromDB,
  createSuccessStoryIntoDB,
  updateSuccessStoryIntoDB,
  deleteSuccessStoryFromDB,
};
