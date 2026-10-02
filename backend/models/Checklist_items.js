const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ChecklistItemSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    card_id: {
        type: String,
        ref: 'Card',
        required: true
    },
    checklist_id: {
        type: String,
        ref: 'Card_Checklist',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    is_completed: {
        type: Boolean,
        default: false,
    },
    position: {
        type: Number,
        default: 0,
    },
    assigned_to: {
        type: String,
        ref: 'User',
        default: null
    },
    due_date: {
        type: Date,
        default: null
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



const Checklist_Item = mongoose.model('Checklist_Item', ChecklistItemSchema);
module.exports = Checklist_Item;