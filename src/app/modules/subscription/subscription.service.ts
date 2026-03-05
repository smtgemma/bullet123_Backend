
import Stripe from "stripe";
import status from "http-status";
import prisma from "../../utils/prisma";
import { stripe } from "../../utils/stripe";
import AppError from "../../errors/AppError";
import { PlanType, SubscriptionStatus } from "@prisma/client";
import QueryBuilder from "../../builder/QueryBuilder";
import { sendNudgeEmail, sendSubscriptionEmail } from "../../utils/sendEmail";
import cron from "node-cron";

const getEffectivePrice = (plan: any): number => {
  const now = new Date();

  const isDiscountValid =
    plan.hasDiscount &&
    plan.discountType &&
    plan.discountValue &&
    (!plan.discountStartDate || new Date(plan.discountStartDate) <= now) &&
    (!plan.discountEndDate || new Date(plan.discountEndDate) >= now);

  if (!isDiscountValid) return plan.price;

  if (plan.discountType === "PERCENTAGE") {
    return parseFloat((plan.price - (plan.price * plan.discountValue) / 100).toFixed(2));
  }

  if (plan.discountType === "FIXED_AMOUNT") {
    return parseFloat(Math.max(0, plan.price - plan.discountValue).toFixed(2));
  }

  return plan.price;
};
const createSubscription = async (userId: string, planId: string) => {

  
  return await prisma.$transaction(async (tx) => {

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(status.NOT_FOUND, "User not found");

    const plan = await tx.plan.findUnique({
      where: { id: planId },
      include: { featuredItems: { include: { featuredItem: true } } },
    });
    if (!plan) throw new AppError(status.NOT_FOUND, "Plan not found");
 
  const existingSubscriptions = await tx.subscription.findFirst({
  where: {
    userId,
    plan: {
      planType: {
        not: "FREE"
      }
    },
    OR: [
      { status: { in: ["ACTIVE", "TRIALING"] } },
      { paymentStatus: { in: ["COMPLETED"] } }
    ]
  },
  include: {
    plan: true
  }
});


    if (existingSubscriptions) {
      throw new AppError(
        status.BAD_REQUEST,
        `You already have an active subscription. Please cancel your current subscription before subscribing to a new plan.`
      );
    }

    const pendingSubscriptions = await tx.subscription.findMany({
      where: { 
        userId,
        OR: [
          { status: "INCOMPLETE"},
          { paymentStatus: "PENDING" }
        ]
      },
    });

    if (plan.planType === "FREE") {
      

      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          planId,
          startDate: new Date(),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          stripeSubscriptionId: "FREE_PLAN",
          stripeCustomerId: "FREE_PLAN",
          amount: 0,
          paymentStatus: "COMPLETED",
          status: "ACTIVE",
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          autoRenew: false,
        },
      });

      const artworkSlotItem = plan.featuredItems.find(
        (item) => item.featuredItem.key === "artwork_slots"
      );
      const planSlots = artworkSlotItem?.limit || 0;

      await tx.user.update({
        where: { id: user.id },
        data: {
          isSubscribed: true,
        
        },
      });

      return { subscription, planType: "FREE", planDetails: plan };
    }

    if (!plan.priceId) {
      throw new AppError(status.BAD_REQUEST, "Plan not configured for auto-renewal");
    }


    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName || '',
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await tx.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

 
    const existingSubscription = await tx.subscription.findFirst({
      where: { 
        userId: user.id, 
        plan:{
          planType:{
            not:PlanType.FREE
          }
        },
        status: { in: ["ACTIVE", "TRIALING"] }
      },
    });
    if (existingSubscription) {
      throw new AppError(status.BAD_REQUEST, "You already have an active subscription");
    }

    // const stripeSubscription: any = await stripe.subscriptions.create({
    //   customer: stripeCustomerId,
    //   items: [{ price: plan.priceId }],
    //   payment_behavior: 'default_incomplete',
    //   payment_settings: {
    //     payment_method_types: ['card'],
    //     save_default_payment_method: 'on_subscription',
    //   },
    //   expand: ['latest_invoice.payment_intent'],
    //   metadata: { userId: user.id, planId },
    // });

    const finalPrice = getEffectivePrice(plan);

