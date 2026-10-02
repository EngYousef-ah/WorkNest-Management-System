const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ActivityLogSchema = new mongoose.Schema({

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
    action: {
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




const Activity_Log = mongoose.model('Activity_Log', ActivityLogSchema);
module.exports = Activity_Log;