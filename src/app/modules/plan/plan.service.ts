
import { Plan, Prisma, PlanCategory, PlanType, Interval } from "@prisma/client";
import prisma from "../../utils/prisma";
import { stripe } from "../../utils/stripe";
import AppError from "../../errors/AppError";
import status from "http-status";

interface CreatePlanPayload {
  planName: string;
  price: number;
  planType: PlanType;
  targetAudience: string;
  currency?: string;
  interval: Interval;
  intervalCount?: number;
  freeTrialDays?: number;
  active?: boolean;
  description?: string;
  featuredItems?: Array<{
    featuredItemId: string;
    limit?: number;
    value?: string;
  }>;

  hasDiscount?: boolean;
  discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue?: number;
  discountStartDate?: Date;
  discountEndDate?: Date;
}

interface UpdatePlanPayload extends Partial<CreatePlanPayload> {}

const createPlan = async (payload: CreatePlanPayload) => {

  const product = await stripe.products.create({
    name: payload.planName,
    description: payload.description || "",
    active: payload.active ?? true,
    metadata: {
      planType: payload.planType,
      targetAudience: payload.targetAudience,
    },
  });


  const priceConfig: any = {
    unit_amount: Math.round(payload.price * 100),
    currency: payload.currency || "gbp",
    product: product.id,
    recurring: {
      interval: payload.interval,
      interval_count: payload.intervalCount || 1,
    },
  };

  if (payload.freeTrialDays) {
    priceConfig.recurring.trial_period_days = payload.freeTrialDays;
  }

  const price = await stripe.prices.create(priceConfig);


  const result = await prisma.$transaction(
    async (tx) => {
      // Create plan
      const dbPlan = await tx.plan.create({
        data: {
          planName: payload.planName,
          price: payload.price,
          planType: payload.planType,
          currency: payload.currency || "gbp",
          interval: payload.interval,
          productId: product.id,
          priceId: price.id,
          active: payload.active ?? true,
          description: payload?.description as string,

           ...(payload.hasDiscount && payload.discountType && payload.discountValue
      ? {
          hasDiscount: true,
          discountType: payload.discountType,
          discountValue: payload.discountValue,
          discountedPrice:
            payload.discountType === "PERCENTAGE"
              ? parseFloat((payload.price - (payload.price * payload.discountValue) / 100).toFixed(2))
              : parseFloat(Math.max(0, payload.price - payload.discountValue).toFixed(2)),
          discountStartDate: payload.discountStartDate || null,
          discountEndDate: payload.discountEndDate || null,
        }
      : {}),
        },
      });


      if (payload.featuredItems && payload.featuredItems.length > 0) {
        await tx.planFeaturedItem.createMany({
          data: payload.featuredItems.map((item) => ({
            planId: dbPlan.id,
            featuredItemId: item.featuredItemId,
            limit: item.limit || null,
            value: item.value || null,
          })),
        });
      }


      return tx.plan.findUnique({
        where: { id: dbPlan.id },
        include: {
          featuredItems: {
            include: {
              featuredItem: true,
            },
          },
        },
      });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    }
  );

  return result;
};

