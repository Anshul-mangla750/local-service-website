const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

function isPopulated(value) {
  return Boolean(value && typeof value === "object" && value._id);
}

function toIdArray(values = []) {
  return values.map((value) => (typeof value === "string" ? value : String(value)));
}

function normalizeImage(image) {
  if (image && image.url) {
    return {
      url: image.url,
      filename: image.filename || "service-image",
    };
  }

  return {
    url: DEFAULT_IMAGE,
    filename: "service-image",
  };
}

function serializePublicUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    bio: user.bio || "",
    contactNumber: user.contactNumber || "",
    workingHours: user.workingHours || "",
  };
}

function serializeCurrentUser(user) {
  if (!user) {
    return null;
  }

  return {
    ...serializePublicUser(user),
    email: user.email,
    address: user.address || "",
    phone: user.phone || "",
    favoriteServices: toIdArray(user.favoriteServices || []),
  };
}

function serializeService(service, options = {}) {
  if (!service) {
    return null;
  }

  const currentUser = options.currentUser || null;
  const favoriteIds = currentUser ? toIdArray(currentUser.favoriteServices || []) : [];

  return {
    id: String(service._id),
    title: service.title,
    description: service.description || "",
    price: Number(service.price || 0),
    location: service.location || "",
    category: service.category || "General",
    image: normalizeImage(service.image),
    owner: isPopulated(service.owner)
      ? serializePublicUser(service.owner)
      : service.owner
        ? { id: String(service.owner) }
        : null,
    isFavorite: favoriteIds.includes(String(service._id)),
    averageRating:
      typeof service.averageRating === "number"
        ? Number(service.averageRating.toFixed(1))
        : typeof service.averageRating === "string"
          ? Number(Number(service.averageRating).toFixed(1))
          : null,
    reviewCount:
      typeof service.reviewCount === "number" ? service.reviewCount : null,
    bookingCount:
      typeof service.bookingCount === "number" ? service.bookingCount : null,
    createdAt: service.createdAt || null,
    updatedAt: service.updatedAt || null,
  };
}

function serializeBooking(booking, options = {}) {
  if (!booking) {
    return null;
  }

  return {
    id: String(booking._id),
    date: booking.date,
    time: booking.time,
    notes: booking.notes || "",
    status: booking.status,
    createdAt: booking.createdAt || null,
    service: isPopulated(booking.serviceId)
      ? serializeService(booking.serviceId, options)
      : booking.serviceId
        ? { id: String(booking.serviceId) }
        : null,
    user: isPopulated(booking.userId)
      ? serializePublicUser(booking.userId)
      : booking.userId
        ? { id: String(booking.userId) }
        : null,
  };
}

function serializeReview(review) {
  if (!review) {
    return null;
  }

  const booking = review.bookingId;
  const populatedBooking = isPopulated(booking);

  return {
    id: String(review._id),
    rating: Number(review.rating),
    comment: review.comment || "",
    createdAt: review.createdAt || null,
    user: isPopulated(review.userId)
      ? serializePublicUser(review.userId)
      : review.userId
        ? { id: String(review.userId) }
        : null,
    booking: populatedBooking
      ? {
          id: String(booking._id),
          date: booking.date || null,
          time: booking.time || "",
          service: isPopulated(booking.serviceId)
            ? serializeService(booking.serviceId)
            : booking.serviceId
              ? { id: String(booking.serviceId) }
              : null,
        }
      : booking
        ? { id: String(booking) }
        : null,
  };
}

function serializeChatMessage(message) {
  if (!message) {
    return null;
  }

  return {
    id: String(message._id),
    text: message.text || "",
    createdAt: message.createdAt || null,
    sender: isPopulated(message.sender)
      ? serializePublicUser(message.sender)
      : message.sender
        ? { id: String(message.sender) }
        : null,
  };
}

function serializeChat(chat) {
  if (!chat) {
    return null;
  }

  return {
    id: String(chat._id),
    bookingId: String(chat.bookingId),
    participants: Array.isArray(chat.participants)
      ? chat.participants.map((participant) =>
          isPopulated(participant)
            ? serializePublicUser(participant)
            : { id: String(participant) },
        )
      : [],
    messages: Array.isArray(chat.messages)
      ? chat.messages.map((message) => serializeChatMessage(message))
      : [],
    lastMessageAt: chat.lastMessageAt || null,
    createdAt: chat.createdAt || null,
    updatedAt: chat.updatedAt || null,
  };
}

function serializeNotification(notification) {
  if (!notification) {
    return null;
  }

  return {
    id: String(notification._id),
    kind: notification.kind,
    title: notification.title || "",
    message: notification.message || "",
    link: notification.link || "",
    read: Boolean(notification.readAt),
    readAt: notification.readAt || null,
    createdAt: notification.createdAt || null,
    actor: isPopulated(notification.actorId)
      ? serializePublicUser(notification.actorId)
      : notification.actorId
        ? { id: String(notification.actorId) }
        : null,
  };
}

module.exports = {
  normalizeImage,
  serializeBooking,
  serializeChat,
  serializeChatMessage,
  serializeCurrentUser,
  serializeNotification,
  serializePublicUser,
  serializeReview,
  serializeService,
  toIdArray,
};
