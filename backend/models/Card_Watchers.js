const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CardWatcherchema = new mongoose.Schema({

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
    isWatch: {
        type: Boolean,
        default: false
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


CardWatcherchema.index({ card_id: 1, user_id: 1 }, { unique: true });

const Card_Watcher = mongoose.model('Card_Watcher', CardWatcherchema);
module.exports = Card_Watcher;