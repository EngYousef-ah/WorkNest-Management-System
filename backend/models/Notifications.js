const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const NotificationsSchema = new mongoose.Schema({

    _id: {
        type: String,
        default: uuidv4
    },
    user_id: {
        type: String,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true
    },
    read: {
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


const Notifications = mongoose.model('Notifications', NotificationsSchema);
module.exports = Notifications;