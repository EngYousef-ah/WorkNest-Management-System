const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Workspace_Member = require('../models/Workspace_Members')
const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
};

beforeAll(async () => {
    await app.locals.dbReady;
}, 30000);

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
}, 30000);


describe('POST /workspaces - Workspace Creation & Owner Membership', () => {
    it('should create a workspace and automatically create exactly one Owner membership', async () => {
        const user = await User.create({
            full_name: 'Test User',
            email: 'test@example.com',
            password_hash: 'hashedpassword'
        });

        const token = generateToken(user._id);

        const res = await request(app)
            .post('/workspaces/create')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'My Test Workspace'
            });
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('workspace');
        const workspaceId = res.body.workspace._id;

        const workspaceCount = await Workspace.countDocuments({ _id: workspaceId });
        expect(workspaceCount).toEqual(1);

        const members = await Workspace_Member.find({ workspace_id: workspaceId });
        expect(members.length).toEqual(1);
        expect(members[0].user_id.toString()).toEqual(user._id.toString());
        expect(members[0].role).toEqual('Owner');
    }, 30000);
});