const stripeSubscription: any = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [
    {
      price_data: {
        currency: plan.currency,
        unit_amount: Math.round(finalPrice * 100),
        recurring: { interval: plan.interval as any },
        product: plan.productId,
      },
    },
  ],
  payment_behavior: 'default_incomplete',
  payment_settings: {
    payment_method_types: ['card'],
    save_default_payment_method: 'on_subscription',
  },
  expand: ['latest_invoice.payment_intent'],
  metadata: { userId: user.id, planId },
});

    const latestInvoice = stripeSubscription.latest_invoice;
    const paymentIntent = latestInvoice?.payment_intent;

    const currentPeriodStart = new Date((stripeSubscription.current_period_start || stripeSubscription.currentPeriodStart || Date.now() / 1000) * 1000);
    const currentPeriodEnd = new Date((stripeSubscription.current_period_end || stripeSubscription.currentPeriodEnd || (Date.now() / 1000 + 2592000)) * 1000);
    

    let endDate: Date | null = null;
    if (plan.interval === "month") {
      endDate = new Date(currentPeriodEnd);
    } else if (plan.interval === "year") {
      endDate = new Date(currentPeriodEnd);
    } else if (plan.interval === "lifetime") {
      endDate = null;
    }

  
    const dbSubscription = await tx.subscription.create({
      data: {
        userId: user.id,
        planId,
        startDate: new Date(),
        currentPeriodStart,
        currentPeriodEnd,
        stripeSubscriptionId: stripeSubscription.id,
        stripeCustomerId,
        amount: finalPrice,
        paymentStatus: "PENDING",
        status: (stripeSubscription.status || 'active').toUpperCase(),
        nextPaymentDate: currentPeriodEnd,
        endDate,
        autoRenew: true,
      },
    });

    return {
      subscription: dbSubscription,
      clientSecret: paymentIntent?.client_secret || null,
      paymentIntentId: paymentIntent?.id || null,
      subscriptionId: stripeSubscription.id,
      planType: "subscription",
      planDetails: plan,
    };
  }, {
    maxWait: 10000,
    timeout: 30000,
  });
};



const handlePaymentIntentSucceeded = async (paymentIntent: Stripe.PaymentIntent) => {
  const { userId, planId } = paymentIntent.metadata;
  if (!userId || !planId) {
    console.log("⚠️ Missing userId or planId in payment intent metadata");
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      console.log("plan buy success fully")
      const user = await tx.user.findUnique({ where: { id: userId } });
      const plan = await tx.plan.findUnique({
        where: { id: planId },
        include: { featuredItems: { include: { featuredItem: true } } },
      });

      if (!user || !plan) {
        console.log("⚠️ User or plan not found");
        return;
      }

      const subscription = await tx.subscription.findFirst({
        where: { userId: user.id, planId: plan.id },
      });

      if (subscription) {
        await tx.subscription.update({
          where: { id: subscription.id },
          data: { 
            paymentStatus: "COMPLETED", 
            lastPaymentDate: new Date(),
            status: "ACTIVE"
          },
        });
      }

      const artworkSlotItem = plan.featuredItems.find(
        (item) => item.featuredItem.key === "artwork_slots"
      );
      const planSlots = artworkSlotItem?.limit || 0;

      await tx.user.update({
        where: { id: userId },
        data: {
          isSubscribed: true,

        },
      });

      console.log(`✅ Payment succeeded for user ${userId}`);
    });
  } catch (error) {
    console.error(" Error handling payment intent succeeded:", error);
    throw error;
  }
};


