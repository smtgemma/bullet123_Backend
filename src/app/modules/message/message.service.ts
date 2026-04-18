import prisma from "../../utils/prisma";

const getMessagesByPropertyFromDB = async (propertyId: string) => {
  const result = await prisma.message.findMany({
    where: { propertyId },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return result;
};

export const MessageService = {
  getMessagesByPropertyFromDB,
};
