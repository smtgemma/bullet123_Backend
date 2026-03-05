// import { UserRole } from "@prisma/client";
// import prisma from "../../utils/prisma";
// import { sendBulkEmail, sendContactEmail, sendUserMessageEmail } from "../../utils/sendEmail";


// // Create Subscriber
// const createSubscriber = async (payload: any) => {
//   const result = await prisma.$transaction(async (tx) => {
//     const subscriber = await tx.subscriber.create({
//       data: {
//         email: payload.email,
//         accepted: payload.accepted ?? false,
//       },
//     });

//     console.log("Subscriber created:", subscriber);
//     return subscriber;
//   });

//   return result;
// };

// // Get All Subscribers
// const getAllSubscribers = async () => {
//   const result = await prisma.subscriber.findMany({
//     orderBy: { createdAt: "desc" },
//   });

//   return result;
// };

// // Get Single Subscriber by ID
// const getSubscriberById = async (id: string) => {
//   const result = await prisma.subscriber.findUnique({
//     where: { id },
//   });

//   return result;
// };

// // Update Subscriber
// const updateSubscriber = async (id: string, payload: any) => {
//   const result = await prisma.$transaction(async (tx) => {
//     const updated = await tx.subscriber.update({
//       where: { id },
//       data: {
//         email: payload.email,
//         accepted: payload.accepted,
//       },
//     });

//     console.log("Subscriber updated:", updated);
//     return updated;
//   });

//   return result;
// };

// // Delete Subscriber
// const deleteSubscriber = async (id: string) => {
//   const result = await prisma.$transaction(async (tx) => {
//     const deleted = await tx.subscriber.delete({
//       where: { id },
//     });

//     console.log("Subscriber deleted:", deleted);
//     return deleted;
//   });

//   return result;
// };
// const sendPromotion = async (payload: { subject: string; message: string }) => {

//   const subscribers = await prisma.user.findMany({where:{role:UserRole.USER},
//     select: { email: true },
//   });

  
//   const emails = subscribers.map(sub => sub.email);


//   const sendEmail = await sendBulkEmail(emails, payload.subject,payload.message);

//   return sendEmail;
// };


// const sendPromotionForSubscrober = async (payload: { subject: string; message: string }) => {

//   const subscribers = await prisma.subscriber.findMany({
//     select: { email: true },
//   });

//   const emails = subscribers.map(sub => sub.email);


//   const sendEmail = await sendBulkEmail(emails, payload.subject,payload.message);

//   return sendEmail;
// };




// const sendSingleEmailFromUserToUser = async (payload: {
//   currentUserId: string;
//   userId: string;
//   subject?: string;
//   message: string;
// }) => {
//   const { currentUserId, userId, subject, message } = payload;

//   const sender = await prisma.user.findUnique({
//     where: { id: currentUserId },
//     select: { fullName: true, email: true },
//   });

//   if (!sender?.email) {
//     throw new Error("Sender not found");
//   }

//   // receiver
//   const receiver = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { email: true },
//   });

//   if (!receiver?.email) {
//     throw new Error("Receiver email not found");
//   }

//   await sendUserMessageEmail(receiver.email, {
//     senderName: sender.fullName || "System User",
//     senderEmail: sender.email,
//     subject: subject || "New Message",
//     message: message,
//   });

//   return {
//     success: true,
//     message: "Email sent successfully",
//   };
// };

// export const SubscriberService={
//     createSubscriber,
//     getAllSubscribers,
//     getSubscriberById,updateSubscriber,deleteSubscriber,
//     sendPromotion,
//     sendPromotionForSubscrober,sendSingleEmailFromUserToUser
// }


import { UserRole } from "@prisma/client";
import prisma from "../../utils/prisma";
import { sendBulkEmail, sendUserMessageEmail } from "../../utils/sendEmail";
import QueryBuilder from "../../builder/QueryBuilder";



