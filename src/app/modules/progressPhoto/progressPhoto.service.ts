import prisma from "../../utils/prisma";
import { IProgressPhoto } from "./progressPhoto.interface";

const uploadProgressPhotoIntoDB = async (payload: { propertyId: string; urls: string[]; uploaderId: string }) => {
  const { propertyId, urls, uploaderId } = payload;

  const results = await prisma.$transaction(
    urls.map((url) =>
      prisma.progressPhoto.create({
        data: {
          url,
          propertyId,
          uploaderId,
        },
        include: {
          uploader: {
            select: {
              id: true,
              fullName: true,
              profilePic: true,
            },
          },
        },
      })
    )
  );

  return results;
};

const getProgressPhotosByPropertyFromDB = async (propertyId: string) => {
  const result = await prisma.progressPhoto.findMany({
    where: { propertyId },
    include: {
      uploader: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const getSingleProgressPhotoFromDB = async (id: string) => {
  const result = await prisma.progressPhoto.findUnique({
    where: { id },
    include: {
      uploader: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
        },
      },
      property: true,
    },
  });
  return result;
};

const updateProgressPhotoInDB = async (id: string, payload: Partial<IProgressPhoto>) => {
  const result = await prisma.progressPhoto.update({
    where: { id },
    data: payload,
    include: {
      uploader: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
        },
      },
    },
  });
  return result;
};

const deleteProgressPhotoFromDB = async (id: string) => {
  await prisma.progressPhoto.delete({
    where: { id },
  });
  return null;
};

export const ProgressPhotoService = {
  uploadProgressPhotoIntoDB,
  getProgressPhotosByPropertyFromDB,
  getSingleProgressPhotoFromDB,
  updateProgressPhotoInDB,
  deleteProgressPhotoFromDB,
};
