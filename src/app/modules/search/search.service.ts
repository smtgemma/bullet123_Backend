import prisma from "../../utils/prisma";

const searchPublicPropertiesFromDB = async (query: Record<string, unknown>) => {
  const {
    searchTerm,
    propertyType,
    vacancyStatus,
    zone,
    minPrice,
    maxPrice,
    page,
    limit,
  } = query;

  const pageNumber = Number(page) || 1;
  const pageSize = Math.min(Number(limit) || 10, 20); // cap at 20
  const skip = (pageNumber - 1) * pageSize;

  // Build where clause
  const where: any = {};

  // Full-text search across address, zone, propertyType
  if (searchTerm && typeof searchTerm === "string") {
    where.OR = [
      { propertyAddress: { contains: searchTerm, mode: "insensitive" } },
      { zone: { contains: searchTerm, mode: "insensitive" } },
      { propertyType: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Exact filter: propertyType
  if (propertyType && typeof propertyType === "string") {
    where.propertyType = { contains: propertyType, mode: "insensitive" };
  }

  // Exact filter: vacancyStatus (enum)
  if (vacancyStatus && typeof vacancyStatus === "string") {
    where.vacancyStatus = vacancyStatus.toUpperCase();
  }

  // Exact filter: zone
  if (zone && typeof zone === "string") {
    where.zone = { contains: zone, mode: "insensitive" };
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.askingPrice = {};
    if (minPrice !== undefined) {
      where.askingPrice.gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      where.askingPrice.lte = Number(maxPrice);
    }
  }

  // Execute query — select only public teaser fields
  const [properties, total] = await Promise.all([
    prisma.propertyInfo.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        propertyAddress: true,
        zone: true,
        propertyType: true,
        vacancyStatus: true,
        askingPrice: true,
        sqft: true,
        disposition: true,
        images: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.propertyInfo.count({ where }),
  ]);

  // Transform: teaser only — first image, truncated description
  const data = properties.map((property) => ({
    ...property,
    images: property.images.length > 0 ? [property.images[0]] : [],
    description: property.description
      ? property.description.length > 150
        ? property.description.substring(0, 150) + "..."
        : property.description
      : null,
  }));

  const meta = {
    page: pageNumber,
    limit: pageSize,
    total,
    totalPage: Math.ceil(total / pageSize),
  };

  return { meta, data };
};

export const SearchService = {
  searchPublicPropertiesFromDB,
};
