import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import prisma from "./prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";

let io: Server;

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:4044",
        "http://localhost:4000",
        "http://localhost:4041",
        "http://localhost:4042",
        "http://localhost:4043",
        config.url.frontend as string,
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication Middleware for Socket.io
  io.use((socket, next) => {
    // 1. Try to get token from standard Socket.io auth object
    // 2. Try to get token from Authorization header
    // 3. Try to get token from URL query parameters (easiest for some Postman clients)
    const token = 
      socket.handshake.auth?.token || 
      socket.handshake.headers?.authorization ||
      socket.handshake.query?.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const tokenValue = token.startsWith("Bearer ") ? token.split(" ")[1] : token;
      const decoded = jwt.verify(tokenValue, config.jwt.access.secret as string) as JwtPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user;
    console.log("🔌 A user connected:", socket.id, "User ID:", user?.id);

    // Automatically join personal room on connection
    if (user?.id) {
      socket.join(user.id);
      console.log(`👤 User joined personal room: ${user.id}`);
    }

    // Join a property-specific discussion room
    socket.on("join_property_chat", (propertyId: string) => {
      socket.join(propertyId);
      console.log(`👤 User joined property chat room: ${propertyId}`);
    });

    // Handle sending message
    socket.on("send_message", async (rawData: any) => {
      let data = rawData;
      
      // If Postman sends a JSON string instead of an object, parse it
      if (typeof rawData === 'string') {
        try {
          data = JSON.parse(rawData);
        } catch (error) {
          console.error("❌ Invalid JSON message format");
          return;
        }
      }

      const { propertyId, receiverId, content } = data;
      const senderId = user.id;

      if (!content) {
        console.error("❌ Content is missing in message data");
        return;
      }

      try {
        // Save message to database
        const newMessage = await prisma.message.create({
          data: {
            content,
            senderId,
            propertyId: propertyId || null,
            receiverId: receiverId || null,
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
            receiver: {
              select: {
                id: true,
                fullName: true,
                profilePic: true,
                role: true,
              },
            },
          },
        });

        // 1. If it's a property-based message, broadcast to property room
        if (propertyId) {
          io.to(propertyId).emit("receive_message", newMessage);
        }

        // 2. If it's a 1-to-1 message, emit to both sender and receiver
        if (receiverId) {
          io.to(receiverId).emit("receive_direct_message", newMessage);
          io.to(senderId).emit("receive_direct_message", newMessage);
        }
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
