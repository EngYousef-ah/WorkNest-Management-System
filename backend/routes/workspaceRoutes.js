const express = require("express");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Workspace_Member = require("../models/Workspace_Members");
const Workspace_Invites = require("../models/Workspace_Invites");
const router = express.Router();
const jwt = require("jsonwebtoken");
const multer = require('multer');

const nodemailer = require("nodemailer");
const slugify = require('slugify');
const auth = require("../middleware/auth");
const { supabase } = require("../config/supabase");
const mongoose = require('mongoose');
const validate = require("../middleware/validate");
const requireWorkspaceMember = require("../middleware/requireWorkspaceMember");

const { createWorkspaceSchema, updateWorkspaceSchema, inviteMemberSchema } = require("../validators/workspaceValidators");


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/zip',
        ]; if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported!'));
        }
    }
});



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    }
});




router.post('/workspaces/create', auth, validate(createWorkspaceSchema), async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name } = req.body;
        const userId = req.user.userId;

        const existingWorkspace = await Workspace.findOne({ name }).session(session);

        if (existingWorkspace) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Workspace name is already exists" });
        }
        const slugEn = slugify(name, {
            lower: true,
            strict: true,
            trim: true
        });

        const newWorkspace = new Workspace({
            owner_id: userId,
            slug: slugEn,
            name
        });

        await newWorkspace.save({ session });


        await Workspace_Member.create([{
            workspace_id: newWorkspace.id,
            user_id: userId,
            role: "Owner"
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({
            message: "workspace created successfully.",
            workspace: newWorkspace
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});


router.patch('/workspaces/:slug/edit', auth, requireWorkspaceMember, upload.single("logo"), validate(updateWorkspaceSchema), async (req, res) => {
    let uploadedLogoPath = null;
    try {
        const { name, description } = req.body;

        const workspace = await Workspace.findOne({
            slug: req.params.slug,
        });

        if (!workspace) {
            return res.status(400).json({ message: "Workspace not found", });
        }

        const updateData = {};

        if (name) updateData.name = name;
        if (description) updateData.description = description;

        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            uploadedLogoPath = fileName;
            const { data, error } = await supabase.storage
                .from("workspaces")
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                });

            if (error) {
                return res.status(500).json({
                    message: error.message,
                });
            }

            const { data: publicUrlData } = supabase.storage
                .from("workspaces")
                .getPublicUrl(data.path);

            updateData.logo_url = publicUrlData.publicUrl;
        }

        const updatedWorkspace = await Workspace.findOneAndUpdate(
            { slug: req.params.slug },
            updateData,
            { new: true }
        );


        if (!updatedWorkspace) {
            if (!updatedWorkspace) {
                if (uploadedLogoPath) {
                    await supabase.storage.from("workspaces").remove([uploadedLogoPath]);
                }
                return res.status(400).json({ message: "Workspace not found" });
            }
        }

        res.status(200).json({
            message: "Workspace updated successfully",
            workspace: updatedWorkspace
        });
    }
    catch (error) {
        console.error("Error occurred:", error);

        if (uploadedLogoPath) {
            try {
                await supabase.storage.from("workspaces").remove([uploadedLogoPath]);
            } catch (cleanupError) {
                console.error("Failed to cleanup new logo:", cleanupError);
            }
        }

        return res.status(500).json({ message: "Internal server error." });
    }
})


router.get('/workspaces/:slug', auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { slug } = req.params

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) {
            return res.status(400).json({ message: "Workspace not found" });
        }
        res.status(200).json(workspace);
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
})

router.get("/workspaces/:slug/userId", auth, async (req, res) => {
    try {
        const { slug } = req.params;
        const workspace = await Workspace.findOne({ slug });

        if (!workspace) return res.status(400).json({ message: "Workspace not found" });

        const roleMember = await Workspace_Member.findOne({
            _id: workspace._id,
            user_id: req.user.userId
        })

        if (!roleMember) return res.status(400).json({ message: "You are not a member in this workspace" })

        res.status(200).json(roleMember)
    }
    catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });

    }
})


router.get('/workspaces/:slug/members', auth, requireWorkspaceMember, async (req, res) => {
    try {
        const workspace = await Workspace.findOne({
            slug: req.params.slug
        });
        if (!workspace) {
            return res.status(400).json({ message: "Workspace not found" });
        }
        const members = await Workspace_Member.find({
            workspace_id: workspace._id,
            deleted_at: null
        }).populate('user_id', "full_name avatar_url");

        res.status(200).json(members);


    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
})



router.get('/workspaces/WorkspaceMember/:userId', auth, async (req, res) => {
    try {
        const workspaces = await Workspace_Member.find({
            user_id: req.params.userId,
            deleted_at: null
        }).populate("workspace_id")


        return res.status(200).json(workspaces)

    }
    catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
})


router.patch('/workspaces/:slug/members/:userId/promote', auth, async (req, res) => {
    try {
        const { slug } = req.params;

        const workspace = await Workspace.findOne({ slug });
        if (!workspace) {
            return res.status(400).json({ message: "Workspace not found" });
        }

        const callerMembership = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: req.user.userId
        });
        if (!callerMembership || !["Owner", "Admin"].includes(callerMembership.role)) {
            return res.status(403).json({ message: "Only Owners and Admins can promote members." });
        }

        const member = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: req.params.userId
        });

        if (!member) {
            return res.status(400).json({ message: "Member not found." });
        }

        if (member.role === "Owner") {
            return res.status(400).json({
                message: "Owner cannot be promoted."
            });
        }

        if (member.role === "Admin") {
            return res.status(400).json({
                message: "User is already an admin."
            });
        }

        member.role = "Admin";

        await member.save();

        return res.status(200).json({
            message: "Member promoted successfully.",
            member
        });

    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});


