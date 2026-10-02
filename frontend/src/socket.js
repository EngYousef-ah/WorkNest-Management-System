import { io } from "socket.io-client";
const token = localStorage.getItem("token");
const socket = io("http://localhost:3000", {
    autoConnect: true,
    auth: {
        token: token // <--- هذا هو الأهم لكي ينجح الـ io.use في السيرفر
    },
    reconnection: true
});

export default socket;


