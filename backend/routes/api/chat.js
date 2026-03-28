const express = require("express");

const asyncWrap = require("../../middleware/asyncWrap.js");
const { ensureAuthenticated } = require("../../middleware/auth.js");
const { getSocketServer } = require("../../socket/index.js");
const {
  fetchBookingForChat,
  findOrCreateChat,
  getBookingAccess,
  getBookingParticipants,
} = require("../../utils/chat.js");
const { createNotifications } = require("../../utils/notifications.js");
const { serializeChat, serializeChatMessage } = require("../../utils/serializers.js");

const router = express.Router();

function getChatNotificationPayloads(booking, senderId, senderName, text) {
  const senderIdString = String(senderId);
  const customerId = String(booking.userId?._id || booking.userId);
  const providerId = String(booking.serviceId?.owner?._id || booking.serviceId?.owner);
  const preview = text.length > 90 ? `${text.slice(0, 87).trimEnd()}...` : text;
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

router.get(
  "/booking/:bookingId",
  ensureAuthenticated,
  asyncWrap(async (req, res) => {
    const { bookingId } = req.params;
    const booking = await fetchBookingForChat(bookingId);
    const access = getBookingAccess(booking, req.user);

    if (!booking || !access.allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to open this chat.",
      });
    }

    const participants = getBookingParticipants(booking);
    let chat = await findOrCreateChat(bookingId, participants);
    await chat.populate([
      {
        path: "participants",
        select: "username role bio contactNumber workingHours",
      },
      {
        path: "messages.sender",
        select: "username role bio contactNumber workingHours",
      },
    ]);

    return res.json({
      success: true,
      chat: serializeChat(chat),
    });
  }),
);

router.post(
  "/booking/:bookingId/messages",
  ensureAuthenticated,
  asyncWrap(async (req, res) => {
    const { bookingId } = req.params;
    const text = String(req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Message text is required.",
      });
    }

    const booking = await fetchBookingForChat(bookingId);
    const access = getBookingAccess(booking, req.user);

    if (!booking || !access.allowed || access.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to send messages in this chat.",
      });
    }

    const participants = getBookingParticipants(booking);
    const chat = await findOrCreateChat(bookingId, participants);

    chat.messages.push({
      sender: req.user._id,
      text,
    });
    chat.lastMessageAt = new Date();
    await chat.save();
    await chat.populate("messages.sender", "username role bio contactNumber workingHours");

    const message = chat.messages[chat.messages.length - 1];
    const serializedMessage = serializeChatMessage(message);
    const io = getSocketServer();
    const notificationPayloads = getChatNotificationPayloads(
      booking,
      req.user._id,
      req.user.username || "LocalFix user",
      text,
    );

    if (notificationPayloads.length) {
      await createNotifications(notificationPayloads, { io });
    }

    if (io) {
      io.to(`booking:${bookingId}`).emit("chat:message", {
        bookingId,
        message: serializedMessage,
      });
    }

    return res.status(201).json({
      success: true,
      message: serializedMessage,
    });
  }),
);

module.exports = router;
