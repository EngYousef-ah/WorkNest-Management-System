const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Activity_Log = require("../models/Activity_logs");
const Notifications = require("../models/Notifications");
const { getIo } = require("../sockets/socket");
const Checklist_Item = require("../models/Checklist_items");
const Card_Checklist = require("../models/Card_checklists");

const requireCardAccess = require("../middleware/requireCardAccess");

// Get All Items In Checklist Id
router.get("/cards/:cardId/checklists/:checklistId", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId, checklistId } = req.params;

        const checklist = await Card_Checklist.findOne({
            _id: checklistId,
            card_id: cardId,
            deleted_at: null
        });
        if (!checklist) return res.status(400).json({ message: "Checklist not found." })

        const checklistItems = await Checklist_Item.find({
            card_id: cardId,
            checklist_id: checklistId,
            deleted_at: null
        })

        res.status(200).json({ checklistItems });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// Add New Item To Checklist Id
router.post("/cards/:cardId/checklists/:checklistId/item", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId, checklistId } = req.params;
        const { text } = req.body;

        if (!text) return res.status(400).json({ message: "Text is required." });

        const checklist = await Card_Checklist.findOne({
            _id: checklistId,
            card_id: cardId,
            deleted_at: null
        });
        if (!checklist) return res.status(400).json({ message: "Checklist not found." })

        const lastItem = await Checklist_Item.findOne({
            checklist_id: checklistId,
            deleted_at: null
        }).sort({ position: -1 });

        const nextPosition = lastItem ? lastItem.position + 1 : 1;

        const checklistItems = await Checklist_Item.create({
            card_id: cardId,
            checklist_id: checklistId,
            text,
            position: nextPosition
        })

        res.status(201).json({ checklistItems });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})


// Delete Item From Checklist Id
router.delete("/cards/:cardId/checklists/:checklistId/items/:itemId", auth,requireCardAccess,async (req, res) => {
    try {
        const { cardId, checklistId, itemId } = req.params;

        const checklist = await Card_Checklist.findOne({
            _id: checklistId,
            card_id: cardId,
            deleted_at: null
        });
        if (!checklist) return res.status(400).json({ message: "Checklist not found." })

        const checklistItem = await Checklist_Item.findOne({
            _id: itemId,
            card_id: cardId,
            checklist_id: checklistId,
            deleted_at: null
        });

        if (!checklistItem) {
            return res.status(400).json({ message: "Checklist item not found." });
        }
        checklistItem.deleted_at = new Date();
        await checklistItem.save();

        res.status(200).json({ message: "Checklist item removed successfully.", checklistItem });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// Change Status Item In Checklist 
router.patch("/cards/:cardId/checklists/:checklistId/items/:itemId", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId, checklistId, itemId } = req.params;

        const checklistItem = await Checklist_Item.findOne({
            _id: itemId,
            card_id: cardId,
            checklist_id: checklistId,
            deleted_at: null
        });

        if (!checklistItem) {
            return res.status(400).json({ message: "Checklist item not found." });
        }

        checklistItem.is_completed = !checklistItem.is_completed;
        await checklistItem.save();

        if (checklistItem.is_completed) {
            const allItems = await Checklist_Item.find({
                checklist_id: checklistId,
                deleted_at: null
            });
            const allCompleted = allItems.length > 0 && allItems.every(item => item.is_completed === true);
            if (allCompleted) {
                const checklist = await Card_Checklist.findOne({ _id: checklistId, deleted_at: null });

                if (checklist) {
                    await Activity_Log.create({
                        card_id: checklist.card_id,
                        user_id: req.user.userId,
                        action: `All items on the checklist  "${checklist.title}" have been successfully completed.`
                    });
                }
            }
        }
        res.status(200).json({ checklistItem });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// Add Member To Checklist Item
router.patch("/cards/:cardId/checklists/:checklistId/items/:itemId/addMember", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId, checklistId, itemId } = req.params;
        const { memberId } = req.body;

        const isUser = await User.findById(memberId);
        if (!isUser) return res.status(400).json({ message: "The member is not registered in the system." })

        
        const checklistItem = await Checklist_Item.findOne({
            _id: itemId,
            card_id: cardId,
            checklist_id: checklistId,
            deleted_at: null
        });

        if (!checklistItem) {
            return res.status(400).json({ message: "Checklist item not found." });
        }

        checklistItem.assigned_to = memberId;
        await checklistItem.save();
        const user = await User.findOne({ _id: req.user.userId })

        const newNotification = await Notifications.create({
            user_id: memberId,
            content: `You have been added to checklist item ${checklistItem?.text} by ${user.full_name}`
        });
        const io = getIo();
        io.to(memberId.toString()).emit("new-notification", newNotification);

        res.status(200).json({ checklistItem });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})

// Change Due-Date Checklist Item
router.patch("/cards/:cardId/checklists/:checklistId/items/:itemId/changeDueDate", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId, checklistId, itemId } = req.params;
        const { due_date } = req.body;

        const checklistItem = await Checklist_Item.findOne({
            _id: itemId,
            card_id: cardId,
            checklist_id: checklistId,
            deleted_at: null
        });

        if (!checklistItem) {
            return res.status(400).json({ message: "Checklist item not found." });
        }

        checklistItem.due_date = due_date;
        await checklistItem.save();

        res.status(200).json({ checklistItem });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})





module.exports = router;
