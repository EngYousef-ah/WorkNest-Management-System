const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Project = require("../models/Project");
const project_Member = require("../models/Project_Member");
const { mongoose } = require("mongoose");
const requireWorkspaceMember = require("../middleware/requireWorkspaceMember");
const validate = require("../middleware/validate");
const createProjectSchema = require("../validators/projectValidators");

// Get All Projects for Workspace
router.get("/workspaces/:slug/projects", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;
        let projects = [];

        if (userRole === "Owner" || userRole === "Admin") {
            projects = await Project.find({
                workspace_id: workspace._id,
                deleted_at: null
            });
        }
        else {
            const memberProjects = await project_Member.find({
                user_id: req.user.userId
            });
            const projectIds = memberProjects.map(mp => mp.project_id);

            projects = await Project.find({
                workspace_id: workspace._id,
                deleted_at: null,
                $or: [
                    { visibility: "public" },
                    {
                        visibility: "private",
                        _id: { $in: projectIds }
                    }
                ]
            });
        }

        res.status(200).json({ message: "Projects fetched successfully", projects });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

// Create New Project To Workspace
router.post("/workspaces/:slug/projects", auth, validate(createProjectSchema), requireWorkspaceMember, async (req, res) => {
    const workspace = req.workspace;
    const userRole = req.workspaceMember.role;

    if (userRole !== "Owner" && userRole !== "Admin") {
        return res.status(403).json({
            message: "You don't have permission to create projects."
        });
    }

    const { name, description } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingProject = await Project.findOne({
            workspace_id: workspace._id,
            name
        }).session(session);

        if (existingProject) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Project name already exists in this workspace." });
        }

        const newProject = await Project.create([{
            workspace_id: workspace._id,
            name,
            description,
            user_id: req.user.userId
        }], { session });

        await project_Member.create([{
            project_id: newProject[0]._id,
            user_id: req.user.userId,
            role: "Admin"
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: "Project created successfully.",
            project: newProject[0]
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
});

// Change Visibility Project inside Workspace
router.patch("/workspaces/:slug/projects/:projectId", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;

        if (userRole !== "Owner" && userRole !== "Admin") {
            return res.status(403).json({ message: "You don't have permission to update project settings." });
        }

        const project = await Project.findOne({
            _id: req.params.projectId,
            workspace_id: workspace._id
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found." });
        }

        project.visibility = project.visibility === 'public' ? 'private' : 'public';

        await project.save();

        res.status(200).json({
            message: "Visibility settings have been changed.",
            project
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
});


// Archive Project Inside Workspace (Soft Delete)
router.delete("/workspaces/:slug/projects/:projectId/archive", requireWorkspaceMember, auth, async (req, res) => {
    try {
        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;

        if (userRole !== "Owner" && userRole !== "Admin") {
            return res.status(403).json({ message: "You don't have permission to update project settings." });
        }

        const project = await Project.findOne({
            workspace_id: workspace._id,
            _id: req.params.projectId,
            deleted_at: null
        })

        if (!project) {
            return res.status(400).json({ message: "Project not found." })
        }

        project.deleted_at = new Date();
        await project.save();

        res.status(200).json({ message: "Project archived successfully." });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." });
    }
})




module.exports = router;