const handleInvoicePaymentSucceeded = async (invoice: Stripe.Invoice) => {

  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;

  if (!subscriptionId) {
    console.log("⚠️ No subscription ID in invoice");
    return;
  }

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      include: { plan: true },
    });

    if (!subscription) {
      console.log(`⚠️ Subscription not found for ${subscriptionId}`);
      return;
    }

    await prisma.$transaction(async (tx) => {
      const currentDate = new Date();
      let nextPeriodEnd = new Date(currentDate);
      
      if (subscription.plan.interval === "month") {
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + (subscription.plan.intervalCount || 1));
      } else if (subscription.plan.interval === "year") {
        nextPeriodEnd.setFullYear(nextPeriodEnd.getFullYear() + (subscription.plan.intervalCount || 1));
      }

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          paymentStatus: "COMPLETED",
          lastPaymentDate: new Date(),
          nextPaymentDate: nextPeriodEnd,
          currentPeriodEnd: nextPeriodEnd,
          currentPeriodStart: currentDate,
          renewalAttempts: { increment: 1 },
          status: "ACTIVE",
        },
      });

      const plan = await tx.plan.findUnique({
        where: { id: subscription.planId },
        include: { featuredItems: { include: { featuredItem: true } } },
      });

      if (plan) {
        const artworkSlotItem = plan.featuredItems.find(
          (item) => item.featuredItem.key === "artwork_slots"
        );
        const planSlots = artworkSlotItem?.limit || 0;

        await tx.user.update({
          where: { id: subscription.userId },
          data: { 
            isSubscribed: true,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId: subscription.userId,
          message: `Your subscription has been automatically renewed. Next billing date: ${nextPeriodEnd.toLocaleDateString()}`,
          isRead: false,
        },
      });

      console.log(`✅ Invoice payment succeeded for subscription ${subscription.id}`);
    });
  } catch (error) {
    console.error("❌ Error handling invoice payment succeeded:", error);
    throw error;
  }
};

