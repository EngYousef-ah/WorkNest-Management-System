const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const Board = require("../models/Board");
const requireWorkspaceMember = require("../middleware/requireWorkspaceMember");
const createBoardSchema = require("../validators/boardValidators");
const validate = require("../middleware/validate");
// Get Board By Id

router.get("/workspaces/:slug/projects/:projectId/boards/:boardId", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId, boardId } = req.params;
        const workspace = req.workspace;


        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null
        })

        if (!project) return res.status(404).json({ messsage: "Project not found" })

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace._id,
            project_id: projectId,
            deleted_at: null
        }).populate('workspace_id').populate('project_id')

        if (!board) {
            return res.status(404).json({ message: "Board not found" })
        }

        res.status(200).json(board)
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." })

    }
})


// get all boards inside project
router.get("/workspaces/:slug/projects/:projectId/boards", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId } = req.params;
        const workspace = req.workspace;


        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null
        })

        if (!project) {
            return res.status(400).json({ messsage: "Project not found" })
        }

        const allBoards = await Board.find({
            project_id: projectId,
            workspace_id: workspace._id,
            deleted_at: null
        })
        res.status(200).json(allBoards)
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." })

    }
})


// create new board
router.post("/workspaces/:slug/projects/:projectId/boards", auth,validate(createBoardSchema), requireWorkspaceMember, async (req, res) => {
    try {
        const workspace = req.workspace;

        const { name, background } = req.body;

        const project = await Project.findOne({
            _id: req.params.projectId,
            workspace_id: workspace._id,
            deleted_at: null
        })
        if (!project) {
            return res.status(400).json({ message: "Project not found." })
        }

        const newBoard = await Board.create({
            name: name.trim(),
            background: background.trim(),
            workspace_id: workspace._id,
            project_id: project._id
        })

        res.status(201).json({ message: "The Board has been successfully created.", board: newBoard })
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." })
    }
})

// archive board
router.delete("/workspaces/:slug/projects/:projectId/boards/:boardId/archive", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId, boardId } = req.params;
        const workspace = req.workspace;

        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null
        })

        if (!project) {
            return res.status(400).json({ messsage: "Project not found" })
        }

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace._id,
            project_id: projectId,
            deleted_at: null
        })

        if (!board) {
            return res.status(400).json({ message: "Board not found to Archive it" })
        }
        board.deleted_at = new Date();
        await board.save();

        res.status(200).json({ message: "The board has been successfully archived." })
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." })

    }
})

module.exports = router;
