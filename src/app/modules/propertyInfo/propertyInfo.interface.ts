export interface IPropertyInfo {
  municipalityId: string;
  propertyAddress: string;
  parcelId: number;
  zone: string;
  propertyType: string;
  vacancyStatus: string;
  description?: string;
  askingPrice: number;
  disposition: string;
  images: string[];
  assignedStaffIds?: string[];
  teamIds?: string[];
  teamName?: string;
}
