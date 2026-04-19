export interface IMessage {
  content: string;
  senderId: string;
  receiverId?: string;
  propertyId?: string;
}
