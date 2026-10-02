const request = require('supertest');
const app = require('../server');
const Card = require("../models/Card");
const Card_Assignment = require("../models/Card_Assignment");
const Card_Label = require("../models/Card_label");
const User = require("../models/User");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const generateToken = (userId) => {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
};


it('should return card details along with its labels and assignments', async () => {
    const user = await User.create({
        full_name: 'Test User',
        email: 'cardtest@example.com',
        password_hash: 'hashedpassword'
    });
    const token = generateToken(user._id);

    const card = await Card.create({
        title: 'Test Card for Details',
        description: 'Testing card details route',
        workspace_id: 'mock-workspace-id', 
        project_id: 'mock-project-id',
        board_id: 'mock-board-id',
        list_id: 'mock-list-id',
        position: 1
    });

    const cardLabel = await Card_Label.create({
        card_id: card._id,
        card_label: 'some-workspace-label-id'
    });

    const cardAssignment = await Card_Assignment.create({
        card_id: card._id,
        user_id: user._id
    });

    const res = await request(app)
        .get(`/cards/${card._id}/details`)
        .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);

    expect(res.body).toHaveProperty('card');
    expect(res.body.card._id.toString()).toEqual(card._id.toString());

    expect(res.body).toHaveProperty('cardLabels');
    expect(Array.isArray(res.body.cardLabels)).toBe(true);
    expect(res.body.cardLabels.length).toEqual(1);
    expect(res.body.cardLabels[0]._id.toString()).toEqual(cardLabel._id.toString());

    expect(res.body).toHaveProperty('cardAssignments');
    expect(Array.isArray(res.body.cardAssignments)).toBe(true);
    expect(res.body.cardAssignments.length).toEqual(1);
    expect(res.body.cardAssignments[0]._id.toString()).toEqual(cardAssignment._id.toString());

    expect(res.body.cardAssignments[0].user_id).toHaveProperty('full_name', 'Test User');

}, 30000);

afterAll(async () => {
    await mongoose.connection.close();
});