const Chat = require("../models/chat.js");
const Booking = require("../models/booking.js");

async function fetchBookingForChat(bookingId) {
  return Booking.findById(bookingId)
    .populate({
      path: "serviceId",
      populate: { path: "owner", select: "username role bio contactNumber workingHours" },
    })
    .populate("userId", "username role");
}

function getBookingAccess(booking, user) {
  if (!booking || !user) {
    return {
      allowed: false,
      isCustomer: false,
      isProvider: false,
      isAdmin: false,
    };
  }

  const userId = String(user._id || user.id || user);
  const isCustomer = String(booking.userId?._id || booking.userId) === userId;
  const isProvider =
    String(booking.serviceId?.owner?._id || booking.serviceId?.owner) === userId;
  const isAdmin = user.role === "admin";

  return {
    allowed: isCustomer || isProvider || isAdmin,
    isCustomer,
    isProvider,
    isAdmin,
  };
}

function getBookingParticipants(booking) {
  const participants = [
    booking?.userId?._id || booking?.userId,
    booking?.serviceId?.owner?._id || booking?.serviceId?.owner,
  ].filter(Boolean);

  return [...new Set(participants.map((participant) => String(participant)))];
}

async function findOrCreateChat(bookingId, participants) {
  let chat = await Chat.findOne({ bookingId });

  if (chat) {
    const currentParticipants = (chat.participants || []).map((participant) => String(participant));
    const nextParticipants = participants.map((participant) => String(participant));
    const participantsChanged =
      currentParticipants.length !== nextParticipants.length ||
      nextParticipants.some((participant) => !currentParticipants.includes(participant));

    if (participantsChanged) {
      chat.participants = participants;
      await chat.save();
    }

    return chat;
  }

  try {
    chat = await Chat.create({
      bookingId,
      participants,
      messages: [],
    });
    return chat;
  } catch (error) {
    if (error?.code === 11000) {
      return Chat.findOne({ bookingId });
    }

    throw error;
  }
}

module.exports = {
  fetchBookingForChat,
  findOrCreateChat,
  getBookingAccess,
  getBookingParticipants,
};
