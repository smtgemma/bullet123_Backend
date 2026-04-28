class QueryBuilder {
  private model: any;
  private query: Record<string, unknown>;
  private prismaQuery: any = {}; 

  constructor(model: any, query: Record<string, unknown>) {
    this.model = model; 
    this.query = query; 
    console.log(query);
  }
  // Search
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: searchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: "insensitive" },
        })),
      };
    }
    return this;
  }


  filter(additionalExcludes: string[] = []) {
    const queryObj = JSON.parse(JSON.stringify(this.query));
    const excludeFields = [
      "searchTerm",
      "sort",
      "limit",
      "page",
      "fields",
      "startDate",
      "endDate",
      "location",
      "dateField",
      "locationFields",
      "filterType",
      "tag",
      ...additionalExcludes
    ];
    excludeFields.forEach((field) => delete queryObj[field]);

    const formattedFilters: Record<string, any> = {};
    for (const [key, value] of Object.entries(queryObj)) {
      if (typeof value === "string" && key.includes("[")) {
        const [field, operator] = key.split("[");
        const op = operator.slice(0, -1);

        const numericValue = parseFloat(value);
        formattedFilters[field] = {
          ...formattedFilters[field],
          [`${op}`]: isNaN(numericValue) ? value : numericValue,
        };
      } else if (typeof value === "string") {
        // Handle simple string filters with case-insensitivity
        formattedFilters[key] = { contains: value, mode: "insensitive" };
      } else {
        formattedFilters[key] = value;
      }
    }

    // Handle explicit date range if provided in query
    if (this.query.startDate || this.query.endDate) {
      const field = (this.query.dateField as string) || "createdAt";
      formattedFilters[field] = {
        ...(this.query.startDate ? { gte: new Date(this.query.startDate as string) } : {}),
        ...(this.query.endDate ? { lte: new Date(this.query.endDate as string) } : {}),
      };
    }

    // Handle location search if provided
    if (this.query.location) {
      const fieldsToSearch = (this.query.locationFields as string)?.split(",") || ["propertyAddress", "zone"];
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: fieldsToSearch.map((field) => ({
          [field]: { contains: this.query.location as string, mode: "insensitive" },
        })),
      };
    }

    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...formattedFilters,
    };

    return this;
  }

  rawFilter(filters: Record<string, any>) {
    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...filters,
    };
    return this;
  }

  // Sorting
  sort() {
    const sort = (this.query.sort as string)?.split(",") || ["-createdAt"];
    const orderBy = sort.map((field) => {
      if (field.startsWith("-")) {
        return { [field.slice(1)]: "desc" };
      }
      return { [field]: "asc" };
    });

    this.prismaQuery.orderBy = orderBy;
    return this;
  }

  // Pagination
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;

    return this;
  }


  fields() {
    const fields = (this.query.fields as string)?.split(",") || [];
    if (fields.length > 0) {
      this.prismaQuery.select = fields.reduce(
        (acc: Record<string, boolean>, field) => {
          acc[field] = true;
          return acc;
        },
        {}
      );
    }
    return this;
  }

  select(fields: string[]) {
    this.prismaQuery.select = fields.reduce(
      (acc: Record<string, boolean>, field) => {
        acc[field] = true;
        return acc;
      },
      {}
    );
    return this;
  }

  
  include(includeFields: Record<string, any>) {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...includeFields,
    };
    return this;
  }

  async execute() {
    return this.model.findMany(this.prismaQuery);
  }

  async countTotal() {
    const total = await this.model.count({ where: this.prismaQuery.where });
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }

  priceRange(minPrice?: number, maxPrice?: number) {
    if (!this.prismaQuery.where) {
      this.prismaQuery.where = {};
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      this.prismaQuery.where.price = {};

      if (minPrice !== undefined) {
        this.prismaQuery.where.price.gte = minPrice;
      }

      if (maxPrice !== undefined) {
        this.prismaQuery.where.price.lte = maxPrice;
      }
    }

    return this;
  }
}

export default QueryBuilder;
