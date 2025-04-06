import { Server as httpServer } from "http";
import { Server, Socket } from "socket.io";

interface User {
  name: string;
  vote: string | null;
}

export class WebSocketServer {
  private server: Server;
  private users: Record<string, User> = {};

  constructor(httpServer: httpServer) {
    this.server = new Server(httpServer);

    this.server.on("connection", (socket: Socket) => {
      console.log("User connected: " + socket.id);

      socket.on("register", (name: string) => {
        this.users[socket.id] = { name, vote: null };
        this.updateUserList();
      });

      socket.on("exit", () => {
        delete this.users[socket.id];
        this.updateUserList();
      });

      socket.on("vote", (value: string) => {
        this.users[socket.id].vote = value;
        this.updateUserList();
      });

      socket.on("reveal", () => {
        this.revealVotes();
      });

      socket.on("reset", () => {
        Object.values(this.users).forEach((user) => {
          user.vote = null;
        });
        this.reset();
        this.updateUserList();
      });

      socket.on("disconnect", () => {
        console.log("User disconnected: " + socket.id);
        delete this.users[socket.id];
        this.updateUserList();
      });
    });
  }

  private updateUserList() {
    this.server.emit(
      "users",
      Object.entries(this.users).map(([id, user]) => ({
        id,
        name: user.name,
        voted: user.vote !== null,
      }))
    );
  }

  private revealVotes() {
    this.server.emit(
      "votes",
      Object.entries(this.users).map(([id, user]) => ({
        id,
        name: user.name,
        vote: user.vote,
        voted: user.vote !== null,
      }))
    );
  }

  private reset() {
    this.server.emit("reset");
  }
}
