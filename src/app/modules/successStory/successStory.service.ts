import status from "http-status";
import AppError from "../../errors/AppError";
import prisma from "../../utils/prisma";
import QueryBuilder from "../../builder/QueryBuilder";
import { SuccessStory } from "@prisma/client";

const createSuccessStory = async (payload: Partial<SuccessStory> & { userId: string }) => {
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

const updateSuccessStory = async (id: string, userId: string, payload: Partial<SuccessStory>) => {
  const existing = await prisma.successStory.findUnique({ where: { id } });
  if (!existing) throw new AppError(status.NOT_FOUND, "Success Story not found");
  if (existing.userId !== userId) throw new AppError(status.FORBIDDEN, "You do not have permission to delete this.");

  // Transform potential string price to float if needed
  if (payload.price) {
    payload.price = parseFloat(payload.price as any);
  }

  const updated = await prisma.successStory.update({
    where: { id },
    data: payload,
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