export const updatePlan = async (planId: string, payload: UpdatePlanPayload) => {
  let newPriceId: string | null = null;
  let oldPriceId: string | null = null;
  let stripePriceCreated = false;
  let productIdToUse: string;

  try {
    console.log("=== Update Plan Start ===");

    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        featuredItems: {
          include: {
            featuredItem: true,
          },
        },
      },
    });

    if (!existingPlan) {
      throw new AppError(status.NOT_FOUND, `Plan with ID ${planId} not found`);
    }

    oldPriceId = existingPlan.priceId;
    productIdToUse = existingPlan.productId;

    // Stripe product validate / recreate if missing
    try {
      await stripe.products.retrieve(productIdToUse);
    } catch (err: any) {
      if (err.code === "resource_missing") {
        console.warn(
          `Stripe product ${productIdToUse} not found. Creating new product...`
        );

        const newProduct = await stripe.products.create({
          name: payload.planName ?? existingPlan.planName,
          description: payload.description ?? existingPlan.description ?? "",
          active: payload.active ?? existingPlan.active ?? true,
          metadata: {
            planType: payload.planType ?? existingPlan.planType,
          
          },
        });

        productIdToUse = newProduct.id;

        await prisma.plan.update({
          where: { id: planId },
          data: { productId: productIdToUse },
        });
      } else {
        throw err;
      }
    }

    // Prepare update data for DB
    const updateData: any = {
      productId: productIdToUse,
    };

    if (payload.planName !== undefined) updateData.planName = payload.planName;
    if (payload.price !== undefined) updateData.price = payload.price;
    if (payload.planType !== undefined) updateData.planType = payload.planType;
    if (payload.targetAudience !== undefined)
      updateData.targetAudience = payload.targetAudience;
    if (payload.currency !== undefined) updateData.currency = payload.currency;
    if (payload.interval !== undefined) updateData.interval = payload.interval;
    if (payload.active !== undefined) updateData.active = payload.active;
    if (payload.description !== undefined)
      updateData.description = payload.description;


    if (payload.hasDiscount !== undefined) {
  if (payload.hasDiscount && payload.discountType && payload.discountValue) {
    const basePrice = payload.price ?? existingPlan.price;

    if (payload.discountType === "PERCENTAGE" && payload.discountValue > 100) {
      throw new AppError(status.BAD_REQUEST, "Percentage discount cannot exceed 100%");
    }
    if (payload.discountType === "FIXED_AMOUNT" && payload.discountValue >= basePrice) {
      throw new AppError(status.BAD_REQUEST, "Fixed discount cannot exceed plan price");
    }

    const discountedPrice =
      payload.discountType === "PERCENTAGE"
        ? parseFloat((basePrice - (basePrice * payload.discountValue) / 100).toFixed(2))
        : parseFloat(Math.max(0, basePrice - payload.discountValue).toFixed(2));

    updateData.hasDiscount = true;
    updateData.discountType = payload.discountType;
    updateData.discountValue = payload.discountValue;
    updateData.discountedPrice = discountedPrice;
    updateData.discountStartDate = payload.discountStartDate || null;
    updateData.discountEndDate = payload.discountEndDate || null;

  } else if (!payload.hasDiscount) {
  
    updateData.hasDiscount = false;
    updateData.discountType = null;
    updateData.discountValue = null;
    updateData.discountedPrice = null;
    updateData.discountStartDate = null;
    updateData.discountEndDate = null;
  }
}


    if (
      payload.planName !== undefined ||
      payload.description !== undefined ||
      payload.active !== undefined ||
      payload.planType !== undefined ||
      payload.targetAudience !== undefined
    ) {
      await stripe.products.update(productIdToUse, {
        name: payload.planName ?? existingPlan.planName,
        description: payload.description ?? existingPlan.description ?? "",
        active: payload.active ?? existingPlan.active ?? true,
        metadata: {
          planType: payload.planType ?? existingPlan.planType,
        },
      });
    }

    let pricingChanged = false;
    const currentPrice = Number(existingPlan.price) || 0;
    const currentCurrency = String(existingPlan.currency || "").toLowerCase();
    const currentInterval = existingPlan.interval;

    const changeDetails: string[] = [];

    if (payload.price !== undefined && Number(payload.price) !== currentPrice) {
      pricingChanged = true;
      changeDetails.push(`price: ${currentPrice} → ${payload.price}`);
    }

    if (
      payload.currency !== undefined &&
      String(payload.currency).toLowerCase() !== currentCurrency
    ) {
      pricingChanged = true;
      changeDetails.push(`currency: ${currentCurrency} → ${payload.currency}`);
    }

    if (payload.interval !== undefined && payload.interval !== currentInterval) {
      pricingChanged = true;
      changeDetails.push(`interval: ${currentInterval} → ${payload.interval}`);
    }


    if (pricingChanged) {
  
      console.log("Changes:", changeDetails.join(", "));

      const finalPrice = payload.price !== undefined ? Number(payload.price) : currentPrice;
      const finalCurrency = payload.currency ?? existingPlan.currency;
      const finalInterval = payload.interval ?? currentInterval;

      const priceConfig: any = {
        currency: finalCurrency,
        unit_amount: Math.round(finalPrice * 100),
        active: true,
        product: productIdToUse,
        recurring: {
          interval: finalInterval,
          interval_count: 1,
        },
      };

      const newPrice = await stripe.prices.create(priceConfig);
      newPriceId = newPrice.id;
      stripePriceCreated = true;

      if (oldPriceId) {
        try {
          await stripe.prices.update(oldPriceId, { active: false });
         
        } catch (err: any) {
          if (err.code === "resource_missing") {
            console.warn(`⚠️ Old price ${oldPriceId} not found in Stripe`);
          } else {
            throw err;
          }
        }
      }
    } else {
      newPriceId = existingPlan.priceId;
      console.log("✅ NO PRICING CHANGES - Keeping existing price:", newPriceId);
    }

    updateData.priceId = newPriceId;


    const updatedPlan = await prisma.$transaction(async (tx) => {

      const plan = await tx.plan.update({
        where: { id: planId },
        data: updateData,
      });

      if (payload.featuredItems !== undefined) {

        await tx.planFeaturedItem.deleteMany({
          where: { planId },
        });

        if (payload.featuredItems.length > 0) {
          await tx.planFeaturedItem.createMany({
            data: payload.featuredItems.map((item) => ({
              planId: plan.id,
              featuredItemId: item.featuredItemId,
              limit: item.limit || null,
              value: item.value || null,
            })),
          });
        }
      }

      // Return plan with featured items
      return tx.plan.findUnique({
        where: { id: planId },
        include: {
          featuredItems: {
            include: {
              featuredItem: true,
            },
          },
        },
      });
    });

    console.log("=== Update Plan Success ===");
    return updatedPlan;
  } catch (error) {
    console.error("Update Plan Error:", error);

    if (stripePriceCreated && newPriceId) {
      try {
        await stripe.prices.update(newPriceId, { active: false });
        if (oldPriceId) await stripe.prices.update(oldPriceId, { active: true });
        console.log("✅ Rolled back Stripe prices");
      } catch (rollbackError) {
        console.error("❌ Failed to rollback Stripe price:", rollbackError);
      }
    }

    throw error instanceof AppError
      ? error
      : new AppError(status.INTERNAL_SERVER_ERROR, error as any);
  }
};

