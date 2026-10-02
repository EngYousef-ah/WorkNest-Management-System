const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Workspace_Invites = require('../models/Workspace_Invites')
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');



const generateToken = (userId, email) => {
    return jwt.sign({ userId: userId, email: email }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

it('should allow an invitation to be accepted only once, and fail on the second attempt', async () => {
    const owner = await User.create({
        full_name: 'Workspace Owner',
        email: `owner_${Date.now()}@example.com`,
        password_hash: 'hashedpassword'
    });

    const invitee = await User.create({
        full_name: 'Invited User',
        email: `invitee_${Date.now()}@example.com`,
        password_hash: 'hashedpassword'
    });

    const workspace = await Workspace.create({
        name: 'Test Workspace',
        owner_id: owner._id,
        slug: `test-workspace-${Date.now()}`
    });

    const testToken = `my-unique-secret-token-${Date.now()}`;

    const invitation = await Workspace_Invites.create({
        workspace_id: workspace._id,
        email: invitee.email,
        role: 'Member',
        invited_by: owner._id,
        token: testToken,
        status: 'pending'
    });

    const inviteeToken = generateToken(invitee._id, invitee.email);
    const firstAttempt = await request(app)
        .post(`/invitations/${testToken}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`);

    expect(firstAttempt.statusCode).toEqual(201); 

    const secondAttempt = await request(app)
        .post(`/invitations/${testToken}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`);

    expect(secondAttempt.statusCode).toEqual(400);
    expect(secondAttempt.body.message).toEqual("Invitation already used or expired");
}, 30000);

afterAll(async () => {
    await mongoose.connection.close();
});