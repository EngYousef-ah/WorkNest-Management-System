const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Card = require("../models/Card");
const Card_Assignment = require("../models/Card_Assignment");
const Card_Label = require("../models/Card_label");


router.get("/cards/:cardId/details", auth, async (req, res) => {
    try {
        const { cardId } = req.params;

        const card = await Card.findById(cardId);
        if (!card) return res.status(400).json({ message: "Card not found" });

        const [cardLabels, cardAssignments] = await Promise.all([
            Card_Label.find({ card_id: cardId }),
            Card_Assignment.find({ card_id: cardId }).populate("user_id", "full_name display_name avatar_url email")
        ]);

        res.status(200).json({ card, cardLabels, cardAssignments });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = router;