const getAllPlans = async () => {
  const plans = await prisma.plan.findMany({
    include: {
      featuredItems: {
        include: {
          featuredItem: true,
        },
      },
    },
    orderBy: {
      price: 'asc',
    },
  });
  return plans;
};

const getPlanById = async (planId: string) => {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    include: {
      featuredItems: {
        include: {
          featuredItem: true,
        },
      },
    },
  });

  if (!plan) {
    throw new AppError(status.NOT_FOUND, `Plan with ID ${planId} not found`);
  }

  return plan;
};

const getPlansByType = async (planType: PlanType) => {
  const plans = await prisma.plan.findMany({
    where: {
      planType: planType,
      active: true,
    },
    include: {
      featuredItems: {
        include: {
          featuredItem: true,
        },
      },
    },
    orderBy: {
      price: 'asc',
    },
  });

  return plans;
};

const getFreePlans = async () => {
  return getPlansByType(PlanType.FREE);
};

const getPremiumPlans = async () => {
  return getPlansByType(PlanType.SILVER);
};

const getGoldPlans = async () => {
  return getPlansByType(PlanType.GOLD);
};

const deletePlan = async (planId: string) => {
  return await prisma.$transaction(async (tx) => {
    const plan = await tx.plan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new AppError(status.NOT_FOUND, `Plan with ID ${planId} not found`);
    }


    await tx.planFeaturedItem.deleteMany({
      where: { planId },
    });

    try {
      await stripe.prices.update(plan.priceId, { active: false });
      await stripe.products.update(plan.productId, { active: false });
    } catch (error) {
      console.error("Error deactivating Stripe resources:", error);
    }

    await tx.plan.delete({
      where: { id: planId },
    });

    return {
      message: `Plan with ID ${planId} archived and deleted successfully`,
    };
  });
};

