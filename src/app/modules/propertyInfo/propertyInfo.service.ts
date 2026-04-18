import status from "http-status";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { IPropertyInfo } from "./propertyInfo.interface";

const createPropertyInfoIntoDB = async (userId: string, payload: IPropertyInfo) => {
  // Find municipality by userId
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found for this user!");
  }

  const { assignedStaffIds, tasks, budgets, budgetSummary, documents, messages, progressPhotos, ...propertyData } = payload;

  // Validate Staff IDs
  if (assignedStaffIds && assignedStaffIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { id: { in: assignedStaffIds } }
    });
    if (users.length !== assignedStaffIds.length) {
      throw new ApiError(status.BAD_REQUEST, "One or more Staff IDs are invalid!");
    }
  }



  const result = await prisma.propertyInfo.create({
    data: {
      ...propertyData,
      municipalityId: municipality.id,
      // Keep individual assignment for direct access tracking
      assignedStaff: assignedStaffIds ? {
        connect: assignedStaffIds.map(id => ({ id }))
      } : undefined
    },
    include: {
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isVerified: true
        }
      }
    }
  });

  return result;
};

const getAllPropertyInfosFromDB = async (query: Record<string, unknown>) => {
  const queryBuilder = new QueryBuilder(prisma.propertyInfo, query)
    .search(["propertyAddress", "zone", "propertyType", "vacancyStatus"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include({
      municipality: true,
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      },
    });


  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

const getSinglePropertyInfoFromDB = async (id: string) => {
  const result = await prisma.propertyInfo.findUnique({
    where: { id },
    include: {
      municipality: true,
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      },
      tasks: {
        include: {
          assignees: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true
            }
          }
        },
        orderBy: {
          dueDate: "asc"
        }
      },
      budgets: {
        orderBy: {
          createdAt: "desc"
        }
      },
      documents: {
        include: {
          signatory: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      progressPhotos: {
        include: {
          uploader: {
            select: {
              id: true,
              fullName: true,
              profilePic: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    },
  });

  if (!result) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  // Calculate Budget Summary
  const budgets = result.budgets || [];
  const totalBudget = budgets.reduce((sum, item) => sum + item.budgetedAmount, 0);
  const totalCompleted = budgets.reduce((sum, item) => sum + item.completedAmount, 0);
  const totalRemaining = totalBudget - totalCompleted;
  const overallCompletion = totalBudget > 0 ? (totalCompleted / totalBudget) * 100 : 0;

  return {
    ...result,
    budgetSummary: {
      totalBudget,
      totalCompleted,
      totalRemaining,
      overallCompletion: parseFloat(overallCompletion.toFixed(2)),
    }
  };
};

const updatePropertyInfoIntoDB = async (id: string, payload: Partial<IPropertyInfo>) => {
  const isExist = await prisma.propertyInfo.findUnique({ where: { id } });

  if (!isExist) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  const { assignedStaffIds, tasks, budgets, budgetSummary, documents, messages, progressPhotos, ...updateData } = payload;

  const result = await prisma.propertyInfo.update({
    where: { id },
    data: {
      ...updateData,
      assignedStaff: assignedStaffIds ? {
        set: assignedStaffIds.map(id => ({ id }))
      } : undefined,
    },
    include: {
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      },
    }
  });

  return result;
};

const deletePropertyInfoFromDB = async (id: string) => {
  const isExist = await prisma.propertyInfo.findUnique({ where: { id } });

  if (!isExist) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  await prisma.propertyInfo.delete({ where: { id } });

  return null;
};

const getMyPropertiesFromDB = async (userId: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality not found!");
  }

  const result = await prisma.propertyInfo.findMany({
    where: { municipalityId: municipality.id },
  });

  return result;
};

const assignStaffToPropertyInDB = async (propertyId: string, staffIds: string[]) => {
  const isExist = await prisma.propertyInfo.findUnique({ where: { id: propertyId } });
  if (!isExist) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  const result = await prisma.propertyInfo.update({
    where: { id: propertyId },
    data: {
      assignedStaff: {
        connect: staffIds.map((id) => ({ id })),
      },
    },
    include: {
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      },
    },
  });

  return result;
};

const removeStaffFromPropertyInDB = async (propertyId: string, staffId: string) => {
  const isExist = await prisma.propertyInfo.findUnique({ where: { id: propertyId } });
  if (!isExist) {
    throw new ApiError(status.NOT_FOUND, "Property info not found!");
  }

  const result = await prisma.propertyInfo.update({
    where: { id: propertyId },
    data: {
      assignedStaff: {
        disconnect: { id: staffId },
      },
    },
    include: {
      assignedStaff: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
        }
      },
    },
  });

  return result;
};

export const PropertyInfoService = {
  createPropertyInfoIntoDB,
  getAllPropertyInfosFromDB,
  getSinglePropertyInfoFromDB,
  updatePropertyInfoIntoDB,
  deletePropertyInfoFromDB,
  getMyPropertiesFromDB,
  assignStaffToPropertyInDB,
  removeStaffFromPropertyInDB,
};
