const { Server } = require("socket.io");

const { fetchBookingForChat, findOrCreateChat, getBookingAccess, getBookingParticipants } = require("../utils/chat.js");
const { createNotifications } = require("../utils/notifications.js");
const { serializeChatMessage } = require("../utils/serializers.js");

let ioInstance = null;

function getBookingRoomName(bookingId) {
  return `booking:${bookingId}`;
}

function getSocketServer() {
  return ioInstance;
}

async function buildChatNotificationPayloads(booking, senderId, senderName, text) {
  const senderIdString = String(senderId);
  const customerId = String(booking.userId?._id || booking.userId);
  const providerId = String(booking.serviceId?.owner?._id || booking.serviceId?.owner);
  const preview =
    text.length > 90 ? `${text.slice(0, 87).trimEnd()}...` : text;
  const payloads = [];

  if (customerId !== senderIdString) {
    payloads.push({
      userId: customerId,
      actorId: senderId,
      kind: "chat_message",
      title: `New message about ${booking.serviceId?.title || "your booking"}`,
      message: `${senderName}: ${preview}`,
      link: `/customer/bookings/${booking._id}`,
    });
  }

  if (providerId !== senderIdString) {
    payloads.push({
      userId: providerId,
      actorId: senderId,
      kind: "chat_message",
      title: `New message about ${booking.serviceId?.title || "your booking"}`,
      message: `${senderName}: ${preview}`,
      link: `/provider/bookings/${booking._id}`,
    });
  }

  return payloads;
}

async function initializeSocket(server, { sessionMiddleware, passport }) {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  ioInstance.engine.use((req, res, next) => sessionMiddleware(req, res, next));
  ioInstance.engine.use((req, res, next) => passport.initialize()(req, res, next));
  ioInstance.engine.use((req, res, next) => passport.session()(req, res, next));

  ioInstance.use((socket, next) => {
    if (!socket.request.user) {
      return next(new Error("Unauthorized"));
    }

    return next();
  });

  ioInstance.on("connection", (socket) => {
    const currentUser = socket.request.user;
    const currentUserId = String(currentUser._id);

    socket.join(`user:${currentUserId}`);

    socket.on("chat:join", async (bookingId, callback = () => {}) => {
      try {
        const booking = await fetchBookingForChat(bookingId);
        const access = getBookingAccess(booking, currentUser);

        if (!booking || !access.allowed) {
          callback({
            success: false,
            message: "You are not allowed to join this chat.",
          });
          return;
        }

        socket.join(getBookingRoomName(bookingId));
        callback({ success: true });
      } catch (error) {
        callback({
          success: false,
          message: "Unable to join the chat right now.",
        });
      }
    });

    socket.on("chat:leave", (bookingId) => {
      socket.leave(getBookingRoomName(bookingId));
    });

    socket.on("chat:typing:start", (bookingId) => {
      const roomName = getBookingRoomName(bookingId);

      if (!socket.rooms.has(roomName)) {
        return;
      }

      socket.to(roomName).emit("chat:typing:start", {
        bookingId,
        userId: currentUserId,
      });
    });

    socket.on("chat:typing:stop", (bookingId) => {
      const roomName = getBookingRoomName(bookingId);

      if (!socket.rooms.has(roomName)) {
        return;
      }

      socket.to(roomName).emit("chat:typing:stop", {
        bookingId,
        userId: currentUserId,
      });
    });

    socket.on("chat:send", async (payload, callback = () => {}) => {
      try {
        const bookingId = payload?.bookingId;
        const text = String(payload?.text || "").trim();

        if (!bookingId || !text) {
          callback({
            success: false,
            message: "Message text is required.",
          });
          return;
        }

        const booking = await fetchBookingForChat(bookingId);
        const access = getBookingAccess(booking, currentUser);

        if (!booking || !access.allowed || access.isAdmin) {
          callback({
            success: false,
            message: "You are not allowed to send messages in this chat.",
          });
          return;
        }

        const participants = getBookingParticipants(booking);
        const chat = await findOrCreateChat(bookingId, participants);

        chat.messages.push({
          sender: currentUser._id,
          text,
        });
        chat.lastMessageAt = new Date();
        await chat.save();
        await chat.populate("messages.sender", "username role bio contactNumber workingHours");

        const message = chat.messages[chat.messages.length - 1];
        const serializedMessage = serializeChatMessage(message);
        const notificationPayloads = await buildChatNotificationPayloads(
          booking,
          currentUser._id,
          currentUser.username || "LocalFix user",
          text,
        );

        if (notificationPayloads.length) {
          await createNotifications(notificationPayloads, { io: ioInstance });
        }

        ioInstance.to(getBookingRoomName(bookingId)).emit("chat:message", {
          bookingId,
          message: serializedMessage,
        });

        callback({
          success: true,
          message: serializedMessage,
        });
      } catch (error) {
        callback({
          success: false,
          message: "Unable to send the message right now.",
        });
      }
    });
  });

  return ioInstance;
}

module.exports = {
  getSocketServer,
  initializeSocket,
};
