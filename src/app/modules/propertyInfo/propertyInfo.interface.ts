import { PropertyStatus } from "@prisma/client";

export interface IPropertyInfo {
  municipalityId: string;
  propertyAddress: string;
  parcelId: number;
  zone: string;
  propertyType: string;
  sqft?: number;
  vacancyStatus: PropertyStatus;
  description?: string;
  askingPrice: number;
  disposition: string;
  images: string[];
  assignedStaffIds?: string[];
  budgetSummary?: any;
  budgets?: any[];
  tasks?: any[];
  documents?: any[];
  messages?: any[];
  progressPhotos?: any[];
  timezone?: string;
}
