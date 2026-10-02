require('dotenv').config();
const express = require('express');
const http = require("http");
const app = express();
const server = http.createServer(app);
const mongoose = require('mongoose');
const cors = require('cors');
const initDueDateReminderJob = require('./services/dueDateReminderJob');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



const { initSocket } = require("./sockets/socket");
const io = initSocket(server);
app.set("io", io);




// Connect With DataBase
// const mongoURI = `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@cluster0.jicklrk.mongodb.net/`;
// mongoose.connect(mongoURI)
//     .then(() => console.log('Database connected successfully!'))
//     .catch(err => console.error('Database connection failed:', err));



const mongoURI =
    process.env.NODE_ENV === "test"
        ? process.env.MONGO_URI_TEST
        : process.env.MONGO_URI;

if (!mongoURI) {
    throw new Error("MongoDB URI is missing");
}

const dbConnection = mongoose.connect(mongoURI)
    .then(() => {
        console.log(`Database connected successfully!`);
        console.log("Database Name:", mongoose.connection.name);
        console.log("Database Host:", mongoose.connection.host);
    })
    .catch(err => {
        console.error("Database connection failed:", err);
        throw err;
    });

app.locals.dbReady = dbConnection;

if (process.env.NODE_ENV !== 'test') {
    initDueDateReminderJob(io);
}

const userRoutes = require("./routes/userRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const workspaceLabel = require("./routes/worksapceLabelRoutes");
const invitation = require("./routes/invitationRoutes");
const project = require("./routes/projectRoutes")
const projectMember = require("./routes/porjectMemberRoutes")
const commentRoutes = require("./routes/commentRoutes");
const cardWatcher = require("./routes/cardWatcherRoutes");
const board = require("./routes/boardRoutes");
const list = require("./routes/listRoutes");
const card = require("./routes/cardRoutes")
const cardAssignment = require("./routes/cardAssignmentRoutes");
const cardLabel = require("./routes/cardLabelRoutes");
const cardAttachment = require("./routes/cardAttachmentRoutes");
const cardActivity = require("./routes/cardActivityRoutes");
const notification = require("./routes/notificationRoutes")
const cardDetail = require("./routes/cardDetailRoutes");
const cardChecklist = require("./routes/cardChecklistRoutes");
const cardChecklistItem = require("./routes/cardChecklistItemRoutes");
const search = require("./routes/searchRoutes");
const allDataBoard = require("./routes/allDataBoardRoutes");
const message = require("./routes/messageRoutes");

app.use(userRoutes);
app.use(workspaceRoutes);
app.use(workspaceLabel);
app.use(invitation);
app.use(project);
app.use(projectMember);
app.use(commentRoutes);
app.use(cardWatcher);
app.use(board);
app.use(list);
app.use(card);
app.use(cardAssignment);
app.use(cardLabel);
app.use(cardAttachment);
app.use(cardActivity);
app.use(notification);
app.use(cardDetail);
app.use(cardChecklist);
app.use(cardChecklistItem);
app.use(search);
app.use(allDataBoard);
app.use(message);



if (process.env.NODE_ENV !== 'test') {
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} `);
    });
}
module.exports = app;