const createSubscriber = async (payload: any) => {
  if (!payload?.email) {
    throw new Error("Email is required");
  }

  const email = payload.email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email format");
  }

  const domain = email.split("@")[1];



  const existing = await prisma.subscriber.findUnique({
    where: { email },
  });

  if (existing) {
    if (existing.status === "BLOCKED") {
      throw new Error("This email is blocked");
    }

    if (existing.status === "UNSUBSCRIBED") {
      return prisma.subscriber.update({
        where: { email },
        data: {
          status: "ACTIVE",
          accepted: true,
          unsubscribedAt: null,
        },
      });
    }

    return existing;
  }

  return prisma.subscriber.create({
    data: {
      email,
      status: "ACTIVE",
    },
  });
};

const getAllSubscribers = async (query: Record<string, any>) => {

  const queryBuilder = new QueryBuilder(prisma.subscriber, query)
    .search(["email"]) 
    .filter()
    .sort()
    .paginate();

  const [subscribers, pagination] = await Promise.all([
    queryBuilder.execute(),
    queryBuilder.countTotal(),
  ]);

  return {
    subscribers,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPage: pagination.totalPage,
    },
  };
};
const getSubscriberById = async (id: string) => {
  return prisma.subscriber.findUnique({ where: { id } });
};


const updateSubscriber = async (id: string, payload: any) => {
  return prisma.subscriber.update({
    where: { id },
    data: {
      email: payload.email?.toLowerCase(),
      accepted: payload.accepted,
    },
  });
};

const deleteSubscriber = async (id: string) => {
  return prisma.subscriber.delete({
    where: { id },
    
  });
};


const blockSubscriber = async (id: string) => {
  return prisma.subscriber.update({
    where: { id },
    data: {
      status: "BLOCKED",
      blockedAt: new Date(),
    },
  });
};


const bulkUpdateSubscriberStatus = async (
  ids: string[],
  status: "BLOCKED" | "UNSUBSCRIBED"
) => {
  return prisma.subscriber.updateMany({
    where: { id: { in: ids } },
    data: {
      status,
      blockedAt: status === "BLOCKED" ? new Date() : null,
      unsubscribedAt: status === "UNSUBSCRIBED" ? new Date() : null,
    },
  });
};




const sendPromotion = async (payload: {
  subject: string;
  message: string;
}) => {
  const users = await prisma.user.findMany({
    where: { role: UserRole.USER },
    select: { email: true },
  });

  const emails = users.map((u) => u.email);

  if (!emails.length) {
    throw new Error("No users found");
  }

  return sendBulkEmail(emails, payload.subject, payload.message);
};

const sendPromotionForSubscriber = async (payload: {
  subject: string;
  message: string;
}) => {
  const subscribers = await prisma.subscriber.findMany({
    where: {
      status: "ACTIVE",
      accepted: true,
    },
    select: { email: true },
  });

  const emails = subscribers.map((s) => s.email);

  if (!emails.length) {
    throw new Error("No active subscribers found");
  }

  return sendBulkEmail(emails, payload.subject, payload.message);
};

const sendSingleEmailFromUserToUser = async (payload: {
  currentUserId: string;
  userId: string;
  subject?: string;
  message: string;
}) => {
  const { currentUserId, userId, subject, message } = payload;

  const sender = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { fullName: true, email: true },
  });

  if (!sender?.email) {
    throw new Error("Sender not found");
  }

  const receiver = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!receiver?.email) {
    throw new Error("Receiver email not found");
  }

  await sendUserMessageEmail(receiver.email, {
    senderName: sender.fullName || "System User",
    senderEmail: sender.email,
    subject: subject || "New Message",
    message,
  });

  return {
    success: true,
    message: "Email sent successfully",
  };
};

const bulkDeleteSubscriber = async (ids: string[]) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error("Ids array is required");
  }

  return prisma.subscriber.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
    
  });
};

const bulkBlockSubscriber = async (ids: string[]) => {
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw new Error("Ids array is required");
  }

  return prisma.subscriber.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: {
      status: "BLOCKED",
      blockedAt: new Date(),
    },
  });
};
export const SubscriberService = {
  createSubscriber,
  getAllSubscribers,
  getSubscriberById,
  updateSubscriber,
  deleteSubscriber,
  blockSubscriber,
  bulkUpdateSubscriberStatus,

  sendPromotion,
  sendPromotionForSubscriber,
  sendSingleEmailFromUserToUser,
  bulkDeleteSubscriber,
  bulkBlockSubscriber
};