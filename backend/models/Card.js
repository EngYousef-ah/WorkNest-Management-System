const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CardSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    workspace_id: {
        type: String,
        ref: 'Workspace',
        required: true
    },
    project_id: {
        type: String,
        ref: 'Project',
        required: true
    },
    board_id: {
        type: String,
        ref: 'Board',
        required: true
    },
    list_id: {
        type: String,
        ref: 'List',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    position: {
        type: Number,
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Low'
    },
    due_date: {
        type: Date,
        default: null
    },
    is_due_notification_sent: {
        type: Boolean,
        default: false
    },
    created_by: {
        type: String,
        ref: 'User'
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





CardSchema.index({ title: 'text', description: 'text' });

const Card = mongoose.model('Card', CardSchema);
module.exports = Card;