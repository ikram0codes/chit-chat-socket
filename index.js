const { Server } = require("socket.io");
const cors = require("cors");
const http = require("http").createServer();
require("dotenv").config()
// Web Sockets
const io = new Server(http, {
  cors: {
    origin: "http://localhost:3000",
    "Access-Control-Allow-Origin": "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

let onlineUsers = [];
io.on("connection", (socket) => {
  socket.on("new-user-joined", (userId) => {
    if (!onlineUsers.some((user) => user.userId === userId)) {
      onlineUsers.push({ userId: userId, socketId: socket.id });
      console.log("New User Connected", onlineUsers);
    }
    io.emit("get-users", onlineUsers);
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected", onlineUsers);
    io.emit("get-users", onlineUsers);
  });

  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const { senderId } = data;
    const user = onlineUsers.find((user) => {
      return user.userId === receiverId;
    });
    const userme = onlineUsers.find((user) => {
      return user.userId === senderId;
    });
    io.to(userme?.socketId).emit("recieve-message", data);

    if (user) {
      io.to(user.socketId).emit("recieve-message", data);
    }
  });
  socket.on("group-message", (data) => {
    const { receiverId } = data;
    io.to(receiverId).emit("recieve-message", data);
  });
  socket.on("join-group", (data) => {
    socket.join(data.group);
    if (!onlineUsers.some((user) => user.userId === data.group)) {
      onlineUsers.push({ userId: data.group, socketId: socket.id });
      console.log("New User Connected", onlineUsers);
    }
    console.log(data.user, data.group);
    console.log(onlineUsers);
  });
  socket.on("group-message", (data) => {
    socket.broadcast.emit(data);
  });
});

//Starting Server
http.listen(process.env.PORT, () => {
  console.log(`Server Is Running on Port ${process.env.PORT}`);
});
