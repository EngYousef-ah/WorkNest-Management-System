const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const Board = require("../models/Board");
const List = require("../models/List");
const requireWorkspaceMember = require("../middleware/requireWorkspaceMember");
const createListSchema = require("../validators/listValidators");
const validate = require("../middleware/validate");

// Get All Lists
router.get("/workspaces/:slug/projects/:projectId/boards/:boardId/lists", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId, boardId } = req.params;
        const workspace = req.workspace;


        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id
        })

        if (!project) {
            return res.status(400).json({ message: "Project not found" });
        }

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace._id,
            project_id: projectId,
            deleted_at: null

        })

        if (!board) {
            return res.status(400).json({ message: "Board not found" })
        }

        const lists = await List.find({
            workspace_id: workspace._id,
            project_id: projectId,
            board_id: boardId,
            deleted_at: null
        }).sort({ position: 1 })

        if (!lists) {
            return res.status(200).json({ message: "There are no lists for this project." })
        }

        res.status(200).json(lists || [])
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error." })
    }
})


// create new List
router.post("/workspaces/:slug/projects/:projectId/boards/:boardId/lists", auth,validate(createListSchema), requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId, boardId } = req.params;
        const { name } = req.body;
        const workspace = req.workspace;


        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id
        })
        if (!project) {
            return res.status(400).json({ message: "Project not found" })
        }

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace._id,
            project_id: projectId
        })
        if (!board) {
            return res.status(400).json({ message: "Board not found" });
        }

        const lastList = await List.findOne({
            board_id: boardId
        }).sort({ position: -1 });

        const position = lastList ? lastList.position + 1 : 0;

        const newList = await List.create({
            workspace_id: workspace._id,
            project_id: projectId,
            board_id: boardId,
            name,
            position
        })
        res.status(201).json({ message: "The list has been created successfully.", newList })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error." })

    }
})


// Edit List Name
router.patch("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/:listId", auth,validate(createListSchema), requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId, boardId, listId } = req.params;
        const { name } = req.body;
        const workspace = req.workspace;

        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null

        })
        if (!project) {
            return res.status(400).json({ message: "Project not found" })
        }

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace._id,
            project_id: projectId,
            deleted_at: null

        })
        if (!board) {
            return res.status(400).json({ message: "Board not found" });
        }

        const currentList = await List.findOne({
            _id: listId,
            workspace_id: workspace._id,
            project_id: projectId,
            deleted_at: null

        });

        if (!currentList) {
            return res.status(400).json({ message: "List not found" })
        }
        currentList.name = name;
        await currentList.save();

        res.status(200).json({ message: "The list has been updated successfully.", currentList })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error." })

    }
})


// Archive List 
router.delete("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/:listId/archive", requireWorkspaceMember, auth, async (req, res) => {
    try {
        const { projectId, boardId, listId } = req.params;
        const workspace = req.workspace;


        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null

        })
        if (!project) {
            return res.status(400).json({ message: "Project not found" })
        }

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace._id,
            project_id: projectId,
            deleted_at: null

        })
        if (!board) {
            return res.status(400).json({ message: "Board not found" });
        }

        const currentList = await List.findOne({
            _id: listId,
            workspace_id: workspace._id,
            project_id: projectId,
            board_id: boardId,
            deleted_at: null
        });

        if (!currentList) {
            return res.status(400).json({ message: "List not found" })
        }
        currentList.deleted_at = new Date();
        await currentList.save();

        res.status(200).json({ message: "The list has been Archived successfully." })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error." })

    }
})


// Reorder List
router.put("/workspaces/:slug/projects/:projectId/boards/:boardId/lists/reorder", auth,requireWorkspaceMember, async (req, res) => {
    try {

        const {  projectId, boardId } = req.params;
        const { lists } = req.body;
        const workspace = req.workspace;
        const io = req.app.get("io");

        if (!Array.isArray(lists) || lists.length === 0) {
            return res.status(400).json({ message: "Invalid lists data. Expected a non-empty array." });
        }

      

        const board = await Board.findOne({
            _id: boardId,
            workspace_id: workspace._id,
            project_id: projectId,
            deleted_at: null
        })
        if (!board) return res.status(404).json({ message: "Board or related Project not found" });

        const bulkOps = [];
        const listIds = [];

        for (const list of lists) {
            if (!list._id || typeof list.position !== 'number' || list.position < 0) {
                return res.status(400).json({ message: "Invalid list ID or position value. Positions must be non-negative numbers." });
            }
            listIds.push(list._id);

            bulkOps.push({
                updateOne: {
                    filter: { _id: list._id, board_id: boardId },
                    update: { $set: { position: list.position } }
                }
            });
        }

        const existingListsCount = await List.countDocuments({
            _id: { $in: listIds },
            board_id: boardId,
            deleted_at: null

        });
        if (existingListsCount !== lists.length) {
            return res.status(403).json({ message: "Some lists do not belong to this board or do not exist." });
        }

        await List.bulkWrite(bulkOps);

        io.to(`board:${boardId}`).emit("listsReordered", {
            lists,
            boardId
        });
        res.status(200).json({ message: "Lists reordered successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

module.exports = router;
