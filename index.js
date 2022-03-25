const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');
const { URL } = require('url');

const TEAMS = ["team0", "team1", "team2", "team3", "team4", "team5"];
const ROOMS = ["room0", "room1", "room2", "room3", "room4", "room5", "room6"];

class Application {
	constructor() {
		this.server = http.createServer((req, res) => this.handle(req, res));
		this.socketServer = http.createServer();
		this.io = socketio(this.socketServer);
		this.clients = [];
		this.io.on('connection', client => {
			this.clients.push(client);
			const rooms = {};
			this.locked.forEach((value, key) => rooms[key] = value);
			client.emit("state", {rooms});

			client.on('lock', data => this.handleLock(data));
			client.on('disconnect', () => {
				this.clients = this.clients.filter(c => c !== client);
			});
		});
		this.files = {
			"/": fs.readFileSync("./index.html"),
			"/stylesheet.css": fs.readFileSync("./stylesheet.css"),
			"/script.js": fs.readFileSync("./script.js"),
			"/socket.io.min.js": fs.readFileSync("./socket.io.min.js")
		};

		this.locked = new Map();

		for(const ROOM of ROOMS) {
			this.locked.set(ROOM, undefined);
		}
	}

	handleLock(data) {
		const team = data.team;
		const room = data.room;

		if(!this.locked.has(room)) return;
		if(!TEAMS.includes(team)) return;

		if(this.locked.get(room) === undefined) {
			this.locked.set(room, team);
			this.broadcast("lock", {room, team});
		}
		else {
			this.locked.set(room, undefined);
			this.broadcast("lock", {room});
		}

		
	}

	broadcast(event, data) {
		for(const client of this.clients) {
			client.emit(event, data);
		}
	}

	handle(req, res) {
		const url = new URL(req.url, `http://${req.headers.host}`);
		const path = url.pathname;

		if(!Object.keys(this.files).includes(path)) {
			res.statusCode = 404;
			res.end();
		}

		res.statusCode = 200;
		res.end(this.files[path]);
	}

	start() {
		this.server.listen(8125);
		this.socketServer.listen(8126);
	}
}

const app = new Application();
app.start();