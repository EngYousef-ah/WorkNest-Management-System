const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Card = require("../models/Card");
const Notifications = require("../models/Notifications");
const Workspace = require("../models/Workspace")
const Project = require("../models/Project")
const { getIo } = require("../sockets/socket");
const Card_Label = require("../models/Card_label");
const Card_Watcher = require("../models/Card_Watchers");
const Workspace_Label = require("../models/Workspace_Label");
const requireCardAccess = require("../middleware/requireCardAccess");

// Get All Labels From The Card
router.get("/cards/:cardId/labels", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const cardLabels = await Card_Label.find({
            card_id: cardId,
            deleted_at: null
        });
        res.status(200).json({ cardLabels });
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// Add Label To The Card
router.post("/cards/:cardId/labels/card-labels", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const { labels } = req.body;
        const card=req.card
        if (!Array.isArray(labels)) {
            return res.status(400).json({ message: "Labels must be an array of IDs" });
        }

     
        const uniqueLabelIds = [...new Set(labels)];
        if (uniqueLabelIds.length > 0) {
            const validLabelsCount = await Workspace_Label.countDocuments({
                _id: { $in: uniqueLabelIds },
                workspace_id: card.workspace_id,
                deleted_at: null
            });

            if (validLabelsCount !== uniqueLabelIds.length) {
                return res.status(403).json({
                    message: "One or more labels do not belong to this workspace."
                });
            }
        }

        await Card_Label.updateMany(
            { card_id: cardId, deleted_at: null },
            { $set: { deleted_at: new Date() } }
        );

        const savedLabels = [];

        for (const labelId of uniqueLabelIds) {
            let existingLabel = await Card_Label.findOne({
                card_id: cardId,
                card_label: labelId
            });

            if (existingLabel) {
                existingLabel.deleted_at = null;
                await existingLabel.save();
                savedLabels.push(existingLabel);
            } else {
                const newLabelDoc = await Card_Label.create({
                    card_id: cardId,
                    card_label: labelId,
                    deleted_at: null
                });
                savedLabels.push(newLabelDoc);
            }
        }

        const user = await User.findOne({ _id: req.user.userId });
        const cardWatchers = await Card_Watcher.find({ card_id: cardId, deleted_at: null }).populate('user_id');
        const currentUserId = req.user.userId.toString();

        for (const watcher of cardWatchers) {
            if (!watcher.user_id) continue;
            const watcherId = watcher.user_id._id.toString();

            if (watcherId !== currentUserId) {
                const newNotification = await Notifications.create({
                    user_id: watcherId,
                    content: `Card "${card?.title}" labels updated successfully by ${user?.full_name || 'someone'}.`
                });
                const io = getIo();
                io.to(watcherId).emit("new-notification", newNotification);
            }
        }

        return res.status(200).json({
            message: "Card labels updated successfully",
            data: savedLabels
        });

    }
    catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(400).json({
                message: "This element already exists and cannot be duplicated."
            });
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
})


// Delete Label From The Card
router.delete("/cards/:cardId/labels/:labelId", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId, labelId } = req.params;
    

        const labelRelation = await Card_Label.findOne({
            card_id: cardId,
            card_label: labelId,
            deleted_at: null
        });

        if (!labelRelation) {
            return res.status(404).json({ message: "Label relation not found" });
        }

        labelRelation.deleted_at = new Date();
        await labelRelation.save();

        res.status(200).json({ message: "Label removed successfully" });

    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})
module.exports = router;
