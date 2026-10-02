const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Card = require("../models/Card");
const Checklist_Item = require("../models/Checklist_items");
const Card_Checklist = require("../models/Card_checklists");
const Card_Assignment = require("../models/Card_Assignment");
const Card_Label = require("../models/Card_label");
const List = require("../models/List");
const Board = require("../models/Board");
const Project = require("../models/Project");
const Workspace = require("../models/Workspace");

router.get('/workspaces/:slug/projects/:projectId/boards/:boardId/all-data', auth, async (req, res) => {
    try {
        const { slug, projectId, boardId } = req.params;

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) return res.status(400).json({ message: "Workspace not found." })

        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace.id,
            deleted_at: null
        })
        if (!project) return res.status(400).json({ message: "Project not found." })

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace.id,
            project_id: projectId,
            deleted_at: null
        })
        if (!board) return res.status(400).json({ message: "Board not found." })

        const lists = await List.find({
            workspace_id: workspace.id,
            project_id: projectId,
            board_id: boardId,
            deleted_at: null

        }).sort({ position: 1 });

        const cards = await Card.find({
            workspace_id: workspace.id,
            project_id: projectId,
            board_id: boardId,
            deleted_at: null
        }).sort({ position: 1 });

        const cardIds = cards.map(card => card._id);

        if (cardIds.length === 0) {
            return res.status(200).json({
                success: true,
                board,
                lists,
                cards: []
            });
        }

        const [cardLabels, cardAssignments] = await Promise.all([
            Card_Label.find({ card_id: { $in: cardIds } ,deleted_at: null}).populate('card_label'),
            Card_Assignment.find({ card_id: { $in: cardIds },deleted_at: null }).populate('user_id')
        ]);

        const checklists = await Card_Checklist.find({ card_id: { $in: cardIds },deleted_at: null }, { card_id: 1, _id: 1 });
        const checklistIds = checklists.map(c => c._id);

        const checklistItems = await Checklist_Item.find(
            { checklist_id: { $in: checklistIds },deleted_at: null },
            { checklist_id: 1, is_completed: 1 }
        );

        const cardsWithDetails = cards.map(card => {
            const cardObj = card.toObject();

            cardObj.labels = cardLabels
                .filter(cl => cl.card_id.toString() === card._id.toString())
                .map(cl => cl.card_label);

            cardObj.assignments = cardAssignments
                .filter(ca => ca.card_id.toString() === card._id.toString())
                .map(ca => ca.user_id);


            const cardChecklistIds = checklists
                .filter(cl => cl.card_id.toString() === card._id.toString())
                .map(cl => cl._id.toString());

            const relevantItems = checklistItems.filter(item =>
                cardChecklistIds.includes(item.checklist_id.toString())
            );

            const totalItems = relevantItems.length;
            const completedItems = relevantItems.filter(item => item.is_completed).length;

            cardObj.checklistItems = {
                total: totalItems,
                completed: completedItems
            };

            return cardObj;
        });

        return res.status(200).json({
            success: true,
            board,
            lists,
            cards: cardsWithDetails
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error." })
    }
})


module.exports = router;
