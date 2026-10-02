const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Card_Watcher = require("../models/Card_Watchers");
const requireCardAccess = require("../middleware/requireCardAccess");


router.post("/cards/:cardId/watch", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;

        const cardWatcher = await Card_Watcher.findOne({
            card_id: cardId,
            user_id: req.user.userId
        })

        if (cardWatcher) {
            await Card_Watcher.deleteOne({ _id: cardWatcher._id });
            return res.status(200).json({ message: "You have un-watched this card." });
        }
        else {
            await Card_Watcher.create({
                card_id: cardId,
                user_id: req.user.userId,
                isWatch: true
            });
        }
        return res.status(201).json({ message: "You are now watching this card." });
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({
                message: "This element already exists and cannot be duplicated."
            });
        }
        res.status(500).json({ message: "Internal Server Error." })
    }
})


router.get("/cards/:cardId/watchers", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const cardWatchers = await Card_Watcher.find({ card_id: cardId }).populate('user_id');
        return res.status(200).json(cardWatchers)
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})

module.exports = router;