const getAllFeaturedItems = async () => {
  return prisma.featuredItem.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
};


const setDiscount = async (
  planId: string,
  payload: {
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue: number;
    discountStartDate?: Date;
    discountEndDate?: Date;
  }
) => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError(status.NOT_FOUND, "Plan not found");

  if (payload.discountType === "PERCENTAGE" && payload.discountValue > 100) {
    throw new AppError(status.BAD_REQUEST, "Percentage discount cannot exceed 100%");
  }

  if (payload.discountType === "FIXED_AMOUNT" && payload.discountValue >= plan.price) {
    throw new AppError(status.BAD_REQUEST, "Fixed discount cannot exceed plan price");
  }

  const discountedPrice =
    payload.discountType === "PERCENTAGE"
      ? plan.price - (plan.price * payload.discountValue) / 100
      : plan.price - payload.discountValue;

  return await prisma.plan.update({
    where: { id: planId },
    data: {
      hasDiscount: true,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      discountedPrice: parseFloat(discountedPrice.toFixed(2)),
      discountStartDate: payload.discountStartDate || null,
      discountEndDate: payload.discountEndDate || null,
    },
    include: {
      featuredItems: {
        include: { featuredItem: true },
      },
    },
  });
};


const removeDiscount = async (planId: string) => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError(status.NOT_FOUND, "Plan not found");

  return await prisma.plan.update({
    where: { id: planId },
    data: {
      hasDiscount: false,
      discountType: null,
      discountValue: null,
      discountedPrice: null,
      discountStartDate: null,
      discountEndDate: null,
    },
  });
};

const updateDiscount = async (
  planId: string,
  payload: {
    discountType?: "PERCENTAGE" | "FIXED_AMOUNT";
    discountValue?: number;
    discountStartDate?: Date;
    discountEndDate?: Date;
  }
) => {
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new AppError(status.NOT_FOUND, "Plan not found");

  if (!plan.hasDiscount) {
    throw new AppError(status.BAD_REQUEST, "This plan has no active discount to update");
  }

  const newDiscountType = payload.discountType ?? plan.discountType;
  const newDiscountValue = payload.discountValue ?? plan.discountValue;

  if (newDiscountType === "PERCENTAGE" && newDiscountValue! > 100) {
    throw new AppError(status.BAD_REQUEST, "Percentage discount cannot exceed 100%");
  }

  if (newDiscountType === "FIXED_AMOUNT" && newDiscountValue! >= plan.price) {
    throw new AppError(status.BAD_REQUEST, "Fixed discount cannot exceed plan price");
  }

  const discountedPrice =
    newDiscountType === "PERCENTAGE"
      ? plan.price - (plan.price * newDiscountValue!) / 100
      : plan.price - newDiscountValue!;

  return await prisma.plan.update({
    where: { id: planId },
    data: {
      discountType: newDiscountType,
      discountValue: newDiscountValue,
      discountedPrice: parseFloat(discountedPrice.toFixed(2)),
      discountStartDate: payload.discountStartDate ?? plan.discountStartDate,
      discountEndDate: payload.discountEndDate ?? plan.discountEndDate,
    },
    include: {
      featuredItems: {
        include: { featuredItem: true },
      },
    },
  });
};

export const PlanServices = {
  createPlan,
  getAllPlans,
  getPlanById,
  getPlansByType,
  getFreePlans,
  getPremiumPlans,
  getGoldPlans,
  deletePlan,
  updatePlan,
  getAllFeaturedItems,
  setDiscount,
  removeDiscount,
  updateDiscount
};