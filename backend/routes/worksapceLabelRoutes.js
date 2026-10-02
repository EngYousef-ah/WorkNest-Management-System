const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const workspace_Label = require("../models/Workspace_Label");

const validate = require("../middleware/validate");
const { createLabelSchema } = require("../validators/labelValidators");
const requireWorkspaceMember = require("../middleware/requireWorkspaceMember");

router.get("/workspaces/:slug/labels", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const labels = await workspace_Label.find({
            workspace_id: req.workspace._id,
            deleted_at: null
        });
        res.status(200).json(labels);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: error })
    }
})

router.post("/workspaces/:slug/labels", auth, requireWorkspaceMember, validate(createLabelSchema), async (req, res) => {
    try {
        const { name, color } = req.body;
        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;

        if (userRole !== "Owner" && userRole !== "Admin") {
            return res.status(403).json({ message: "The role should be Owner or Admin" });
        }
        const exists = await workspace_Label.findOne({
            workspace_id: workspace._id,
            name: name,
            deleted_at: null

        });

        if (exists) {
            return res.status(400).json({ message: "Label already exists" });
        }

        await workspace_Label.create({
            workspace_id: workspace._id,
            name,
            color
        })

        res.status(201).json({ message: "The label has been successfully added." })

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error." })
    }
})

router.delete("/workspaces/:slug/labels/:labelId", auth, requireWorkspaceMember, async (req, res) => {
    try {
        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;

        if (userRole !== "Owner" && userRole !== "Admin") {
            return res.status(403).json({
                message: "Only Owner or Admin can delete labels."
            });
        }



        const label = await workspace_Label.findOne({
            _id: req.params.labelId,
            workspace_id: workspace._id,
            deleted_at: null
        });

        if (!label) {
            return res.status(400).json({ message: "Label not found." });
        }
        label.deleted_at = new Date();
        await label.save();
        res.status(200).json({ message: "The label has been successfully removed." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error." })
    }
})


module.exports = router;