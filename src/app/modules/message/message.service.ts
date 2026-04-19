import prisma from "../../utils/prisma";
import { IMessage } from "./message.interface";

const sendMessageToDB = async (payload: IMessage) => {
  const result = await prisma.message.create({
    data: payload,
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
          role: true,
        },
      },
      receiver: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
          role: true,
        },
      },
    },
  });

  return result;
};

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
      receiver: {
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

const getConversationWithUserFromDB = async (userId: string, targetUserId: string) => {
  const result = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: userId },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          fullName: true,
          profilePic: true,
          role: true,
        },
      },
      receiver: {
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

const getMyConversationsFromDB = async (userId: string) => {
  // Find all messages involving the user
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: {
      sender: {
        select: { id: true, fullName: true, email: true, profilePic: true, role: true },
      },
      receiver: {
        select: { id: true, fullName: true, email: true, profilePic: true, role: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Extract unique users (others) and their last message
  const conversationsMap = new Map();

  for (const msg of messages) {
    const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!otherUser) continue; // Property message without specific receiver

    if (!conversationsMap.has(otherUser.id)) {
      conversationsMap.set(otherUser.id, {
        user: otherUser,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt,
        isRead: msg.senderId === userId ? true : msg.isRead,
      });
    }
  }

  return Array.from(conversationsMap.values());
};

export const MessageService = {
  sendMessageToDB,
  getMessagesByPropertyFromDB,
  getConversationWithUserFromDB,
  getMyConversationsFromDB,
};
