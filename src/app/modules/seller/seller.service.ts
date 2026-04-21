import status from "http-status";
import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { ISellerUpdate } from "./seller.interface";
import prisma from "../../utils/prisma";

// ── Get all Sellers ────────────────────────────────────────────────────────
const getAllSellersFromDB = async (query: Record<string, unknown>) => {
  const include = {
    user: {
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePic: true,
        role: true,
        isVerified: true,
        isSubscribed: true,
        createdAt: true,
      },
    },
  };

  const queryBuilder = new QueryBuilder(prisma.seller, query)
    .search(["email"])
    .filter()
    .sort()
    .paginate()
    .fields()
    .include(include);

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

// ── Get single Seller by ID ─────────────────────────────────────────────────
const getSingleSellerFromDB = async (id: string) => {
  const seller = await prisma.seller.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isVerified: true,
          isSubscribed: true,
          createdAt: true,
        },
      },
    },
  });

  if (!seller) {
    throw new ApiError(status.NOT_FOUND, "Seller not found!");
  }

  return seller;
};

// ── Get my Seller profile ───────────────────────────────────────────────────
const getMySellerProfileFromDB = async (userId: string) => {
  let seller = await prisma.seller.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profilePic: true,
          role: true,
          isVerified: true,
          isSubscribed: true,
          createdAt: true,
        },
      },
      properties: {
        include: {
          assignedStaff: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true,
              role: true,
            }
          }
        }
      }
    },
  });

  if (!seller) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.SELLER) {
      seller = await prisma.seller.create({
        data: {
          userId: user.id,
          email: user.email
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePic: true,
              role: true,
              isVerified: true,
              isSubscribed: true,
              createdAt: true,
            },
          },
          properties: {
            include: {
              assignedStaff: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  profilePic: true,
                  role: true,
                }
              }
            }
          }
        }
      });
    } else {
      throw new ApiError(status.NOT_FOUND, "Seller profile not found!");
    }
  }

  // Calculate stats for "My Profile" view
  const totalAssets = seller.properties.reduce((acc, prop) => acc + (prop.askingPrice || 0), 0);
  const activeProjects = seller.properties.filter(p => p.vacancyStatus !== "Sold" && p.vacancyStatus !== "Completed").length;
  const pendingApprovals = seller.properties.filter(p => p.vacancyStatus === "Pending Approval").length;

  // Extract unique external professionals assigned to these properties
  const professionalsMap = new Map();
  seller.properties.forEach(prop => {
    prop.assignedStaff.forEach(staff => {
      if (!professionalsMap.has(staff.id)) {
        professionalsMap.set(staff.id, staff);
      }
    });
  });

  return {
    ...seller,
    stats: {
      totalAssets,
      activeProjects,
      pendingApprovals,
    },
    externalProfessionals: Array.from(professionalsMap.values()),
  };
};

// ── Update Seller ───────────────────────────────────────────────────────────
const updateSellerIntoDB = async (
  userId: string,
  payload: ISellerUpdate
) => {
  let seller = await prisma.seller.findUnique({
    where: { userId },
  });

  if (!seller) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.SELLER) {
      seller = await prisma.seller.create({
        data: {
          userId: user.id,
          email: user.email
        }
      });
    } else {
      throw new ApiError(status.NOT_FOUND, "Seller profile not found!");
    }
  }

  const updated = await prisma.seller.update({
    where: { userId },
    data: payload,
    include: {
      user: {
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

  return updated;
};

// ── Delete Seller ───────────────────────────────────────────────────────────
const deleteSellerFromDB = async (id: string) => {
  const seller = await prisma.seller.findUnique({ where: { id } });

  if (!seller) {
    throw new ApiError(status.NOT_FOUND, "Seller not found!");
  }

  await prisma.seller.delete({ where: { id } });

  return null;
};

// ── Get my Seller Staffs ────────────────────────────────────────────────────
const getMyStaffsFromDB = async (userId: string, query: Record<string, unknown>) => {
  const seller = await prisma.seller.findUnique({
    where: { userId },
  });

  if (!seller) {
    throw new ApiError(status.NOT_FOUND, "Seller profile not found!");
  }

  const queryBuilder = new QueryBuilder(prisma.user, query)
    .search(["fullName", "email"])
    .rawFilter({ sellerId: seller.id, isDeleted: false })
    .sort()
    .paginate()
    .fields()
    .include({
      assignedProperties: {
        take: 3
      }
    });

  const result = await queryBuilder.execute();
  const meta = await queryBuilder.countTotal();

  return { meta, data: result };
};

// ── Get Single Staff Details ───────────────────────────────────────────────
const getSingleStaffFromDB = async (staffId: string) => {
  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profilePic: true,
      isVerified: true,
      createdAt: true,
      assignedProperties: {
        include: {
          seller: true
        }
      }
    }
  });

  if (!staff) {
    throw new ApiError(status.NOT_FOUND, "Staff member not found!");
  }

  return staff;
};

