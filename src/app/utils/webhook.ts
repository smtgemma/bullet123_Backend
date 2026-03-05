import Stripe from "stripe";
import prisma from "./prisma";
import status from "http-status";
import { PaymentStatus, Interval } from "@prisma/client";
import AppError from "../errors/AppError";


const calculateEndDate = (startDate: Date, interval: Interval): Date => {
  const endDate = new Date(startDate);

  switch (interval) {
    case "month":
      endDate.setMonth(endDate.getMonth() + 1);

      if (endDate.getDate() !== startDate.getDate()) {
        endDate.setDate(0); 
      }
      break;
    case "year":
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      throw new AppError(
        status.BAD_REQUEST,
        `Unsupported interval: ${interval}`
      );
  }

  return endDate;
};

const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const payment = await prisma.subscription.findFirst({
    where: { stripePaymentId: paymentIntent.id },
    include: {
      user:true,
      plan: {
        include: {
          featuredItems: {
            include: {
              featuredItem: true,
            },
          },
        },
      },
    },
  });

  if (!payment) throw new AppError(status.NOT_FOUND, `Payment not found for ID: ${paymentIntent.id}`);
  if (!payment.plan) throw new AppError(status.NOT_FOUND, "Plan not found for this subscription");
  if (paymentIntent.status !== "succeeded") throw new AppError(status.BAD_REQUEST, "Payment intent is not in succeeded state");

  const startDate = new Date();
  const endDate = calculateEndDate(startDate, payment.plan.interval);

  
  const artworkSlotItem = payment.plan.featuredItems.find(
    (item) => item.featuredItem.key === "artwork_slots"
  );
  const planSlots = artworkSlotItem?.limit || 0;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: payment.userId },
      data: {
        isSubscribed: true,
        planExpiration: endDate,
      },
    }),

    prisma.subscription.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        startDate,
        endDate,
      },
    }),

    prisma.notification.create({
      data: {
        userId: payment.userId,
     
        message: `Subscription activated: ${payment.plan.planName} plan`,
      },
    }),
  ]);

  console.log(`Payment succeeded for user ${payment.userId} - Plan: ${payment.plan.planName}`);
};

const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
) => {
 
  const payment = await prisma.subscription.findFirst({
    where: { stripePaymentId: paymentIntent.id },
    include: {
      plan: true,
    },
  });

  if (!payment) {
    throw new AppError(
      status.NOT_FOUND,
      `Payment not found for ID: ${paymentIntent.id}`
    );
  }

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: payment.id },
      data: {
        paymentStatus: PaymentStatus.CANCELED,
        endDate: new Date(),
      },
    }),

    prisma.notification.create({
      data: {
        userId: payment.userId,
        message: `Subscription payment failed for ${payment.plan?.planName || "your plan"}`,
      },
    }),
  ]);

  console.log(
    `Payment failed for user ${payment.userId} - Subscription ID: ${payment.id}`
  );
};

export { handlePaymentIntentSucceeded, handlePaymentIntentFailed };