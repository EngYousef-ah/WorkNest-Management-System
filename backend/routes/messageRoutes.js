const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Direct_Messages = require("../models/Direct_Messages");
const Workspace_Member = require("../models/Workspace_Members");
const Workspace = require("../models/Workspace");

const sendMessageSchema = require("../validators/messageValidators");
const validate = require("../middleware/validate");

router.get("/messages/:receiverId/:slug", auth, async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, slug } = req.params;

        if (!slug) return res.status(400).json({ message: "Slug is required." });

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) return res.status(400).json({ message: "Workspace not found." });

        const [sender, receiver] = await Promise.all([
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: senderId }),
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: receiverId })
        ]);

        if (!sender || !receiver) {
            return res.status(403).json({ message: "One or both users are not members of this workspace." });
        }

        await Direct_Messages.updateMany(
            {
                workspace_id: workspace._id,
                sender: receiverId,
                receiver: senderId,
                is_read: false
            },
            { $set: { is_read: true } }
        );

        const messages = await Direct_Messages.find({
            workspace_id: workspace._id,
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        }).sort({ created_at: 1 });

        res.status(200).json({ messages });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


router.get("/messages/:senderId/:slug/unread", auth, async (req, res) => {
    try {
        const receiverId = req.user.userId;
        const { senderId, slug } = req.params;

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) return res.status(400).json({ message: "Workspace not found." });

        const [sender, receiver] = await Promise.all([
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: senderId }),
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: receiverId })
        ]);

        if (!sender || !receiver) {
            return res.status(403).json({ message: "One or both users are not members of this workspace." });
        }

        const messages = await Direct_Messages.find({
            workspace_id: workspace._id,
            sender: senderId,
            receiver: receiverId,
            is_read: false
        }).sort({ createdAt: 1 });

        res.status(200).json({ messages });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." });
    }
});



router.patch("/messages/:senderId/:slug/read", auth, async (req, res) => {
    try {
        const { senderId, slug } = req.params;
        const currentUserId = req.user.userId;

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) return res.status(400).json({ message: "Workspace not found." });

        const [sender, receiver] = await Promise.all([
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: senderId }),
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: currentUserId })
        ]);

        if (!sender || !receiver) {
            return res.status(403).json({ message: "One or both users are not members of this workspace." });
        }

        const result = await Direct_Messages.updateMany(
            {
                workspace_id: workspace._id,
                sender: senderId,
                receiver: currentUserId,
                is_read: false
            },
            {
                $set: { is_read: true }
            }
        );


        const io = req.app.get("io");

        if (io) {
            io.to(senderId).emit("messages_read", {
                readBy: currentUserId
            });
            io.to(currentUserId).emit("unread_count_updated", {
                senderId: senderId
            });
        }

        return res.status(200).json({
            message: "All messages marked as read.",
            count: result.modifiedCount
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error." });
    }
});


router.post("/messages/:receiverId", auth, validate(sendMessageSchema),async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId } = req.params;
        const { slug, content } = req.body; 

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) return res.status(400).json({ message: "Workspace not found." });

        const [sender, receiver] = await Promise.all([
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: senderId }),
            Workspace_Member.findOne({ workspace_id: workspace._id, user_id: receiverId })
        ]);

        if (!sender || !receiver) {
            return res.status(403).json({ message: "Invalid workspace membership." });
        }

        const message = await Direct_Messages.create({
            workspace_id: workspace._id,
            sender: senderId,
            receiver: receiverId,
            content,
            is_read: false
        });

        const io = req.app.get("io");
        if (io) {
            io.to(receiverId).emit("receive_message", message);
            io.to(receiverId).emit("unread_count_updated", {
                senderId: senderId
            });
        }

        res.status(201).json({ message });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


module.exports = router;
