const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Activity_Log = require("../models/Activity_logs");
const Card = require("../models/Card");
const Notifications = require("../models/Notifications");
const { getIo } = require("../sockets/socket");
const List = require("../models/List");
const Card_Assignment = require("../models/Card_Assignment");
const Card_Watcher = require("../models/Card_Watchers");
const Workspace_Member = require("../models/Workspace_Members");
const { mongoose } = require("mongoose");
const requireListAccess = require("../middleware/requireListAccess");
const { createCardSchema,updateCardSchema } = require("../validators/cardValidators");
const validate = require("../middleware/validate");


// Get All Cards In List Id
router.get("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/:listId/cards", auth, requireListAccess, async (req, res) => {
    try {
        const { workspace, project, board, list } = req;
        const cards = await Card.find({
            workspace_id: workspace._id,
            project_id: project._id,
            board_id: board._id,
            list_id: list._id,
            deleted_at: null
        }).sort({ position: 1 }).populate("created_by");

        res.status(200).json(cards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});


// Create A Card In List Id
router.post("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/:listId/cards", auth,validate(createCardSchema), requireListAccess, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { title, description, priority, dueDate } = req.body;
        const { workspace, project, board, list } = req;

        const lastCard = await Card.findOne({ list_id: list._id, deleted_at: null }).sort({ position: -1 });
        const position = lastCard ? lastCard.position + 1 : 0;

        const [newCard] = await Card.create([{
            workspace_id: workspace._id,
            project_id: project._id,
            board_id: board._id,
            list_id: list._id,
            title,
            description: description,
            position,
            priority,
            due_date: dueDate,
            created_by: req.user.userId
        }], { session });

        await Card_Assignment.create([{
            card_id: newCard._id,
            user_id: req.user.userId,

        }], { session })

        await Activity_Log.create([{
            card_id: newCard._id,
            user_id: req.user.userId,
            action: `Create a ${newCard?.title} card`
        }], { session });

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ message: "Card created successfully", newCard });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err);
        res.status(500).json({ message: "Internal server error." });
    }
});


// Update Card 
router.patch("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/:listId/cards/:cardId", auth,validate(updateCardSchema), requireListAccess, async (req, res) => {
    try {
        const { title, description, priority, due_date: dueDate, members } = req.body;
        const { cardId } = req.params;
        const { workspace, project, board, list } = req;

        const card = await Card.findOne({
            _id: cardId,
            workspace_id: workspace._id,
            project_id: project._id,
            board_id: board._id,
            list_id: list._id,
            deleted_at: null
        });
        if (!card) return res.status(400).json({ message: "Card not found" });

        const oldDate = card.due_date ? new Date(card.due_date).toISOString() : null;

        let isDueDateChanged = false;
        const formatDateOnly = (dateVal) => {
            if (!dateVal) return "None";
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return "None";

            return d.toISOString().split('T')[0];
        };
        if (dueDate !== undefined) {

            const oldDueDateStr = card.due_date ? new Date(card.due_date).toISOString() : null;
            const newDueDateStr = dueDate ? new Date(dueDate).toISOString() : null;

            if (oldDueDateStr !== newDueDateStr) {
                isDueDateChanged = true;
                await Card.updateOne(
                    { _id: card._id },
                    {
                        $set: {
                            due_date: dueDate,
                            is_due_notification_sent: false
                        }
                    }
                );

            }
            card.due_date = dueDate;

        }
        const newDate = dueDate ? new Date(dueDate).toISOString() : null;

        if (title !== undefined) card.title = title;
        if (description !== undefined) card.description = description;
        if (priority !== undefined) card.priority = priority;

        await card.save();

        if (isDueDateChanged) {


            await Activity_Log.create({
                card_id: card._id,
                user_id: req.user.userId,
                action: `Change the due date from ${formatDateOnly(oldDate)} to ${formatDateOnly(newDate)}.`
            });
        }

        if (members && Array.isArray(members)) {
            let updatedMembers = [...new Set(members)];


            const creatorId = card.created_by?.toString();
            if (creatorId && !updatedMembers.includes(creatorId)) {
                updatedMembers.push(creatorId);
            }

            const count = await Workspace_Member.countDocuments({
                workspace_id: workspace._id,
                user_id: { $in: updatedMembers }
            });

            if (count !== updatedMembers.length) {
                return res.status(400).json({ message: "One or more users do not belong to this workspace." });
            }


            await Card_Assignment.deleteMany({ card_id: card._id });
            const assignments = updatedMembers.map(userId => ({
                card_id: card._id,
                user_id: userId
            }));
            await Card_Assignment.insertMany(assignments);
        }

        const io = getIo();
        io.to(`board:${board._id}`).emit("cardUpdated", { card });
        const user = await User.findOne({ _id: req.user.userId })
        const cardWatchers = await Card_Watcher.find({ card_id: cardId }).populate('user_id')
        for (const watcher of cardWatchers) {

            if (watcher.user_id._id.toString() !== req.user.userId.toString()) {
                const newNotification = await Notifications.create({
                    user_id: watcher.user_id._id,
                    content: `Card "${card?.title}" was updated by ${user.full_name}.`
                });

                io.to(watcher.user_id._id.toString()).emit("new-notification", newNotification);
            } else {
                const newNotification = await Notifications.create({
                    user_id: watcher.user_id._id,
                    content: `Card "${card?.title}" was updated by you.`
                });

                io.to(watcher.user_id._id.toString()).emit("new-notification", newNotification);
            }

        }

        res.status(200).json({ message: "Card updated successfully", card });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error." });
    }
});


