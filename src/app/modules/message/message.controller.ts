import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { MessageService } from "./message.service";

const sendMessage = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await MessageService.sendMessageToDB({
    ...req.body,
    senderId: userId,
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: "Message sent successfully!",
    data: result,
  });
});

const getMessagesByProperty = catchAsync(async (req, res) => {
  const { propertyId } = req.params;
  const result = await MessageService.getMessagesByPropertyFromDB(propertyId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Messages retrieved successfully!",
    data: result,
  });
});

const getConversationWithUser = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const { targetUserId } = req.params;
  const result = await MessageService.getConversationWithUserFromDB(userId, targetUserId as string);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Conversation retrieved successfully!",
    data: result,
  });
});

const getMyConversations = catchAsync(async (req, res) => {
  const userId = req.user?.id as string;
  const result = await MessageService.getMyConversationsFromDB(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Conversations retrieved successfully!",
    data: result,
  });
});

export const MessageController = {
  sendMessage,
  getMessagesByProperty,
  getConversationWithUser,
  getMyConversations,
};
