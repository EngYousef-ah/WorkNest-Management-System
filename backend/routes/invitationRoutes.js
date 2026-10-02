const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Workspace_Invites = require("../models/Workspace_Invites");
const Workspace_Member = require("../models/Workspace_Members");
const { mongoose } = require("mongoose");



router.get("/invitations/:token", async (req, res) => {
    try {

        const { token } = req.params;

        const invitation = await Workspace_Invites.findOne({ token });


        if (!invitation) {
            return res.status(400).json({ message: "Invitation not found" });
        }

        if (invitation.status === "accepted") {
            return res.status(400).json({ message: "Invitation already accepted" });
        }

        if (new Date(invitation.expires_at) < new Date()) {
            return res.status(400).json({ message: "Invitation has expired." });
        }



        return res.status(200).json({
            message: "Valid invitation",
            invitation
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});


router.post("/invitations/:token/accept", auth, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { token } = req.params;
        const invitation = await Workspace_Invites.findOne({ token }).session(session);


        if (!invitation) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Invitation not found" });
        }

        if (invitation.status !== "pending") {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Invitation already used or expired" });

        }

        if (invitation.expires_at && invitation.expires_at < new Date()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Invitation expired" });
        }


        if (req.user.email !== invitation.email) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({
                message: "This invitation is not for your account."
            });
        }

        const newUser = await User.findOne({ email: invitation.email }).session(session);

        if (!newUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "You must register or log in with this email before accepting the invitation." });
        }

        if (req.user.email !== invitation.email) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: "This invitation is not for your account." });
        }


        if (req.user.userId !== newUser._id.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: "This invitation is not for your account." });
        }

        const existingActiveMember = await Workspace_Member.findOne({
            workspace_id: invitation.workspace_id,
            user_id: newUser._id,
            deleted_at: null
        }).session(session);

        if (existingActiveMember) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Already a member." });
        }

        await Workspace_Member.findOneAndUpdate(
            {
                workspace_id: invitation.workspace_id,
                user_id: newUser._id
            },
            {
                role: invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1),
                invited_by: invitation.invited_by,
                joined_at: new Date(),
                deleted_at: null 
            },
            {
                upsert: true,
                returnDocument: 'after',
                session
            }
        );

      invitation.status = "accepted";
        await invitation.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: "The invitation has been successfully accepted, and you have been added to the workspace." });
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
})


module.exports = router;