// Archive Card (Soft Delete)
router.delete("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/:listId/cards/:cardId/archive", auth, requireListAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const { workspace, project, board, list } = req;

        const card = await Card.findOne({
            _id: cardId,
            workspace_id: workspace._id,
            project_id: project._id,
            board_id: board._id,
            list_id: list._id,
            deleted_at: null
        });
        if (!card) return res.status(400).json({ message: "Card not found" });

        card.deleted_at = new Date();
        await card.save();


        res.status(200).json({ message: "Card archived successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error." });
    }
});


// Restore Card
router.patch("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/:listId/cards/:cardId/restore", auth, requireListAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const { workspace, project, board, list } = req;

        const card = await Card.findOne({
            _id: cardId,
            workspace_id: workspace._id,
            project_id: project._id,
            board_id: board._id,
            list_id: list._id,
            deleted_at: { $ne: null }
        })
        if (!card) return res.status(400).json({ message: "Card not found" })


        card.deleted_at = null;
        await card.save();
        res.status(200).json({ message: "This card has been unarchived.", card })
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
})

// Get All Cards Archived
router.get("/workspaces/:slug/projects/:projectId/boards/:boardId/cardsArchive", auth, requireListAccess, async (req, res) => {
    try {
        const { workspace, project, board } = req;

        const cards = await Card.find({
            workspace_id: workspace._id,
            project_id: project._id,
            board_id: board._id,
            deleted_at: { $ne: null }
        }).populate('list_id');

        res.status(200).json(cards);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

//  ReOrder Cards
router.put("/workspaces/:slug/projects/:projectId/boards/:boardId/cards/move", auth, requireListAccess, async (req, res) => {
    try {
        const {board } = req;

        const { updatedCards } = req.body;

        const boardId = board._id;

        if (!Array.isArray(updatedCards) || updatedCards.length === 0) {
            return res.status(400).json({
                message: "updatedCards must be a non-empty array."
            });
        }
        // const cardIds = updatedCards.map(c => c._id);
        const targetListIds = [...new Set(updatedCards.map(c => c.list_id))];

        const listsCount = await List.countDocuments({
            _id: { $in: targetListIds },
            board_id: boardId
        });

        if (listsCount !== targetListIds.length) {
            return res.status(403).json({ message: "One or more target lists do not belong to this board." });
        }

        const bulkOps = updatedCards.map((card) => ({
            updateOne: {
                filter: {
                    _id: card._id,
                    board_id: boardId
                },
                update: {
                    list_id: card.list_id,
                    position: card.position
                }
            }
        }));

        const result = await Card.bulkWrite(bulkOps);

        if (result.modifiedCount !== updatedCards.length) {
            return res.status(403).json({
                message: "Some cards could not be moved because they do not belong to this board or do not exist."
            });
        }

        if (updatedCards.length > 0) {
            await Activity_Log.create({
                card_id: updatedCards[0]._id,
                user_id: req.user.userId,
                action: 'Moving a card to another location'
            });
        }

        const io = getIo();
        // const updatedCardsFull = await Card.find({
        //     _id: { $in: updatedCards.map(c => c._id) }
        // });
        // io.to(`board:${boardId}`).emit("cardsMoved", {
        //     updatedCards: updatedCardsFull,
        //     boardId
        // });
        io.to(`board:${boardId}`).emit("cardsMoved", {
            updatedCards,
            boardId
        });

        res.status(200).json({
            message: "Cards reordered successfully."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});




module.exports = router;
