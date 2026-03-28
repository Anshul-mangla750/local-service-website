const express = require("express");

const asyncWrap = require("../../middleware/asyncWrap.js");
const { ensureAuthenticated } = require("../../middleware/auth.js");
const Notification = require("../../models/notification.js");
const { serializeNotification } = require("../../utils/serializers.js");

const router = express.Router();

router.use(ensureAuthenticated);

router.get(
  "/",
  asyncWrap(async (req, res) => {
    const parsedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 20;
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("actorId", "username role bio contactNumber workingHours");
    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      readAt: null,
    });

    return res.json({
      success: true,
      unreadCount,
      notifications: notifications.map((notification) => serializeNotification(notification)),
    });
  }),
);

router.patch(
  "/:id/read",
  asyncWrap(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id,
      },
      {
        $set: { readAt: new Date() },
      },
      { new: true },
    ).populate("actorId", "username role bio contactNumber workingHours");

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.json({
      success: true,
      notification: serializeNotification(notification),
    });
  }),
);

router.post(
  "/read-all",
  asyncWrap(async (req, res) => {
    await Notification.updateMany(
      {
        userId: req.user._id,
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      },
    );

    return res.json({
      success: true,
      message: "Notifications marked as read.",
    });
  }),
);

module.exports = router;
