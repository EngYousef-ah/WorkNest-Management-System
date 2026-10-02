const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Board = require("../models/Board");
const project_Member = require("../models/Project_Member");
const User = require("../models/User");
const Card = require("../models/Card");
const Worksapce = require("../models/Workspace");
const { _includes } = require("zod/v4/core");
const Workspace = require("../models/Workspace");

async function updateActiveUsers(boardId) {
    const roomName = `board:${boardId}`;
    const sockets = await io.in(roomName).fetchSockets();

    const activeUsers = sockets
        .map((s) => s.data.user)
        .filter(Boolean);

    const unique = Object.values(
        activeUsers.reduce((acc, u) => {
            acc[u.id] = u;
            return acc;
        }, {})
    );

    io.to(roomName).emit("presence_update", unique);
}
let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        },
    });

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.token;
            if (!token) {
                console.log("Socket Auth Error: Token missing from client");
                return next(new Error("Authentication error: Token missing"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.data.userId = decoded.userId;
            socket.data.email = decoded.email;

            next();
        } catch (error) {
            console.log("Socket Auth Error: Invalid Token", error.message);
            next(new Error("Authentication error: Invalid Token"));
        }
    });

    io.on("connection", (socket) => {

        socket.on("joinBoard", async (data) => {
            try {
                const { boardId } = data || {};
                const userId = socket.data.userId;

                if (!boardId) {
                    return socket.emit("error", { message: "Board id is missing" });
                }

                if (!userId) {
                    return socket.emit("error", { message: "Unauthorized" });
                }

                const user = await User.findById(userId);
                if (!user) {
                    return socket.emit("error", { message: "User not found." });
                }

                const board = await Board.findOne({
                    _id: boardId,
                    deleted_at: null
                });

                if (!board) {
                    return socket.emit("error", { message: "Board not found." });
                }

                const workspace = await Worksapce.findOne({
                    _id: board.workspace_id
                })
                
                if (!workspace) {
                    return socket.emit("error", { message: "Workspace not found." });
                }

                // const isMember = await project_Member.findOne({
                //     user_id: userId,
                //     project_id: board.project_id
                // });

                // if (!isMember) {
                //     return socket.emit("error", { message: "You do not have permission to access this board." });
                // }

                const roomName = `board:${boardId}`;

                if (socket.data.boardId && socket.data.boardId !== boardId) {
                    const oldRoom = `board:${socket.data.boardId}`;
                    socket.leave(oldRoom);
                    await updateActiveUsers(socket.data.boardId);
                }

                await socket.join(roomName);

                socket.data.user = {
                    id: user._id,
                    name: user.full_name,
                    avatar: user.avatar_url
                };
                socket.data.boardId = boardId;

                await updateActiveUsers(boardId);
            } catch (err) {
                console.error("joinBoard error:", err);
                socket.emit("error", { message: "A server error occurred." });
            }
        });


        socket.on("leaveBoard", async (boardId) => {
            try {
                const id = boardId || socket.data.boardId;
                if (!id) return;

                const board = await Board.findOne({
                    _id: id,
                    deleted_at: null
                });

                if (!board) {
                    return socket.emit("error", { message: "Board not found." });
                }


                const roomName = `board:${id}`;
                socket.leave(roomName);

                if (socket.data.boardId === id) {
                    socket.data.boardId = null;
                    socket.data.user = null;
                }

                await updateActiveUsers(id);
            } catch (err) {
                console.error("leaveBoard error:", err);
            }
        });

        socket.on("join_user", async () => {
            const userId = socket.data.userId;
            if (!userId) {
                return socket.emit("error", { message: "Unauthorized" });
            }
            socket.join(userId.toString());
        });


        socket.on("join-card", async (cardId) => {
            const userId = socket.data.userId;
            if (!userId) {
                return socket.emit("error", { message: "Unauthorized" });
            }
            if (!cardId) {
                return;
            }
            const card = await Card.findById(cardId);
            if (!card) {
                return socket.emit("error", { message: "Card not found" });
            }
            const board = await Board.findOne({ _id: card.board_id, deleted_at: null });
            if (!board) {
                return socket.emit("error", { message: "Board not found" });
            }
            const workspace = await Workspace.findOne({
                _id:board.workspace_id
            });
            if (!workspace) {
                return socket.emit("error", { message: "You do not have permission to access this card." });
            }
            socket.join(`card_${cardId}`);
        });

        socket.on("leave-card", (cardId) => {
            const userId = socket.data.userId;
            if (!userId) {
                return socket.emit("error", { message: "Unauthorized" });
            }
            socket.leave(`card_${cardId}`);
        });

        socket.on("send-comment", ({ cardId, comment }) => {
            const userId = socket.data.userId;
            if (!userId) {
                return socket.emit("error", { message: "Unauthorized" });
            }
            if (!cardId || !comment) {
                return socket.emit("error", { message: "Invalid data provided" });
            }
            const commentPayload = {
                ...comment,
                user: socket.data.user || userId,
                user_id: userId
            };
            io.to(`card_${cardId}`).emit("new-comment", commentPayload);
        });


        socket.on("disconnect", async () => {
            const boardId = socket.data.boardId;
            if (boardId) {
                await updateActiveUsers(boardId);
            }
        });

    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocket, getIo }; 