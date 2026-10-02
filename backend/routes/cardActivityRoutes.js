const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Activity_Log = require("../models/Activity_logs");
const requireCardAccess = require("../middleware/requireCardAccess");



router.get("/cards/:cardId/activities", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 3;
        const skip = (page - 1) * limit;

        const activities = await Activity_Log.find({
            card_id: cardId
        })
            .populate("user_id", "full_name display_name avatar_url email")
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(limit);

        const totalActivities = await Activity_Log.countDocuments({
            card_id: cardId
        });

        const totalPages = Math.ceil(
            totalActivities / limit
        );

        res.status(200).json({
            activities,
            pagination: {
                currentPage: page,
                totalPages,
                totalActivities,
                limit
            }
        });
    }
    catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error." })
    }
})


module.exports = router;
