const Card = require('../models/Card');
const List = require('../models/List');
const Board = require('../models/Board');
const Project = require('../models/Project');
const Workspace_Member = require('../models/Workspace_Members');

const requireCardAccess = async (req, res, next) => {
    try {
        const { cardId } = req.params;
        const userId = req.user.userId;

        const card = await Card.findOne({ _id: cardId, deleted_at: null });
        if (!card) {
            return res.status(404).json({ message: "Card not found" });
        }

        const list = await List.findOne({ _id: card.list_id, deleted_at: null });
        if (!list) return res.status(404).json({ message: "List not found" });

        const board = await Board.findOne({ _id: list.board_id, deleted_at: null });
        if (!board) return res.status(404).json({ message: "Board not found" });

        const project = await Project.findOne({ _id: board.project_id, deleted_at: null });
        if (!project) return res.status(404).json({ message: "Project not found" });

        const workspaceMember = await Workspace_Member.findOne({
            workspace_id: project.workspace_id,
            user_id: userId
        });

        if (!workspaceMember) {
            return res.status(403).json({ message: "Access denied. You are not a member of this workspace." });
        }

        req.card = card;
        req.workspaceId = project.workspace_id;

        next();
    } catch (error)  {
        console.error(error);
        res.status(500).json({ message: "Internal server error during card access check." });
    }
};

module.exports = requireCardAccess;