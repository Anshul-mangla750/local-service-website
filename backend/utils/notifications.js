const Notification = require("../models/notification.js");
const { serializeNotification } = require("./serializers.js");

async function createNotification(payload, options = {}) {
  const { io = null } = options;
  const notification = await Notification.create({
    userId: payload.userId,
    actorId: payload.actorId || null,
    kind: payload.kind,
    title: payload.title,
    message: payload.message,
    link: payload.link || "",
  });

  const hydratedNotification = await Notification.findById(notification._id).populate(
    "actorId",
    "username role bio contactNumber workingHours",
  );
  const serializedNotification = serializeNotification(hydratedNotification);

  if (io) {
    io.to(`user:${String(payload.userId)}`).emit("notification:new", {
      notification: serializedNotification,
    });
  }

  return serializedNotification;
}

async function createNotifications(payloads, options = {}) {
  return Promise.all(payloads.map((payload) => createNotification(payload, options)));
}

module.exports = {
  createNotification,
  createNotifications,
};
