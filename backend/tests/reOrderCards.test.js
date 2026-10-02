const request = require('supertest');
const app = require('../server');
const Card = require("../models/Card");
const List = require("../models/List");
const Board = require("../models/Board");
const Project = require("../models/Project");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Workspace_Member = require("../models/Workspace_Members");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const generateToken = (userId, email) => {
    return jwt.sign({ userId: userId, email: email }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
};

beforeAll(async () => {
    await app.locals.dbReady;
}, 30000);

beforeEach(async () => {
    if (mongoose.connection.readyState === 1) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
}, 60000);

it('should move cards and preserve the correct order and new list positions', async () => {
    const user = await User.create({
        full_name: 'Card Mover',
        email: `mover_${Date.now()}@example.com`,
        password_hash: 'hashedpassword'
    });
    const token = generateToken(user._id, user.email);

    const slug = `test-slug-${Date.now()}`;

    const workspace = await Workspace.create({
        name: 'Test Workspace',
        slug: slug,
        owner_id: user._id
    });

    await Workspace_Member.create({
        workspace_id: workspace._id,
        user_id: user._id,
        role: 'Owner'
    });

    const project = await Project.create({
        name: 'Test Project',
        workspace_id: workspace._id,
        user_id: user._id
    });

    const board = await Board.create({
        name: 'Test Board',
        background:"#fff",
        project_id: project._id,
        workspace_id: workspace._id,
        user_id: user._id
    });

    const listA = await List.create({
        name: 'List A',
        position:1,
        board_id: board._id,
        project_id: project._id,
        workspace_id: workspace._id,
        user_id: user._id
    });

    const listB = await List.create({
        name: 'List B',
        position:2,
        board_id: board._id,
        project_id: project._id,
        workspace_id: workspace._id,
        user_id: user._id
    });

    const card1 = await Card.create({
        title: 'Card One',
        description: 'First card',
        workspace_id: workspace._id,
        project_id: project._id,
        board_id: board._id,
        list_id: listA._id,
        position: 1
    });

    const card2 = await Card.create({
        title: 'Card Two',
        description: 'Second card',
        workspace_id: workspace._id,
        project_id: project._id,
        board_id: board._id,
        list_id: listA._id,
        position: 2
    });

    const updatedCards = [
        { _id: card2._id.toString(), list_id: listB._id.toString(), position: 1 },
        { _id: card1._id.toString(), list_id: listB._id.toString(), position: 2 }
    ];

    const res = await request(app)
        .put(`/workspaces/${slug}/projects/${project._id}/boards/${board._id}/cards/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ updatedCards });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Cards reordered successfully.');

    const updatedCard1 = await Card.findById(card1._id);
    const updatedCard2 = await Card.findById(card2._id);

    expect(updatedCard2.list_id.toString()).toEqual(listB._id.toString());
    expect(updatedCard2.position).toEqual(1);

    expect(updatedCard1.list_id.toString()).toEqual(listB._id.toString());
    expect(updatedCard1.position).toEqual(2);

}, 30000);

