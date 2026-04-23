import status from "http-status";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { IPropertyInfo } from "./propertyInfo.interface";

const createPropertyInfoIntoDB = async (userId: string, payload: IPropertyInfo & { timezone?: string }) => {
  // Find municipality by userId
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found for this user!");
  }

  const { assignedStaffIds, tasks, budgets, budgetSummary, documents, messages, progressPhotos, ...propertyData } = payload;
  console.log("DEBUG: Incoming payload for creation:", JSON.stringify(payload, null, 2));

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
      timezone: payload.timezone,
      municipalityId: municipality.id,
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Municipality: true,
    },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  // If the user is a municipality
  if (user.role === "MUNICIPALITY" && user.Municipality) {
    return await prisma.propertyInfo.findMany({
      where: { municipalityId: user.Municipality.id },
      include: {
        assignedStaff: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePic: true,
            role: true,
          },
        },
      },
    });
  }

  // If the user is a staff member (assigned to properties)
  return await prisma.propertyInfo.findMany({
    where: {
      assignedStaff: {
        some: { id: userId },
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
        },
      },
      municipality: true,
    },
  });
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

function parseCSVLine(line: string) {
  const result = [];
  let currentStr = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      currentStr += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(currentStr.trim());
      currentStr = '';
    } else {
      currentStr += char;
    }
  }
  result.push(currentStr.trim());
  return result;
}

const bulkUploadPropertyInfosFromCSV = async (userId: string, fileBuffer: Buffer) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found for this user!");
  }

  const csvText = fileBuffer.toString("utf-8");
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length <= 1) {
    throw new ApiError(status.BAD_REQUEST, "CSV file is empty or missing data rows");
  }

  const headers = parseCSVLine(lines[0]);
  const properties = [];

  for (let i = 1; i < lines.length; i++) {
    const currentline = parseCSVLine(lines[i]);

    const obj: any = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    properties.push({
      municipalityId: municipality.id,
      propertyAddress: obj.propertyAddress || obj.address || "No Address Provided",
      parcelId: obj.parcelId || "N/A",
      propertyType: obj.propertyType || "Commercial",
      vacancyStatus: obj.vacancyStatus || "Vacant",
      zone: obj.zone || "Default Zone",
      disposition: obj.disposition || "Default Disposition",
      description: obj.description || "",
      askingPrice: Number(obj.askingPrice) || 0,
      dispositionRules: obj.dispositionRules || "",
      images: [],
    });
  }

  const result = await prisma.propertyInfo.createMany({
    data: properties,
    skipDuplicates: true, // Requires Prisma 2.20+
  });

  return result;
};

const getPropertyStatsFromDB = async (userId: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found!");
  }

  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Helper to calculate percentage change with explicit sign
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = parseFloat(((current - previous) / previous * 100).toFixed(1));
    return change > 0 ? `+${change}%` : `${change}%`;
  };

  const getStats = async (startDate?: Date, endDate?: Date) => {
    const where: any = { municipalityId: municipality.id };
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const [total, vacant, underContract, closed] = await Promise.all([
      prisma.propertyInfo.count({ where }),
      prisma.propertyInfo.count({ where: { ...where, vacancyStatus: "Vacant" } }),
      prisma.propertyInfo.count({ where: { ...where, vacancyStatus: "Under Contract" } }),
      prisma.propertyInfo.aggregate({
        where: { ...where, vacancyStatus: "Closed" },
        _count: { id: true },
        _sum: { askingPrice: true },
      }),
    ]);

    return {
      total,
      vacant,
      underContract,
      closedCount: closed._count.id,
      closedValue: closed._sum.askingPrice || 0,
    };
  };

  const currentStats = await getStats();
  const lastMonthStats = await getStats(startOfLastMonth, endOfLastMonth);
  const previousTotalStats = await getStats(undefined, endOfLastMonth);

  return {
    totalProperties: {
      count: currentStats.total,
      change: calculateChange(currentStats.total, previousTotalStats.total),
    },
    vacant: {
      count: currentStats.vacant,
      change: calculateChange(currentStats.vacant, previousTotalStats.vacant),
    },
    underContract: {
      count: currentStats.underContract,
      change: calculateChange(currentStats.underContract, previousTotalStats.underContract),
    },
    closed: {
      count: currentStats.closedCount,
      totalValue: currentStats.closedValue,
      avgRevenue: currentStats.total > 0 ? parseFloat((currentStats.closedValue / currentStats.total).toFixed(2)) : 0,
    },
  };
};