// ── Get Seller Dashboard Stats ──────────────────────────────────────────────
const getSellerDashboardStatsFromDB = async (userId: string) => {
  let seller = await prisma.seller.findUnique({
    where: { userId },
  });

  if (!seller) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user && user.role === UserRole.SELLER) {
      seller = await prisma.seller.create({
        data: {
          userId: user.id,
          email: user.email
        }
      });
    } else {
      throw new ApiError(status.NOT_FOUND, "Seller profile not found!");
    }
  }

  // Get properties owned by this seller
  const properties = await prisma.propertyInfo.findMany({
    where: { sellerId: seller.id },
    include: {
      budgets: true
    }
  });

  // Calculate metrics based on the images provided
  // Revenue Gained (Actual) - Sum of completed amounts from all budgets
  const revenueGainedActual = properties.reduce((acc, prop) => {
    return acc + prop.budgets.reduce((bAcc, b) => bAcc + b.completedAmount, 0);
  }, 0);

  // Completed properties (Assuming vacancyStatus or some other field indicates completion)
  // For now, let's say properties with vacancyStatus 'Occupied' or 'Sold' are completed impact
  const completedProperties = properties.filter(p => p.vacancyStatus === "Occupied" || p.vacancyStatus === "Sold");
  const propertiesInPipeline = properties.filter(p => p.vacancyStatus === "In Pipeline" || p.vacancyStatus === "Processing");
  const vacantProperties = properties.filter(p => p.vacancyStatus === "Vacant");

  // Placeholder calculations for Tax Revenue and Losses (as shown in Figma)
  const taxRevenueGenerated = completedProperties.length * 1700; // Example rate from image
  const projectedRevenue = propertiesInPipeline.reduce((acc, p) => acc + p.askingPrice, 0);
  const annualLossVacant = vacantProperties.length * 1020; // Example rate from image

  // Total Annual Tax Revenue (Example: 10% of asking price for completed)
  const annualTaxRevenue = completedProperties.reduce((acc, p) => acc + (p.askingPrice * 0.05), 0);
  const estimatedRevenueLoss = annualLossVacant * 2.1; // Placeholder multiplier

  // Recent Activity (Mocking for now, could be fetched from a logs table)
  const recentActivity = [
    { type: "property_uploaded", property: "123 Oak Street", time: "Today, 10:30 AM" },
    { type: "status_updated", property: "456 Elm Avenue", time: "Yesterday, 3:45 PM" },
    { type: "rehab_completed", property: "789 Maple Road", time: "2 days ago" },
  ];

  return {
    economicImpactSummary: {
      revenueGainedActual,
      annualTaxRevenue,
      estimatedRevenueLoss,
    },
    propertyImpactDetail: {
      taxRevenueGenerated,
      projectedRevenue,
      annualLossVacant,
      counts: {
        completed: completedProperties.length,
        inPipeline: propertiesInPipeline.length,
        vacant: vacantProperties.length,
      }
    },
    recentActivity
  };
};

export const SellerService = {
  getAllSellersFromDB,
  getSingleSellerFromDB,
  getMySellerProfileFromDB,
  updateSellerIntoDB,
  deleteSellerFromDB,
  getMyStaffsFromDB,
  getSingleStaffFromDB,
  getSellerDashboardStatsFromDB,
};
