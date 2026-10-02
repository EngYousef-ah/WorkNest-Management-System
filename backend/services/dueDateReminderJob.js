const cron = require("node-cron");
const Card = require("../models/Card"); 
const Card_Assignment = require("../models/Card_Assignment");
const Card_Watcher = require("../models/Card_Watchers");
const Notifications = require("../models/Notifications");

function initDueDateReminderJob(io) {
    cron.schedule("*/15 * * * *", async () => {
        console.log("Cron job started running...");
        try {
            const now = new Date();
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const cardsDueSoon = await Card.find({
                due_date: {
                    $gte: startOfToday,$lte: in24Hours
                },
                deleted_at: null,
                is_due_notification_sent: { $ne: true }
            });
            console.log(`Found ${cardsDueSoon.length} cards due soon.`);

            if (cardsDueSoon.length === 0) return;

            for (const card of cardsDueSoon) {
                const cardId = card._id;

                const assignees = await Card_Assignment.find({ card_id: cardId }).populate("user_id");
                const assigneeUserIds = assignees.map(a => a.user_id._id || a.user_id);

                const watchers = await Card_Watcher.find({
                    card_id: cardId,
                    user_id: { $nin: assigneeUserIds }
                }).populate("user_id");

                const recipients = [...assignees, ...watchers];

                let notificationSent = false;

                for (const recipient of recipients) {
                    const user = recipient.user_id;
                    if (user && user.email) {
                        const userId = user._id;
                        const newNotification = await Notifications.create({
                            user_id: userId,
                            content: `Reminder: The card "${card.title}" is due soon.`
                        });
                        
                        if (io) {
                            io.to(userId.toString()).emit("new-notification", newNotification);
                        }
                        
                        notificationSent = true;
                    }
                }

                if (notificationSent) {
                    await Card.updateOne(
                        { _id: card._id },
                        { $set: { is_due_notification_sent: true } }
                    );
                    console.log(`Reminder sent and card updated for: ${card.title}`);
                }
            }

            console.log("Due date reminders job completed successfully.");
        } catch (err) {
            console.error("Error in due date reminders background job:", err);
        }
    });
}

module.exports = initDueDateReminderJob;