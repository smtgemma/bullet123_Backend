export interface IDocument {
  name: string;
  type: string;
  fileUrl: string;
  fileSize?: string;
  isSigningRequired?: boolean;
  signatoryId?: string;
  propertyId: string;
}
