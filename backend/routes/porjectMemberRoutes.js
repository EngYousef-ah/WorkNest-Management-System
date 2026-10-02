const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Workspace = require("../models/Workspace");
const Workspace_Member = require("../models/Workspace_Members");
const Project = require("../models/Project");
const project_Member = require("../models/Project_Member");
const requireWorkspaceMember = require("../middleware/requireWorkspaceMember");

// Add require Workspace Member

// Get All Members In Proje ct Id
router.get("/workspaces/:slug/projects/:projectId", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId } = req.params;
        const workspace = req.workspace;

        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null

        });

        if (!project) {
            return res.status(400).json({ message: "Project not found." });
        }

        const allMembersInProject = await project_Member.find({
            project_id: projectId,
            deleted_at: null

        }).populate('user_id', "full_name avatar_url")

        res.status(200).json({ allMembersInProject });


    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

// Add New Member To Project Id
router.post("/workspaces/:slug/projects/:projectId/members", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId } = req.params;
        const { userId, role } = req.body;
        const workspace = req.workspace;

        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null

        });
        if (!project)
            return res.status(400).json({ message: "Project not found." });

        const projectAdmin = await project_Member.findOne({
            project_id: projectId,
            user_id: req.user.userId,
            deleted_at: null
        });


        if (!projectAdmin || projectAdmin.role === "Member") {
            return res.status(403).json({ message: "You don't have permission to manage project members." });
        }

        const allowedRoles = ["Admin", "Member"];
        const requestedRole = role || "Member";

        if (!allowedRoles.includes(requestedRole)) {
            return res.status(400).json({ message: "Invalid role specified." });
        }

        const userInWorkspace = await Workspace_Member.findOne({
            user_id: userId,
            workspace_id: workspace._id,
            deleted_at: null

        });

        if (!userInWorkspace) {
            return res.status(400).json({ message: "User is not a member of this workspace." });
        }


        const memberExists = await project_Member.findOne({
            project_id: projectId,
            user_id: userId,
            deleted_at: null

        });

        if (memberExists) {
            return res.status(400).json({ message: "User already exists in this project." });
        }


        const newMember = await project_Member.create({
            project_id: projectId,
            user_id: userId,
            role: requestedRole
        });

        res.status(201).json({ message: "The member has been successfully added.", newMember });


    } catch (err) {

        if (err.code === 11000) {
            return res.status(400).json({
                message: "This element already exists and cannot be duplicated."
            });
        }

        return res.status(500).json({
            message: "Internal server error."
        });
    }
});


// Delete Member From Project Id
router.delete("/workspaces/:slug/projects/:projectId/members/:memberId", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { projectId, memberId } = req.params;
        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;


        if (userRole.role === "Member")
            return res.status(403).json({ message: "You don't have permission to delete member from this project" });


        const project = await Project.findOne({
            _id: projectId,
            workspace_id: workspace._id,
            deleted_at: null

        });
        if (!project)
            return res.status(400).json({ message: "Project not found." });


        const memberInProject = await project_Member.findOne({
            project_id: projectId,
            user_id: memberId,
            deleted_at: null

        })

        if (!memberInProject) {
            return res.status(400).json({ message: "The member is not found in this project" })
        }

        memberInProject.deleted_at = new Date();
        await memberInProject.save();

        return res.status(200).json({ message: "Member removed successfully." });

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal server error." });
    }
})

module.exports = router;