router.patch('/workspaces/:slug/members/:userId/demote', auth, async (req, res) => {
    try {
        const { slug } = req.params;

        const workspace = await Workspace.findOne({ slug });

        if (!workspace) {
            return res.status(400).json({ message: "Workspace not found" });
        }
        const callerMembership = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: req.user.userId
        });

        if (!callerMembership || !["Owner", "Admin"].includes(callerMembership.role)) {
            return res.status(403).json({ message: "Only Owners and Admins can demote members." });
        }

        const member = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: req.params.userId
        });

        if (!member) {
            return res.status(400).json({ message: "Member not found." });
        }

        if (member.role === "Owner") {
            return res.status(400).json({ message: "Owner cannot be demoted." });
        }

        if (member.role === "Member") {
            return res.status(400).json({ message: "User is already a Member." });
        }

        member.role = "Member";

        await member.save();

        return res.status(200).json({
            message: "Admin demoted successfully.",
            member
        });

    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});



router.delete('/workspaces/:slug/members/:userId/remove', auth, requireWorkspaceMember, async (req, res) => {
    try {
        const { userId } = req.params;

        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;

        if (userRole !== "Owner" && userRole !== "Admin") {
            return res.status(403).json({
                message: "You don't have permission to remove members."
            });
        }


        const member = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: userId
        });

        if (!member) return res.status(400).json({ message: "Member not found." });


        if (member.role === "Owner") return res.status(400).json({ message: "Owner cannot be removed." });

        const removedMember = await Workspace_Member.findOne({
            workspace_id: workspace._id,
            user_id: userId
        });
        removedMember.deleted_at = new Date();
        await removedMember.save();


        return res.status(200).json({ message: "Member removed successfully." });

    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});



router.post('/workspaces/:slug/invitations', auth, requireWorkspaceMember, validate(inviteMemberSchema), async (req, res) => {
    try {
        const { email, role } = req.body;
        const workspace = req.workspace;
        const userRole = req.workspaceMember.role;

        if (userRole !== "Owner" && userRole !== "Admin") {
            return res.status(403).json({
                message: "You don't have permission to invite users."
            });
        }

        const allowedRoles = ["Member", "Admin"];
        const requestedRole = role || "Member";

        if (!allowedRoles.includes(requestedRole)) {
            return res.status(400).json({ message: "Invalid role specified." });
        }

        if (userRole === "Admin" && requestedRole !== "Member") {
            return res.status(403).json({
                message: "Admins can only invite users with the 'Member' role."
            });
        }

        if (requestedRole === "Owner") {
            return res.status(403).json({
                message: "Cannot invite users with the 'Owner' role."
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (user) {

            const existingMember = await Workspace_Member.findOne({
                workspace_id: workspace._id,
                user_id: user._id,
                deleted_at:null
            });

            if (existingMember) {
                return res.status(400).json({
                    message: "User is already a member of this workspace"
                });
            }

        }


        const existingInvite = await Workspace_Invites.findOne({
            workspace_id: workspace._id,
            email: email.toLowerCase(),
            status: "pending"
        });

        if (existingInvite) {
            return res.status(400).json({
                message: "Invitation already exists"
            });
        }
        const normalizedEmail = email.trim().toLowerCase();

        const token = jwt.sign(
            {
                workspaceId: workspace._id,
                email: normalizedEmail
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "24h"
            }
        );
        const inviteRole = requestedRole;
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await Workspace_Invites.create({
            workspace_id: workspace._id,
            email: normalizedEmail,
            role: inviteRole,
            token,
            expires_at: expiresAt,
            invited_by: req.user.userId
        });
        const inviteLink = `http://localhost:5173/invitations/${token}`;



        await transporter.sendMail({

            from: process.env.EMAIL,

            to: normalizedEmail,

            subject: `Invitation to join ${workspace.name}`,

            html: `
                <h2>Hello!</h2>
                <p>You have been invited to join the workspace:</p>
                <h3>${workspace.name}</h3>
                <p>Your role will be: <strong>${inviteRole}</strong></p>
                <p>Click the button below to accept the invitation:</p>
                <a href="${inviteLink}">Accept Invitation</a>
                <p>This invitation expires in 24 hours.</p>
            `
        });

        return res.status(201).json({ message: "Invitation sent successfully." });

    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).json({ message: "Internal server error." });

    }
})

module.exports = router;