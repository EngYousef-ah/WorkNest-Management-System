const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Card_Checklist = require("../models/Card_checklists");
const requireCardAccess = require("../middleware/requireCardAccess");


// Get All Checklist Card
router.get("/cards/:cardId/checklists", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const checklist = await Card_Checklist.find({ card_id: cardId });
        res.status(200).json(checklist);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})


// Add New Checklist Card
router.post("/cards/:cardId/checklists", auth,requireCardAccess, async (req, res) => {
    try {
        const { cardId } = req.params;
        const { title } = req.body;

        if (!title) return res.status(400).json({ message: "Title is required." })

        const checklist = await Card_Checklist.create({ card_id: cardId, title });
        res.status(201).json(checklist);
    }
    catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ message: "Internal Server Error." })
    }
})


module.exports = router;
