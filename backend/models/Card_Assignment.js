const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CardAssignmentSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    card_id: {
        type: String,
        ref: 'Card',
        required: true
    },
    user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    assignment_at: {
        type: Date,
        default: Date.now
    },
    reminder_sent: {
        type: Boolean,
        default: false
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

CardAssignmentSchema.index({ card_id: 1, user_id: 1 }, { unique: true });


const Card_Assignment = mongoose.model('Card_Assignment', CardAssignmentSchema);
module.exports = Card_Assignment;