

import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SubscriberService } from "./subscrober.services";


export const createSubscriber = catchAsync(async (req, res) => {
  const { email, accepted } = req.body;

  if (!email) {
    throw new Error("Email is required");
  }

  const result = await SubscriberService.createSubscriber({
    email,
    accepted: accepted ?? false,
  });

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Subscriber created successfully!",
    data: result,
  });
});


export const getAllSubscribers = catchAsync(async (req, res) => {
  const result = await SubscriberService.getAllSubscribers(req.query);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscribers retrieved successfully!",
    data: result.subscribers,
    meta:result.pagination
  });
});

export const getSubscriberById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await SubscriberService.getSubscriberById(id);

  if (!result) {
    throw new Error("Subscriber not found");
  }

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscriber retrieved successfully!",
    data: result,
  });
});


export const updateSubscriber = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await SubscriberService.updateSubscriber(id, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscriber updated successfully!",
    data: result,
  });
});



export const deleteSubscriber = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await SubscriberService.deleteSubscriber(id);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscriber deleted successfully!",
    data: result,
  });
});


export const blockSubscriber = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await SubscriberService.blockSubscriber(id);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscriber blocked successfully!",
    data: result,
  });
});

export const bulkUpdateSubscriberStatus = catchAsync(async (req, res) => {
  const { ids, status: newStatus } = req.body;

  const result = await SubscriberService.bulkUpdateSubscriberStatus(
    ids,
    newStatus
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "Bulk action completed successfully!",
    data: result,
  });
});


export const sendPromotion = catchAsync(async (req, res) => {
  const result = await SubscriberService.sendPromotion(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Promotion email sent successfully!",
    data: result,
  });
});

export const sendPromotionForSubscrober = catchAsync(async (req, res) => {
  const result = await SubscriberService.sendPromotionForSubscriber(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscriber promotion email sent successfully!",
    data: result,
  });
});

export const sendSingleEmail = catchAsync(async (req, res) => {
  const currentUserId = req.user?.id;
  const { userId, subject, message } = req.body;

  if (!currentUserId) {
    throw new Error("Unauthorized");
  }

  if (!userId || !message) {
    throw new Error("userId and message are required");
  }

  await SubscriberService.sendSingleEmailFromUserToUser({
    currentUserId,
    userId,
    subject,
    message,
  });

  sendResponse(res, {
    statusCode: status.OK,
    message: "Email sent successfully!",
  });
});

export const bulkDeleteSubscriber = catchAsync(async (req, res) => {
  const { ids } = req.body;

  const result = await SubscriberService.bulkDeleteSubscriber(ids);

  sendResponse(res, {
    statusCode: 200,
    message: "Bulk email deleted successful",
    data: result,
  });
});

const bulkBlockSubscriber = catchAsync(async (req, res) => {
  const { ids } = req.body;

  console.log(ids)
  const result = await SubscriberService.bulkBlockSubscriber(ids);

  sendResponse(res, {
    statusCode: 200,
    message: "Bulk block successful",
    data: result,
  });
});
export const subscriberController = {
  createSubscriber,
  getAllSubscribers,
  getSubscriberById,
  updateSubscriber,
  deleteSubscriber,
  blockSubscriber,
  bulkUpdateSubscriberStatus,
  sendPromotion,
  sendPromotionForSubscrober,
  sendSingleEmail,
  bulkDeleteSubscriber,
  bulkBlockSubscriber
};