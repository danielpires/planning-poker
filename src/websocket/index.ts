import {Server as httpServer} from "http";
import { Server, Socket } from "socket.io";

export class WebSocketServer {

    private server: Server;
    private users : Record<string, string> = {};
    private votes : Record<string, string> = {};
    private revealed : Boolean = false;
    
    constructor(httpServer: httpServer) {
        this.server = new Server(httpServer);
        
        this.server.on("connection", (socket: Socket) => {
            console.log("User connected: " + socket.id);

            socket.on("register", (username) => {
                this.users[socket.id] = username;
                this.server.emit("userlist", this.getUserStatus());
                socket.emit("init", { revealed: this.revealed });
            });

            socket.on("exit", (username) => {
                delete this.users[socket.id];
                this.server.emit("userlist", this.getUserStatus());
            });

            socket.on("vote", (value) => {
                if (!this.revealed) {
                    this.votes[socket.id] = value;
                    this.server.emit("userlist", this.getUserStatus());
                }
            });

            socket.on("reveal", () => {
                this.revealed = true;
                this.server.emit("results", this.getDetailedVotes());
            });

            socket.on("reset", () => {
                this.votes = {};
                this.revealed = false;
                this.server.emit("reset");
                this.server.emit("userlist", this.getUserStatus());
            });

            socket.on("disconnect", () => {
                console.log("User disconnected: " + socket.id);
                delete this.users[socket.id];
                delete this.votes[socket.id];
                this.server.emit("userlist", this.getUserStatus());
            });
        });
    }

    getDetailedVotes() {
        return Object.entries(this.users).map(([id, name]) => ({
          name,
          voted: this.votes.hasOwnProperty(id),
          vote: this.votes[id] || null
        }));
      }
      
    getUserStatus() {
        return Object.entries(this.users).map(([id, name]) => ({
          name,
          voted: this.votes.hasOwnProperty(id),
          vote: this.revealed ? this.votes[id] : null
        }));
    }
    
}