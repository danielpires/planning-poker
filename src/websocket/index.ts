import { Server as httpServer } from "http";
import { Server, Socket } from "socket.io";

interface User {
  name: string;
  vote: string | null;
  room: string;
}

export class WebSocketServer {
  private server: Server;
  private users: Record<string, User> = {};

  constructor(httpServer: httpServer) {
    this.server = new Server(httpServer);

    this.server.on("connection", (socket: Socket) => {
      console.log("User connected: " + socket.id);

      socket.on("register", (params: { username: string; room: string }) => {
        this.users[socket.id] = {
          name: params.username,
          vote: null,
          room: params.room,
        };
        socket.join(params.room);
        this.updateUserList(params.room);
      });

      socket.on("exit", () => {
        const room = this.users[socket.id]?.room;
        delete this.users[socket.id];
        this.updateUserList(room);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        const room = this.users[socket.id]?.room;
        delete this.users[socket.id];
        this.updateUserList(room);
      });

      socket.on("vote", (value: string) => {
        const user = this.users[socket.id];
        user.vote = value;
        this.updateUserList(user.room);
      });

      socket.on("reveal", () => {
        const user = this.users[socket.id];
        this.revealVotes(user.room);
      });

      socket.on("reset", () => {
        const room = this.users[socket.id]?.room;
        Object.values(this.users).forEach((user) => {
          if (user.room !== room) return;
          user.vote = null;
        });
        this.reset(room);
        this.updateUserList(room);
      });
    });
  }

  private updateUserList(room: string) {
    this.server.to(room).emit(
      "users",
      Object.entries(this.users)
        .filter(([id, user]) => user.room == room)
        .map(([id, user]) => ({
          id,
          name: user.name,
          voted: user.vote !== null,
        }))
    );
  }

  private revealVotes(room: string) {
    this.server.to(room).emit(
      "votes",
      Object.entries(this.users)
        .filter(([id, user]) => user.room == room)
        .map(([id, user]) => ({
          id,
          name: user.name,
          vote: user.vote,
          voted: user.vote !== null,
        }))
    );
  }

  private reset(room: string) {
    this.server.to(room).emit("reset");
  }
}
