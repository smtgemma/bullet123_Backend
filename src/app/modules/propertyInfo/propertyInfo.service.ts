import status from "http-status";
import prisma from "../../utils/prisma";
import ApiError from "../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { IPropertyInfo } from "./propertyInfo.interface";

const createPropertyInfoIntoDB = async (userId: string, payload: IPropertyInfo) => {
  // Find municipality or seller by userId
  const municipality = await prisma.municipality.findUnique({
    where: { userId },
  });

  const seller = await prisma.seller.findUnique({
    where: { userId },
  });

  if (!municipality && !seller) {
    throw new ApiError(status.NOT_FOUND, "Owner profile (Municipality or Seller) not found for this user!");
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
      municipalityId: municipality?.id,
      sellerId: seller?.id,
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
      seller: true,
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
      seller: true,
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
      Seller: true,
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

  // If the user is a seller
  if (user.role === "SELLER" && user.Seller) {
    return await prisma.propertyInfo.findMany({
      where: { sellerId: user.Seller.id },
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
      OR: [
        { municipality: { isNot: null } },
        { seller: { isNot: null } }
      ]
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
      seller: true,
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
        if (char === '"' && line[i+1] === '"') {
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

  const seller = await prisma.seller.findUnique({
    where: { userId },
  });

  if (!municipality && !seller) {
    throw new ApiError(status.NOT_FOUND, "Owner profile (Municipality or Seller) not found for this user!");
  }

  const ownerId = municipality?.id || seller?.id;
  const isMunicipality = !!municipality;

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
      municipalityId: isMunicipality ? ownerId : null,
      sellerId: !isMunicipality ? ownerId : null,
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

const inviteProfessionalToPropertyInDB = async (propertyId: string, payload: { email: string; role: any; message?: string }) => {
  const normalizedEmail = payload.email.toLowerCase().trim();

  // 1. Check if user exists
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail }
  });

  if (!user) {
    // 2. Create user (invited state)
    // Note: In production, we should use a proper invitation flow with email
    user = await prisma.user.create({
      data: {
        fullName: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: "INVITED_USER_TEMP_PWD", // Placeholder
        role: payload.role,
        isVerified: false,
      },
    });
  }

  // 3. Assign to property
  const result = await prisma.propertyInfo.update({
    where: { id: propertyId },
    data: {
      assignedStaff: {
        connect: { id: user.id }
      }
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
      }
    }
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
  bulkUploadPropertyInfosFromCSV,
  inviteProfessionalToPropertyInDB,
};
