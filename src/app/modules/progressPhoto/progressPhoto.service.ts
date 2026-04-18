import prisma from "../../utils/prisma";

const uploadProgressPhotoIntoDB = async (payload: any) => {
  const result = await prisma.progressPhoto.create({
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

const deleteProgressPhotoFromDB = async (id: string) => {
  await prisma.progressPhoto.delete({
    where: { id },
  });
  return null;
};

export const ProgressPhotoService = {
  uploadProgressPhotoIntoDB,
  getProgressPhotosByPropertyFromDB,
  deleteProgressPhotoFromDB,
};
