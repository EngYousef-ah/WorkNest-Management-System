const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const workspaceInvitesSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    workspace_id: {
        type: String,
        ref: 'Workspace',
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        enum: ["Owner", "Admin", "Member"],
        default: "member"
    }
    ,
    token: {
        type: String,
        required: true,
        unique: true
    },
    invited_by: {
        type: String,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "expired", "revoked"],
        default: "pending"
    },
    expires_at: {
        type: Date,
        default:null
    },
    deleted_at: {
        type: Date,
        default: null
    },

}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

workspaceInvitesSchema.pre(/^find/, function () {
    this.where({ deleted_at: null });
});

const Workspace_Invites = mongoose.model('Workspace_Invites', workspaceInvitesSchema);
module.exports = Workspace_Invites;