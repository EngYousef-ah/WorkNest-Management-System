const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const CardLabelSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    card_id: {
        type: String,
        ref: 'Card',
        required: true
    },
    card_label: {
        type: String,
        ref: 'Workspace_Label',
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


CardLabelSchema.pre(/^find/, function () {
    this.where({ deleted_at: null });
});

CardLabelSchema.index(
    { card_id: 1, card_label: 1 },
    { unique: true, partialFilterExpression: { deleted_at: null } }
);
const Card_Label = mongoose.model('Card_Label', CardLabelSchema);
module.exports = Card_Label;