const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workspaceMemberSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    user_id: {
        type: String,
        ref: 'User',
        required: true
    },
    workspace_id: {
        type: String,
        ref: 'Workspace',
        required: true
    },
    role: {
        type: String,
        enum: ['Owner', 'Admin', 'Member'],
        default: 'Owner'
    },
    joined_at: {
        type: Date,
        default: null
    },
    invited_by: {
        type: String,
        default: "No body"
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

// workspaceMemberSchema.pre(/^find/, function () {
//     this.where({ deleted_at: null });
// });
workspaceMemberSchema.index({ workspace_id: 1, user_id: 1 }, { unique: true,partialFilterExpression: { deleted_at: null } });

const Workspace_Member = mongoose.model('Workspace_Member', workspaceMemberSchema);
module.exports = Workspace_Member;