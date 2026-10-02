const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Activity_Log = require("../models/Activity_logs");
const Notifications = require("../models/Notifications");
const { getIo } = require("../sockets/socket");
const Card_Attachment = require("../models/Card_Attachments");
const { supabase } = require("../config/supabase");
const Card_Watcher = require("../models/Card_Watchers");
const multer = require('multer');
const requireCardAccess = require("../middleware/requireCardAccess");

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

router.get('/cards/:cardId/attachments', auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;

        const attachments = await Card_Attachment.find({
            cardId,
            deleted_at: null

        }).populate('uploaderId');

        res.status(200).json({ attachments });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

router.post('/cards/:cardId/attachments', auth,requireCardAccess, upload.array('files', 5), async (req, res) => {
    const uploadedStoragePaths = [];
    try {
        const { cardId } = req.params;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'Please select at least one file' });
        }

        

        const uploadedAttachments = [];
        const user = await User.findOne({ _id: req.user.userId })
        const cardWatchers = await Card_Watcher.find({ card_id: cardId }).populate('user_id')
        const currentUserId = req.user.userId.toString();

        for (const file of files) {
            const storagePath = `cards/${cardId}/${Date.now()}_${file.originalname}`;

            const { data, error } = await supabase.storage
                .from('attachments')
                .upload(storagePath, file.buffer, { contentType: file.mimetype });

            if (error) throw error;
            uploadedStoragePaths.push(storagePath);
            const { data: urlData } = supabase.storage
                .from('attachments')
                .getPublicUrl(storagePath);

            uploadedAttachments.push({
                cardId: cardId,
                uploaderId: req.user.userId,
                fileName: file.originalname,
                fileUrl: urlData.publicUrl,
                storagePath: storagePath,
                fileType: file.mimetype,
                fileSize: file.size
            });

            await Activity_Log.create({
                card_id: cardId,
                user_id: req.user.userId,
                action: `File added: ${file.originalname}`
            });

            for (const watcher of cardWatchers) {
                const watcherId = watcher.user_id._id.toString();

                if (watcherId !== currentUserId) {
                    const newNotification = await Notifications.create({
                        user_id: watcherId,
                        content: `File "${file.originalname}" added successfully by ${user.full_name}.`
                    });
                    const io = getIo();

                    io.to(watcherId).emit("new-notification", newNotification);
                }
            }
        }

        const savedAttachments = await Card_Attachment.insertMany(uploadedAttachments);

        res.status(201).json({ savedAttachments });

    } catch (error) {
        console.error("Error occurred during attachment upload:", error);

        if (uploadedStoragePaths.length > 0) {
            try {
                await supabase.storage
                    .from('attachments')
                    .remove(uploadedStoragePaths);
                console.log("Cleanup successful: Orphaned files removed from Supabase storage.");
            } catch (cleanupError) {
                console.error("Failed to clean up files from Supabase:", cleanupError);
            }
        } res.status(500).json({ message: "Internal Server Error." });
    }
});

router.delete('/cards/:cardId/attachments/:attachmentId', auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId, attachmentId } = req.params;

        const attachment = await Card_Attachment.findOne({
            _id: attachmentId,
            cardId,
            deleted_at: null
        });
        if (!attachment) {
            return res.status(400).json({ message: "Attachment not found" });
        }

        attachment.deleted_at = new Date();
        await attachment.save();


        res.status(200).json({ message: "Attachment deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error." });
    }
});

module.exports = router;
