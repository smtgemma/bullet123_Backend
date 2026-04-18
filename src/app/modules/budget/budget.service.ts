import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import status from "http-status";

const createBudgetIntoDB = async (payload: any) => {
  const result = await prisma.budget.create({
    data: payload,
  });
  return result;
};

const getSingleBudgetFromDB = async (id: string) => {
  const result = await prisma.budget.findUnique({
    where: { id },
    include: {
      property: true,
    },
  });

  if (!result) {
    throw new ApiError(status.NOT_FOUND, "Budget item not found!");
  }

  return result;
};

const getBudgetsByPropertyFromDB = async (propertyId: string) => {
  const budgets = await prisma.budget.findMany({
    where: { propertyId },
    orderBy: { createdAt: "desc" },
  });

  const totalBudget = budgets.reduce((sum, item) => sum + item.budgetedAmount, 0);
  const totalCompleted = budgets.reduce((sum, item) => sum + item.completedAmount, 0);
  const totalRemaining = totalBudget - totalCompleted;
  const overallCompletion = totalBudget > 0 ? (totalCompleted / totalBudget) * 100 : 0;

  return {
    budgets,
    summary: {
      totalBudget,
      totalCompleted,
      totalRemaining,
      overallCompletion: parseFloat(overallCompletion.toFixed(2)),
    },
  };
};

const updateBudgetIntoDB = async (id: string, payload: any) => {
  const result = await prisma.budget.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteBudgetFromDB = async (id: string) => {
  await prisma.budget.delete({
    where: { id },
  });
  return null;
};

export const BudgetService = {
  createBudgetIntoDB,
  getSingleBudgetFromDB,
  getBudgetsByPropertyFromDB,
  updateBudgetIntoDB,
  deleteBudgetFromDB,
};
