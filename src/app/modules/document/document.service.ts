import prisma from "../../utils/prisma";

const uploadDocumentIntoDB = async (payload: any) => {
  const result = await prisma.document.create({
    data: payload,
    include: {
      signatory: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
  return result;
};

const getSingleDocumentFromDB = async (id: string) => {
  const result = await prisma.document.findUnique({
    where: { id },
    include: {
      signatory: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true
        },
      },
      property: true
    },
  });
  return result;
};

const getDocumentsByPropertyFromDB = async (propertyId: string) => {
  const result = await prisma.document.findMany({
    where: { propertyId },
    include: {
      signatory: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

const updateDocumentInDB = async (id: string, payload: any) => {
  const result = await prisma.document.update({
    where: { id },
    data: payload,
    include: {
      signatory: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });
  return result;
};

const deleteDocumentFromDB = async (id: string) => {
  await prisma.document.delete({
    where: { id },
  });
  return null;
};

const signDocumentInDB = async (id: string, signatoryId: string) => {
  const result = await prisma.document.update({
    where: { id, signatoryId },
    data: {
      signedAt: new Date(),
    },
  });
  return result;
};

const getMyDocumentsFromDB = async (userId: string) => {
  const result = await prisma.document.findMany({
    where: { signatoryId: userId },
    include: {
      property: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return result;
};

export const DocumentService = {
  uploadDocumentIntoDB,
  getSingleDocumentFromDB,
  getDocumentsByPropertyFromDB,
  getMyDocumentsFromDB,
  updateDocumentInDB,
  deleteDocumentFromDB,
  signDocumentInDB,
};
