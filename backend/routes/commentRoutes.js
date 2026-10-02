const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const cheerio = require('cheerio');

const User = require("../models/User");
const Activity_Log = require("../models/Activity_logs");
const Comment = require("../models/Comment");
const Notifications = require("../models/Notifications");

const { getIo } = require("../sockets/socket");
const requireCardAccess = require("../middleware/requireCardAccess");
const createCommentSchema = require("../validators/commentValidators");
const validate = require("../middleware/validate");
router.post("/cards/:cardId/comments", auth,validate(createCommentSchema),requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const { content, parentId } = req.body;

  
        let finalParentId = null;
        let parentCommentAuthorId = null;

        if (parentId) {
            try {
                const parent = await Comment.findById(parentId);
                if (!parent) {
                    return res.status(404).json({ message: "Parent comment not found." });
                }
                finalParentId = parent.parentId ? parent.parentId : parent._id;
                parentCommentAuthorId = parent.authorId ? parent.authorId.toString() : null;
            } catch {
                return res.status(400).json({ message: "Invalid parent comment ID." });
            }
        }

        const $ = cheerio.load(content);
        const extractedMentions = [];

        $('span[data-type="mention"]').each((i, el) => {
            const id = $(el).attr('data-id');
            if (id) extractedMentions.push(id);
        });

        $('span[data-type="mention"]').remove();
        let cleanContent = $.text().replace(/\s+/g, ' ').trim();

        let recipients = [...extractedMentions];
        if (parentCommentAuthorId) {
            recipients.push(parentCommentAuthorId);
        }

        const uniqueRecipients = [...new Set(recipients)]
            .filter(id => id.toString() !== req.user.userId.toString());

        const newComment = await Comment.create({
            card_id: cardId,
            authorId: req.user.userId,
            content,
            parentId: finalParentId,
            mentions: [...new Set(extractedMentions)],
        });

        const populatedComment = await Comment.findById(newComment._id)
            .populate('authorId', 'display_name avatar_url full_name')
            .populate('parentId');

        await Activity_Log.create({
            card_id: cardId,
            user_id: req.user.userId,
            action: `Added a comment`
        });

        if (uniqueRecipients.length > 0) {
            const currentUser = await User.findById(req.user.userId);
            const senderName = currentUser?.full_name || currentUser?.display_name || "Someone";

            await Promise.all(uniqueRecipients.map(async (recipientId) => {
                const isCommentOwner = recipientId === parentCommentAuthorId;
                const notificationContent = isCommentOwner
                    ? `You were replied to by ${senderName}.`
                    : `You were mentioned in a comment by ${senderName}: "${cleanContent.substring(0, 50)}..."`;

                const newNotification = await Notifications.create({
                    user_id: recipientId,
                    content: notificationContent
                });

                try {
                    const io = getIo();
                    io.to(recipientId.toString()).emit("new-notification", newNotification);
                } catch (socketErr) {
                    console.error("Socket emission error:", socketErr);
                }
            }));
        }

        try {
            const io = getIo();
            io.to(`card_${cardId}`).emit("new-comment", populatedComment);
        } catch (socketErr) {
            console.error("Socket emission error:", socketErr);
        }

        return res.status(201).json(populatedComment);
    } catch (err) {
        console.error("Error creating comment:", err);
        return res.status(500).json({ message: "Internal Server Error." });
    }
});


router.put('/cards/:cardId/comments/:id', auth,requireCardAccess, async (req, res) => {
    try {
        const { content } = req.body;
        const { cardId } = req.params;
        if (!content) return res.status(400).json({ message: "Content is required." })
        const comment = await Comment.findById(req.params.id);

        if (comment.authorId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'not allowed' });
        }
        await Activity_Log.create({
            card_id: cardId,
            user_id: req.user.userId,
            action: `Edited the comment from: ${comment.content} to: ${content} `
        });

        comment.content = content;
        comment.isEdited = true;
        await comment.save();

        res.status(200).json(comment);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
});

router.get('/cards/:cardId/comments', auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;

        const allComments = await Comment.find({ card_id: cardId })
            .populate('authorId', 'display_name avatar_url')
            .sort({ created_at: 1 });

        const mainComments = allComments.filter((c) => c.parentId === null);
        const replies = allComments.filter((c) => c.parentId !== null);
        const result = mainComments.map((main) => ({
            ...main.toObject(),
            replies: replies.filter((r) => r.parentId.toString() === main._id.toString()),
        }));

        res.status(200).json(result);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })

    }
});

module.exports = router;