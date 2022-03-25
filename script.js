const socket = io("http://socket.locking.jortvd.nl");

const TEAMS = ["team0", "team1", "team2", "team3", "team4", "team5"];
const ROOMS = ["room0", "room1", "room2", "room3", "room4", "room5", "room6"];
const locked = new Map();
let selectedTeam = "team0";

for(const ROOM of ROOMS) {
	locked.set(ROOM, false);
}

socket.on("lock", data => {
	toggleRoom(data.room, data.team);	
});

const toggleRoom = (room, team) => {
	const roomElement = document.getElementById(room);
	roomElement.classList.toggle("locked");
	const lock = !locked.get(room);
	locked.set(room, lock);

	if(lock) {
		roomElement.getElementsByClassName("tag")[0].innerHTML = `Locked by Team ${TEAMS.findIndex(item => item == team)+1}`;
	}
	else {
		roomElement.getElementsByClassName("tag")[0].innerHTML = `Unlocked`;
	}
}

socket.on("state", data => {
	for(const room of Object.keys(data.rooms)) {
		if(data.rooms[room] == undefined) continue;

		toggleRoom(room, data.rooms[room]);
	}
})

const setTeamListener = id => {
	const element = document.getElementById(id);
	element.addEventListener("click", () => {
		const selected = document.getElementsByClassName("team selected");

		if(selected.length > 0) selected[0].classList.remove("selected");

		element.classList.add("selected");

		selectedTeam = id;
	});
}

const setLockListener = id => {
	const element = document.getElementById(id);
	element.addEventListener("click", () => {
		socket.emit("lock", {room: id, team: selectedTeam});
	});
}

for(const TEAM of TEAMS) {
	setTeamListener(TEAM);
}

for(const ROOM of ROOMS) {
	setLockListener(ROOM);
}