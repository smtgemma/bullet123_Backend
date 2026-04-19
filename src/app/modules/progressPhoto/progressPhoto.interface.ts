export interface IProgressPhoto {
  description?: string;
  url: string;
  uploaderId: string;
  propertyId: string;
}

export interface IBulkProgressPhoto {
  propertyId: string;
  urls: string[];
}
