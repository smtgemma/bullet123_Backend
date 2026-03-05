import status from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { SubscriptionServices } from "./subscription.service";
import { get } from "http";

const createSubscription = catchAsync(async (req, res) => {
  const userId = req?.user?.id as string;
 
  const { planId } = req.body;
  console.log("createSubscription - planId:", req.body);
  const result = await SubscriptionServices.createSubscription(userId, planId);

  sendResponse(res, {
    statusCode: status.CREATED,
    message: "Subscription Created successfully.",
    data: result,
  });
});

const getAllSubscription = catchAsync(async (req, res) => {
  const results = await SubscriptionServices.getAllSubscriptions(req.query);
  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscriptions retrieved successfully",
    meta: results.meta,
    data: results.data,
  });
});

const getSingleSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.getSingleSubscription(
    req.params.subscriptionId
  );
  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscription retrieved successfully",
    data: result,
  });
});

const getMySubscription = catchAsync(async (req, res) => {
  const userId = req?.user?.id as string;

  const result = await SubscriptionServices.getMySubscription(userId);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscription retrieved successfully.",
    data: result,
  });
});

const updateSubscription = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;

  const result = await SubscriptionServices.updateSubscription(
    subscriptionId,
    req.body
  );
  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscription updated successfully.",
    data: result,
  });
});

const deleteSubscription = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.deleteSubscription(
    req.params.subscriptionId
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "Subscription deleted successfully.",
    data: result,
  });
});

const handleStripeWebhook = catchAsync(async (req, res) => {
  const result = await SubscriptionServices.HandleStripeWebhook(req.body);

  sendResponse(res, {
    statusCode: status.OK,
    message: "Webhook event trigger successfully",
    data: result,
  });
});




const cancelSubscription = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;
  const userId = req?.user?.id as string;

  const result = await SubscriptionServices.cancelSubscription(
    subscriptionId,
    userId
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
    data: result.subscription,
  });
});


const reactivateSubscription = catchAsync(async (req, res) => {
  const { subscriptionId } = req.params;
  const userId = req?.user?.id as string;

  const result = await SubscriptionServices.reactivateSubscription(
    subscriptionId,
    userId
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: result.message,
    data: result.subscription,
  });
});

const confirmPayment = catchAsync(async (req, res) => {
  const userId = req?.user?.id as string;
  const { paymentMethodId } = req.body;

  const result = await SubscriptionServices.confirmPayment(
    userId,
    paymentMethodId
  );

  sendResponse(res, {
    statusCode: status.OK,
    message: "Payment confirmed successfully",
    data:result,
  });
});
export const SubscriptionController = {
  createSubscription,
  getAllSubscription,
  getMySubscription,
  handleStripeWebhook,
  getSingleSubscription,
  updateSubscription,
  deleteSubscription,
 cancelSubscription,
 reactivateSubscription,
 confirmPayment
};
