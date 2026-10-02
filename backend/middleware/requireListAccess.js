const Workspace = require('../models/Workspace');
const Workspace_Member = require('../models/Workspace_Members');
const Project = require('../models/Project');
const Board = require('../models/Board');
const List = require('../models/List');

const requireListAccess = async (req, res, next) => {
    try {
        const { slug, projectId, boardId, listId } = req.params;
        const userId = req.user.userId;


        if (!slug) {
            return res.status(400).json({ message: "Workspace Slug is required" });
        }

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        const workspaceMember = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: userId
        });

        if (!workspaceMember) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        let project = null;
        if (projectId) {
            project = await Project.findOne({
                _id: projectId,
                workspace_id: workspace._id,
                deleted_at: null
            });
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }
        }

        let board = null;
        if (boardId) {
            board = await Board.findOne({
                _id: boardId,
                workspace_id: workspace._id,
                project_id: projectId,
                deleted_at: null
            });
            if (!board) {
                return res.status(404).json({ message: "Board not found" });
            }
        }

        let list = null;
        if (listId) {
            list = await List.findOne({
                _id: listId,
                workspace_id: workspace._id,
                project_id: projectId,
                board_id: boardId,
                deleted_at: null
            });
            if (!list) {
                return res.status(404).json({ message: "List not found" });
            }
        }

        req.workspace = workspace;
        req.workspaceMember = workspaceMember;
        req.project = project;
        req.board = board;
        req.list = list;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error during hierarchy validation." });
    }
};

module.exports = requireListAccess;