const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
 
  const subscriptionId = typeof (invoice as any).subscription === 'string' 
    ? (invoice as any).subscription 
    : (invoice as any).subscription?.id;

  if (!subscriptionId) return;

  try {
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
      include: { user: true },
    });

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        paymentStatus: "FAILED",
        status: "PAST_DUE",
        renewalAttempts: { increment: 1 },
      },
    });

    if (subscription) {
      await prisma.notification.create({
        data: {
          userId: subscription.userId,
        message: 'Your subscription renewal payment failed. Please update your payment method to avoid service interruption.',
          isRead: false,
        },
      });
    }

    console.log(`❌ Invoice payment failed for subscription ${subscriptionId}`);
  } catch (error) {
    console.error("❌ Error handling invoice payment failed:", error);
    throw error;
  }
};
const handleCustomerSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  try {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscription.id },
    });

    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: "CANCELED",
        paymentStatus: "CANCELED",
        cancelAtPeriodEnd: false,
        autoRenew: false, 
      },
    });

    
    if (dbSubscription) {
      await prisma.user.update({
        where: { id: dbSubscription.userId },
        data: {
          isSubscribed: false,
        },
      });

  
      await prisma.notification.create({
        data: {
          userId: dbSubscription.userId,
          message: 'Your subscription has been cancelled.',
          isRead: false,
        },
      });
    }

    console.log(`🚫 Subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error("❌ Error handling subscription deleted:", error);
    throw error;
  }
};


const cancelSubscription = async (subscriptionId: string, userId?: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) throw new AppError(status.NOT_FOUND, "Subscription not found");


  if (userId && subscription.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Not authorized to cancel this subscription");
  }


  if (subscription.stripeSubscriptionId === "FREE_PLAN") {
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { 
        status: "CANCELED",
        cancelAtPeriodEnd: false,
      },
    });

    await prisma.user.update({
      where: { id: subscription.userId },
      data: { isSubscribed: false },
    });

    return {
      message: "Free subscription cancelled immediately",
      subscription: updated,
    };
  }


  if (!subscription.stripeSubscriptionId) {
    throw new AppError(status.BAD_REQUEST, "Not a valid subscription");
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { cancelAtPeriodEnd: true },
  });
  const user = await prisma.user.findUnique({ 
    where: { id: subscription.userId } 
  });

  if (user) {
    await sendSubscriptionEmail(user.email, "CANCEL", {
      fullName: user.fullName,
      planName: subscription.planId,
      planType: "",
      cancelDate: subscription.currentPeriodEnd?.toLocaleDateString(),
    });
  }
  return {
    message: `Subscription will cancel on ${subscription.currentPeriodEnd?.toLocaleDateString()}`,
    subscription: updated,
  };
};


const reactivateSubscription = async (subscriptionId: string, userId?: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) throw new AppError(status.NOT_FOUND, "Subscription not found");


  if (userId && subscription.userId !== userId) {
    throw new AppError(status.FORBIDDEN, "Not authorized to reactivate this subscription");
  }

  if (!subscription.stripeSubscriptionId || subscription.stripeSubscriptionId === "FREE_PLAN") {
    throw new AppError(status.BAD_REQUEST, "Cannot reactivate this subscription");
  }

  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  const updated = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { 
      cancelAtPeriodEnd: false,
      autoRenew: true, 
    },
  });

  return {
    message: "Subscription auto-renewal reactivated",
    subscription: updated,
  };
};

const getMySubscription = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");

  const result = await prisma.subscription.findMany({
    where: { 
      userId,
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } 
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isSubscribed: true,
        },
      },
      plan: {
        include: {
          featuredItems: { include: { featuredItem: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!result) throw new AppError(status.NOT_FOUND, "No active subscription found");
  return result;
};


const getAllSubscriptions = async (query: Record<string, any>) => {
 
  const queryBuilder = new QueryBuilder(prisma.subscription, query);

  const subscriptions = await queryBuilder
    .search([""])
    .paginate()
    .fields()
    .include({
     user: {
  select: {
    id: true,
    fullName: true,
    email: true,
    profilePic: true,
    role: true,
    isSubscribed: true,
  },
},
      plan: {
        include: {
          featuredItems: { include: { featuredItem: true } },
        },
      },
    })
    .execute();

  const meta = await queryBuilder.countTotal();
  return { meta, data: subscriptions };
};

const getSingleSubscription = async (subscriptionId: string) => {
  const result = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isSubscribed: true,
        },
      },
      plan: {
        include: {
          featuredItems: { include: { featuredItem: true } },
        },
      },
    },
  });

  if (!result) throw new AppError(status.NOT_FOUND, "Subscription not found");
  return result;
};


const updateSubscription = async (subscriptionId: string, data: any) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) throw new AppError(status.NOT_FOUND, "Subscription not found");

  const result = await prisma.subscription.update({
    where: { id: subscriptionId },
    data,
    include: {
      plan: {
        include: {
          featuredItems: { include: { featuredItem: true } },
        },
      },
    },
  });
  return result;
};


const deleteSubscription = async (subscriptionId: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) throw new AppError(status.NOT_FOUND, "Subscription not found");

  if (subscription.stripeSubscriptionId && subscription.stripeSubscriptionId !== "FREE_PLAN") {
    try {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    } catch (error) {
      console.error("Error cancelling Stripe subscription:", error);
   
    }
  }


  await prisma.user.update({
    where: { id: subscription.userId },
    data: { isSubscribed: false },
  });

  await prisma.subscription.delete({ where: { id: subscriptionId } });
  return { message: "Subscription deleted successfully" };
};


const HandleStripeWebhook = async (event: Stripe.Event) => {
  try {
    console.log(`📥 Received webhook: ${event.type}`);

    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case "customer.subscription.deleted":
        await handleCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { 
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            status: subscription.status as SubscriptionStatus,
          },
        });
        break;
      
      default:
        console.log(`⚠️ Unhandled event: ${event.type}`);
    }
    
    return { received: true };
  } catch (error: any) {
    console.error("❌ Webhook error:", error);
    throw new AppError(status.INTERNAL_SERVER_ERROR, `Webhook handling failed: ${error.message}`);
  }
};




const attachPaymentMethod = async (paymentMethodId: string, customerId: string) => {
  const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  return paymentMethod;
};

const updateSubscriptionPaymentMethod = async (
  stripeSubscriptionId: string,
  paymentMethodId: string
) => {
  const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
    default_payment_method: paymentMethodId,
  });

  return subscription;
};

const payInvoice = async (invoiceId: string) => {
  const invoice = await stripe.invoices.pay(invoiceId);
  return invoice;
};

const confirmPayment = async (userId: string, paymentMethodId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(status.NOT_FOUND, "User not found");
  if (!user.stripeCustomerId) throw new AppError(status.BAD_REQUEST, "No Stripe customer found");
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      OR: [
        { status: { in: ["INCOMPLETE", "ACTIVE", "PAST_DUE"] } },
        { paymentStatus: "PENDING" },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  if (!subscription?.stripeSubscriptionId) {
    throw new AppError(status.NOT_FOUND, "No subscription found");
  }

  await attachPaymentMethod(paymentMethodId, user.stripeCustomerId);

  await updateSubscriptionPaymentMethod(
    subscription.stripeSubscriptionId,
    paymentMethodId
  );

  const stripeSubscription = await stripe.subscriptions.retrieve(
    subscription.stripeSubscriptionId,
    { expand: ["latest_invoice"] }
  );

  const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;

  let invoiceUrl: string | null = null;
  let amountPaid: number | null = null;
  let currency: string | null = null;
  let pdfUrl: string | null = null;

  if (latestInvoice) {
    invoiceUrl = latestInvoice.hosted_invoice_url ?? null; 
    pdfUrl = latestInvoice.invoice_pdf ?? null;            
    amountPaid = latestInvoice.amount_due / 100;          
    currency = latestInvoice.currency?.toUpperCase() ?? null;

    if (latestInvoice.status === "open") {
      const paidInvoice = await payInvoice(latestInvoice.id!);
      invoiceUrl = paidInvoice.hosted_invoice_url ?? invoiceUrl;
      pdfUrl = paidInvoice.invoice_pdf ?? pdfUrl;
      amountPaid = paidInvoice.amount_paid / 100;
    }
  }

  const plan = await prisma.plan.findUnique({
    where: { id: subscription.planId },
    include: { featuredItems: { include: { featuredItem: true } } },
  });

  const features = plan?.featuredItems.map(
    (item) => `${item.featuredItem.name}${item.limit ? `: ${item.limit}` : ""}`
  ) || [];

  await sendSubscriptionEmail(user.email, "UPGRADE", {
    fullName: user.fullName,
    planName: subscription.plan.planName,
    planType: subscription.plan.planType,
    amount: amountPaid ?? undefined,
    currency: currency ?? "USD",
    nextBillingDate: subscription.currentPeriodEnd?.toLocaleDateString(),
    invoiceUrl: invoiceUrl ?? undefined,
    pdfUrl: pdfUrl ?? undefined,
    features,
  });


  return {
    invoiceUrl,   
    pdfUrl,       
    amountPaid,   
    currency,    
    planName: subscription.plan.planName,       
    planType: subscription.plan.planType,      
    subscriptionId: subscription.id,            
    currentPeriodEnd: subscription.currentPeriodEnd, 
  };
};


export const startSubscriptionCronJobs = () => {
  cron.schedule("0 9 * * *", async () => {
   
    try {
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      const startOfDay = new Date(sevenDaysLater);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(sevenDaysLater);
      endOfDay.setHours(23, 59, 59, 999);

      const upcomingRenewals = await prisma.subscription.findMany({
        where: {
          status: "ACTIVE",
          autoRenew: true,
          cancelAtPeriodEnd: false,
          currentPeriodEnd: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          user: true,
          plan: true,
        },
      });

      for (const subscription of upcomingRenewals) {
        await sendNudgeEmail(subscription.user.email, "RENEWAL_REMINDER", {
          fullName: subscription.user.fullName,
          planName: subscription.plan.planName,
          renewalDate: subscription.currentPeriodEnd.toLocaleDateString("en-US", {
            dateStyle: "medium",
          }),
          amount: subscription.amount,
          currency: subscription.plan.currency || "USD",
        });


        await prisma.notification.create({
          data: {
            userId: subscription.userId,
            message: `🔔 Your ${subscription.plan.planName} plan renews on ${subscription.currentPeriodEnd.toLocaleDateString()}. Amount: ${subscription.plan.currency} ${subscription.amount}`,
            isRead: false,
          },
        });

      }
    } catch (error) {
      console.error(" Renewal reminder cron error:", error);
    }
  });


  cron.schedule("0 9 * * *", async () => {
    console.log(" Running slot warning cron job...");
    try {
      const users = await prisma.user.findMany({
        where: {
          isSubscribed: true,
          isDeleted: false,
        },
        include: {
          Subscription: {
            where: { status: "ACTIVE" },
            include: {
              plan: {
                include: {
                  featuredItems: { include: { featuredItem: true } },
                },
              },
            },
          },
        },
      });

      for (const user of users) {
        const activeSubscription = user.Subscription[0];
        if (!activeSubscription) continue;

        const artworkSlotItem = activeSubscription.plan.featuredItems.find(
          (item) => item.featuredItem.key === "artwork_slots"
        );

        const totalSlots = artworkSlotItem?.limit || 0;
  
  
        if (totalSlots === 0) continue;


      }
    } catch (error) {
      console.error(" Slot warning cron error:", error);
    }
  });

};

export const SubscriptionServices = {
  createSubscription,
  getMySubscription,
  getAllSubscriptions,
  getSingleSubscription,
  updateSubscription,
  deleteSubscription,
  cancelSubscription,
  reactivateSubscription,
  HandleStripeWebhook,
  confirmPayment
};