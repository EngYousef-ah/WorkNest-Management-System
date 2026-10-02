const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const User = require("../models/User");
const Activity_Log = require("../models/Activity_logs");
const Notifications = require("../models/Notifications");

const { getIo } = require("../sockets/socket");
const Card_Assignment = require("../models/Card_Assignment");
const Card_Watcher = require("../models/Card_Watchers");
const Board = require("../models/Board");
const Workspace_Member = require("../models/Workspace_Members");
const requireCardAccess = require("../middleware/requireCardAccess");

// Get All Card Assignments
router.get("/cards/:cardId", auth, requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;

        const cardAssignments = await Card_Assignment.find({
            card_id: cardId
        }).populate("user_id", "full_name display_name avatar_url email")

        res.status(200).json({ cardAssignments });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error." })
    }
})

// Change Members Card
router.post("/cards/:cardId/assign-members", auth, requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const { members } = req.body;
        const card = req.card;

        if (!Array.isArray(members)) {
            return res.status(400).json({ message: "Members must be an array of IDs" });
        }

       
        const board = await Board.findById(card.board_id);
        if (!board) {
            return res.status(400).json({ message: "Board not found" });
        }
        const workspaceId = board.workspace_id;

        let newMemberIds = [...new Set(members.map(id => id.toString()))];

        if (newMemberIds.length > 0) {
            const count = await Workspace_Member.countDocuments({
                workspace_id: workspaceId,
                user_id: { $in: newMemberIds }
            });

            if (count !== newMemberIds.length) {
                return res.status(400).json({ message: "One or more users do not belong to this workspace." });
            }
        }

        const existingAssignments = await Card_Assignment.find({ card_id: cardId });
        const oldMemberIds = existingAssignments.map(a => a.user_id.toString());

        const isSameLength = oldMemberIds.length === newMemberIds.length;
        const hasAllElements = oldMemberIds.every(id => newMemberIds.includes(id));
        const areMembersChanged = !isSameLength || !hasAllElements;

        if (!areMembersChanged) {
            return res.status(200).json({
                newAssignments: existingAssignments,
                message: "Card members updated successfully (no changes)."
            });
        }

        await Card_Assignment.deleteMany({ card_id: cardId });

        const newAssignments = newMemberIds.map((userId) => ({
            card_id: cardId,
            user_id: userId
        }));

        if (newAssignments.length > 0) {
            await Card_Assignment.insertMany(newAssignments);
        }

        await Activity_Log.create({
            card_id: cardId,
            user_id: req.user.userId,
            action: 'Updated members for this card.'
        });

        const user = await User.findOne({ _id: req.user.userId });
        const cardWatchers = await Card_Watcher.find({ card_id: cardId }).populate('user_id');
        const currentUserId = req.user.userId.toString();
        const newAddedMembers = newMemberIds.filter(id => !oldMemberIds.includes(id));

        await Promise.all(
            newAddedMembers.map(async (memberId) => {
                if (memberId !== currentUserId) {
                    const newNotification = await Notifications.create({
                        user_id: memberId,
                        content: `You have been added to card "${card.title}" by ${user.full_name}`
                    });
                    const io = getIo();
                    io.to(memberId).emit("new-notification", newNotification);
                }
            })
        );

        for (const watcher of cardWatchers) {
            const watcherId = watcher.user_id._id.toString();

            if (watcherId !== currentUserId) {
                const newNotification = await Notifications.create({
                    user_id: watcherId,
                    content: `Card "${card.title}" members were updated by ${user.full_name}.`
                });
                const io = getIo();
                io.to(watcherId).emit("new-notification", newNotification);
            }
        }

        const io = getIo();
        io.to(`board:${card.board_id}`).emit("cardUpdated", { card });

        res.status(200).json({
            newAssignments,
            message: "Card members updated successfully."
        });

    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(400).json({
                message: "This element already exists and cannot be duplicated."
            });
        }
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// Delete Member Card (I do not use it.)
router.delete("/cards/:cardId/delete", auth, requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const { user_id } = req.body;
        if (!user_id) return res.status(400).json({ message: "User in required" })


        const isMemberInCard = await Card_Assignment.findOne({
            card_id: cardId,
            user_id
        })
        if (!isMemberInCard) return res.status(400).json({ message: "The member is not found in the card." })

        await Card_Assignment.deleteOne({
            card_id: cardId,
            user_id
        });

        res.status(200).json({ message: "The member has been successfully deleted." })

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})

module.exports = router;
