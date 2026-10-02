const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CardChecklistSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    card_id: {
        type: String,
        ref: 'Card',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    deleted_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});




const Card_Checklist = mongoose.model('Card_Checklist', CardChecklistSchema);
module.exports = Card_Checklist;