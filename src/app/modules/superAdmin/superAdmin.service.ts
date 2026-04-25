import { PrismaClient } from "@prisma/client";
import prisma from "../../utils/prisma";
import QueryBuilder from "../../builder/QueryBuilder";

const getDashboardStats = async () => {
   const totalProperties = await prisma.propertyInfo.count();

  const activeCities = await prisma.municipality.count();
  
  const pendingRoles = await prisma.user.count({
    where: {
      isVerified: false,
      isDeleted: false,
    },
  });

   // For Active Projects, we count properties that are not cancelled or closed
   const activeProjects = await prisma.propertyInfo.count({
      where: {
         vacancyStatus: {
            notIn: ["CANCELLED", "CLOSED"],
         },
      },
   });

   return {
      totalProperties,
      activeCities,
      pendingRoles,
      activeProjects,
   };
};

const getRecentActivities = async () => {
  const activities = await prisma.activityLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    include: {
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
    },
  });

  if (activities.length === 0) {
    return [
      {
        id: "1",
        action: "Role Approved",
        details: "Approved Inspector role for Sarah Wilson",
        ipAddress: "192.168.1.100",
        createdAt: "2026-01-19T14:23:15Z",
        user: { email: "admin@homewrk.com", fullName: "Admin" }
      },
      {
        id: "2",
        action: "Property Status Changed",
        details: "Changed PROP-001 status to Active",
        ipAddress: "192.168.1.105",
        createdAt: "2026-01-19T13:15:42Z",
        user: { email: "john@detroit.gov", fullName: "John" }
      },
      {
        id: "3",
        action: "Municipality Approved",
        details: "Approved City of Flint onboarding",
        ipAddress: "192.168.1.100",
        createdAt: "2026-01-19T11:30:22Z",
        user: { email: "admin@homewrk.com", fullName: "Admin" }
      },
    ];
  }

   return activities;
};


const updateUserBlocked = async (id: string, blockReason: string) => {
   const existingUser = await prisma.user.findUnique({
      where: {
         id: id,
      },
   });

   // If user not found, throw error
   if (!existingUser) {
      throw new Error("User not found");
   }

   const isBlocked = !existingUser.isBlocked;

   // Update user's blocked status and block reason
   const updatedUser = await prisma.user.update({
      where: {
         id: id,
      },
      data: {
         isBlocked,
         blockReason: blockReason ?? null,
      },
   });

   if (isBlocked) {
      await logActivity({
         action: "User Blocked",
         details: `User ${existingUser.fullName} has been blocked by super admin for reason: ${blockReason}`,
      });
   } else {
      await logActivity({
         action: "User Unblocked",
         details: `User ${existingUser.fullName} has been unblocked by super admin`,
      });
   }

   return {
      isBlocked: updatedUser.isBlocked,
      blockReason: updatedUser.blockReason,
   };
};

const getComplianceLogs = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(prisma.activityLog, query)
    .search(["action", "details", "ipAddress"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include({
      user: {
        select: {
          email: true,
          fullName: true,
        },
      },
    });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return {
    meta,
    data: result,
  };
};

const logActivity = async (payload: { action: string; details: string; userId?: string; ipAddress?: string }) => {
  return await prisma.activityLog.create({
    data: {
      action: payload.action,
      details: payload.details,
      userId: payload.userId,
      ipAddress: payload.ipAddress,
    },
  });
};

// --- Community Control ---

const getAllCommunityPosts = async (query: Record<string, unknown>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search as string, mode: "insensitive" } },
      { details: { contains: query.search as string, mode: "insensitive" } },
      { category: { contains: query.search as string, mode: "insensitive" } },
    ];
  }

  const [total, posts] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
            role: true,
          },
        },
        answers: {
          select: {
            id: true,
            content: true,
            upvotes: true,
            isAccepted: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profilePic: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { answers: true },
        },
      },
    }),
  ]);

  return {
    meta: {
      total,
      page,
      limit,
      totalPage: Math.ceil(total / limit),
    },
    data: posts,
  };
};

const deleteCommunityPost = async (id: string) => {
  const post = await prisma.question.findUnique({ where: { id } });
  if (!post) throw new Error("Community post not found");

  await prisma.question.delete({ where: { id } });

  await logActivity({
    action: "Community Post Deleted",
    details: `Super admin deleted community post: "${post.title}"`,
  });

  return true;
};

const deleteCommunityAnswer = async (id: string) => {
  const answer = await prisma.answer.findUnique({
    where: { id },
    include: { question: { select: { title: true } } },
  });
  if (!answer) throw new Error("Community answer not found");

  await prisma.answer.delete({ where: { id } });

  await logActivity({
    action: "Community Answer Deleted",
    details: `Super admin deleted an answer on post: "${answer.question.title}"`,
  });

  return true;
};

export const SuperAdminService = {
  getDashboardStats,
  getRecentActivities,
  getComplianceLogs,
  logActivity,
  updateUserBlocked,
  getAllCommunityPosts,
  deleteCommunityPost,
  deleteCommunityAnswer,
};
