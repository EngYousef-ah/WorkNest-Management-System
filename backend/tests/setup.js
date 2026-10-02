const mongoose = require("mongoose");

beforeAll(async () => {
    await mongoose.connection.asPromise();
}, 30000);

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
    }
}, 30000);