const getUniqueTimezonesFromDB = async (userId: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found!");
  }

  const timezones = await prisma.propertyInfo.groupBy({
    by: ["timezone"],
    where: {
      municipalityId: municipality.id,
      NOT: { timezone: null },
    },
  });

  return timezones.map((t) => t.timezone);
};

const getUniqueLocationsByTimezoneFromDB = async (userId: string, timezone: string) => {
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  if (!municipality) {
    throw new ApiError(status.NOT_FOUND, "Municipality profile not found!");
  }

  const locations = await prisma.propertyInfo.groupBy({
    by: ["zone"],
    where: {
      municipalityId: municipality.id,
      timezone: timezone,
    },
  });

  return locations.map((l) => l.zone);
};

const getPropertyDashboardDataFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Municipality: true }
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not found!");
  }

  const whereProperty: any = user.role === "MUNICIPALITY" && user.Municipality
    ? { municipalityId: user.Municipality.id }
    : { assignedStaff: { some: { id: userId } } };

  // 1. Fetch Recent Activities (Aggregated)
  const [recentMessages, recentPhotos, recentTasks, recentBudgets] = await Promise.all([
    prisma.message.findMany({
      where: { property: whereProperty },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sender: {
          select: { fullName: true }
        }
      }
    }),
    prisma.progressPhoto.findMany({
      where: { property: whereProperty },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        uploader: {
          select: { fullName: true }
        }
      }
    }),
    prisma.task.findMany({
      where: { property: whereProperty },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.budget.findMany({
      where: { property: whereProperty },
      orderBy: { updatedAt: "desc" },
      take: 5,
    })
  ]);

  const activities = [
    ...recentMessages.map((m) => ({
      id: m.id,
      type: "MESSAGE",
      title: `New message from ${m.sender.fullName}`,
      timestamp: m.createdAt,
      icon: "message"
    })),
    ...recentPhotos.map((p) => ({
      id: p.id,
      type: "PHOTO",
      title: `Photos uploaded by ${p.uploader.fullName}`,
      timestamp: p.createdAt,
      icon: "upload"
    })),
    ...recentTasks.map((t) => ({
      id: t.id,
      type: "TASK",
      title: `Task created: ${t.title}`,
      timestamp: t.createdAt,
      icon: "foundation"
    })),
    ...recentBudgets.map((b) => {
      const completion = b.budgetedAmount > 0 ? (b.completedAmount / b.budgetedAmount) * 100 : 0;
      return {
        id: b.id,
        type: "BUDGET",
        title: `${b.description} ${completion.toFixed(0)}% complete`,
        timestamp: b.updatedAt,
        icon: "check"
      };
    })
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);

  // 2. Fetch Upcoming Tasks
  const upcomingTasks = await prisma.task.findMany({
    where: {
      property: whereProperty,
      status: { not: "COMPLETED" }
    },
    orderBy: { dueDate: "asc" },
    take: 10,
    include: {
      assignees: {
        select: { id: true, fullName: true, profilePic: true }
      }
    }
  });

  return {
    activities,
    upcomingTasks
  };
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
  bulkUploadPropertyInfosFromCSV,
  getPropertyStatsFromDB,
  getUniqueTimezonesFromDB,
  getUniqueLocationsByTimezoneFromDB,
  getPropertyDashboardDataFromDB,
};
