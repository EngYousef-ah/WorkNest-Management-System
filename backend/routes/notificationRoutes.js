const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Notifications = require("../models/Notifications");


// Get All Notifications
router.get("/notifications", auth, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { filter } = req.query;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 5;
        const skip = (page - 1) * limit;

        const user = await User.findById(userId);
        if (!user) return res.status(400).json({ message: "User not found" });

        const query = { user_id: userId };

        if (filter === "read") {
            query.read = true;
        } else if (filter === "unread") {
            query.read = false;
        }

        const notifications = await Notifications.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const totalNotifications = await Notifications.countDocuments(query);

        const totalPages = Math.ceil(totalNotifications / limit) || 1;

        res.status(200).json({
            message: "There are  all notifications",
            notifications,
            pagination: {
                currentPage: page,
                totalPages,
                totalNotifications,
                limit
            }
        });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})

// Create New Notification
router.post("/notifications/:userId", auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { content } = req.body;
        if (!content) return res.status(403).json({ message: "Content is required" });

        const user = await User.findById({ _id: userId });
        if (!user) return res.status(400).json({ message: "User not found" });

        const notifications = await Notifications.create({
            user_id: userId,
            content
        });

        res.status(201).json({ message: "new notification", notifications });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})

// Read All Notifications
router.patch("/notifications/read-all", auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById({ _id: userId });
        if (!user) return res.status(400).json({ message: "User not found" });


        const result = await Notifications.updateMany(
            {
                user_id: userId,
                read: false
            },
            {
                $set: { read: true }
            }
        );

        res.status(200).json({
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})


// Read One Notification
router.patch("/notifications/:notificationId", auth, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        const user = await User.findById({ _id: userId });
        if (!user) return res.status(400).json({ message: "User not found" });

        const notification = await Notifications.findOne({
            _id: notificationId,
            user_id: userId

        });
        if (!notification) return res.status(400).json({ message: "Notification not found" });
        notification.read = true;
        await notification.save()

        res.status(200).json({ notification });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})
module.exports = router;
