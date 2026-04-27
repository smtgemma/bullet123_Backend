import status from "http-status";
import AppError from "../../errors/AppError";
import prisma from "../../utils/prisma";
import QueryBuilder from "../../builder/QueryBuilder";

// Explicit payload interface to avoid stale Prisma-generated type issues
interface ISuccessStoryPayload {
  userId: string;
  title?: string;
  propertyAddress?: string;
  price?: number | string | null;
  description?: string;
  beforeImages?: string[];
  afterImages?: string[];
  projectCategory?: string | null;
  completedDate?: Date | string | null;
  duration?: string | null;
  roi?: string | null;
}

const createSuccessStory = async (payload: ISuccessStoryPayload) => {
  if (!payload.title || !payload.propertyAddress || !payload.description) {
    throw new AppError(status.BAD_REQUEST, "Title, Property Address, and Description are required!");
  }

  const successStory = await prisma.successStory.create({
    data: {
      title: payload.title,
      propertyAddress: payload.propertyAddress,
      price: payload.price ? parseFloat(payload.price as any) : null,
      description: payload.description,
      beforeImages: payload.beforeImages || [],
      afterImages: payload.afterImages || [],
      projectCategory: payload.projectCategory || null,
      completedDate: payload.completedDate ? new Date(payload.completedDate as any) : null,
      duration: payload.duration || null,
      roi: payload.roi || null,
      userId: payload.userId,
    },
  });

  return successStory;
};

const getSuccessStoryById = async (id: string) => {
  const successStory = await prisma.successStory.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      }
    }
  });
  if (!successStory) throw new AppError(status.NOT_FOUND, "Success Story not found");
  return successStory;
};

const getSuccessStoriesByUserId = async (userId: string, query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(prisma.successStory, query)
    .search(["title", "propertyAddress"])
    .filter()
    .sort()
    .paginate()
    .fields();

  queryBuilder.rawFilter({ userId });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return {
    meta,
    data: result,
  };
};

const getAllSuccessStories = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(prisma.successStory, query)
    .search(["title", "propertyAddress"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include({
      user: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
          role: true
        }
      }
    });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return {
    meta,
    data: result,
  };
};

const updateSuccessStory = async (id: string, userId: string, payload: Partial<ISuccessStoryPayload>) => {
  const existing = await prisma.successStory.findUnique({ where: { id } });
  if (!existing) throw new AppError(status.NOT_FOUND, "Success Story not found");
  if (existing.userId !== userId) throw new AppError(status.FORBIDDEN, "You do not have permission to update this.");

  // Destructure out userId — it must not be passed directly in Prisma's update data
  const { userId: _uid, price, completedDate, ...rest } = payload;

  const updateData: any = {
    ...rest,
    ...(price !== undefined ? { price: parseFloat(price as any) } : {}),
    ...(completedDate !== undefined ? { completedDate: completedDate ? new Date(completedDate as any) : null } : {}),
  };

  const updated = await prisma.successStory.update({
    where: { id },
    data: updateData,
  });
  return updated;
};

const deleteSuccessStory = async (id: string, userId: string) => {
  const existing = await prisma.successStory.findUnique({ where: { id } });
  if (!existing) throw new AppError(status.NOT_FOUND, "Success Story not found");

  if (existing.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "You do not have permission to delete this.");
  }

  await prisma.successStory.delete({
    where: { id },
  });
  return true;
};



export const SuccessStoryServices = {
  createSuccessStory,
  getSuccessStoryById,
  getSuccessStoriesByUserId,
  getAllSuccessStories,
  updateSuccessStory,
  deleteSuccessStory,
};
