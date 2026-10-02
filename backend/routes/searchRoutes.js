const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Comment = require("../models/Comment");
const Card = require("../models/Card");

const Board = require("../models/Board");
const Workspace_Member = require("../models/Workspace_Members");
const Workspace = require("../models/Workspace");
const searchSchema = require("../validators/searchValidators");
const validate = require("../middleware/validate");

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}



router.get('/workspaces/:slug/search', auth,validate(searchSchema), async (req, res) => {
    try {
        const { slug } = req.params;
        const { query, pageCard = 1, pageComment = 1 } = req.query;
        const limit = 5;

        const searchQuery = escapeRegExp(query.trim());

        const workspace = await Workspace.findOne({
            slug,
            deleted_at: null
        });

        if (!workspace) {
            return res.status(400).json({ message: 'Workspace not found' });
        }

        const workspaceMember = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: req.user.userId,
            deleted_at: null
        });

        if (!workspaceMember) {
            return res.status(403).json({ message: 'You are not a member of this workspace' });
        }

        const boards = await Board.find({
            workspace_id: workspace._id
        }).select('_id name');

        const boardIds = boards.map(board => board._id);

        const cardFilter = {
            board_id: { $in: boardIds },
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        const totalCardsCount = await Card.countDocuments(cardFilter);
        const totalCardPages = Math.ceil(totalCardsCount / limit) || 1;

        const cards = await Card.find(cardFilter)
            .populate('board_id')
            .populate({
                path: 'list_id',
                populate: {
                    path: 'project_id'
                }
            })
            .skip((Number(pageCard) - 1) * limit)
            .limit(limit);

        const allWorkspaceCards = await Card.find({
            board_id: { $in: boardIds }
        }).select('_id');

        const allWorkspaceCardIds = allWorkspaceCards.map(card => card._id);


        const commentFilter = {
            card_id: { $in: allWorkspaceCardIds },
            content: { $regex: searchQuery, $options: 'i' }
        };

        const totalCommentsCount = await Comment.countDocuments(commentFilter);
        const totalCommentPages = Math.ceil(totalCommentsCount / limit) || 1;

        const comments = await Comment.find(commentFilter)
            .populate({
                path: 'card_id',
                select: 'title list_id board_id project_id'
            })
            .skip((Number(pageComment) - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            cards,
            comments,
            pagination: {
                cards: {
                    totalPages: totalCardPages,
                    currentPage: Number(pageCard)
                },
                comments: {
                    totalPages: totalCommentPages,
                    currentPage: Number(pageComment)
                }
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;
