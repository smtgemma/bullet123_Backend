import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import prisma from "./prisma";

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 A user connected:", socket.id);

    // Join a property-specific discussion room
    socket.on("join_property_chat", (propertyId: string) => {
      socket.join(propertyId);
      console.log(`👤 User joined chat room: ${propertyId}`);
    });

    // Handle sending message
    socket.on("send_message", async (data: { propertyId: string; senderId: string; content: string }) => {
      const { propertyId, senderId, content } = data;

      try {
        // Save message to database
        const newMessage = await prisma.message.create({
          data: {
            content,
            senderId,
            propertyId,
          },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                profilePic: true,
                role: true,
              },
            },
          },
        });

        // Broadcast message to everyone in the property room
        io.to(propertyId).emit("receive_message", newMessage);
      } catch (error) {
        console.error("❌ Error sending message:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("👋 User disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
