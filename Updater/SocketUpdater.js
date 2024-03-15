export default class SocketUpdater {

    constructor() {

    }

    updatePlayerLocation(data) {
        let p = this.players[this.playersNameToId[data.username]]
        if (!p) return

        p.setXAnimate(data.x, 350)
        p.setYAnimate(data.z, 350)
        p.setRotateAnimate(data.yaw, 350)
        p.locallyUpdated = Date.now()
    }

    updateRoomSecrets(data) {
        let currentRoom = this.rooms.get(data.x + ',' + data.y);

        if (!currentRoom || currentRoom.type === Room.UNKNOWN) return; // Current room not loaded yet

        if (currentRoom.currentSecrets !== data.min) {
            currentRoom.currentSecrets = data.min
            currentRoom.maxSecrets = data.max

            this.markChanged() // Re-render map incase of a secret count specific texturing
        }
    }

    updateDoorLocation(data) {
        this.setDoor(data.x, data.y, data.ishorizontal, false, data.doorType);
    }

    updateRoomLocation(data) {
        this.setRoom(data.x, data.y, data.rotation, data.roomId, false);
    }

    loadRoomId(data) {
        let currentRoom2 = this.rooms.get(data.x + ',' + data.y);

        if (!currentRoom2 || currentRoom2.roomId || currentRoom2.type === Room.UNKNOWN) return; // Current room not loaded yet, or already loaded id

        currentRoom2.roomId = data.roomId;

        this.markChanged() // Re-render map incase of a room-id specific texturing
    }

    completeBlazePuzzle(data) {
        this.roomsArr.forEach(room => {
            if (room.data?.name?.toLowerCase() === 'higher or lower') {
                room.checkmarkState = room.currentSecrets ? Room.COMPLETED : Room.CLEARED;
            }
        })
    }

    killMimic() {
        this.mimicKilled = true;
    }

    collectSecret(data) {
        this.collectSecret.add(data.location);
    }

    socketData(data) {
        switch (data.type) {
            case "playerLocation":
                this.updatePlayerLocation(data);
                break;
            case "roomSecrets":
                this.updateRoomSecrets(data);
                break;
            case "doorLocation":
                this.updateDoorLocation(data);
                break;
            case "roomLocation":
                this.updateRoomLocation(data);
                break;
            case "roomId":
                this.loadRoomId(data);
                break;
            case "mimicKilled":
                this.killMimic();
                break;
            case "blazeDone":
                this.completeBlazePuzzle(data);
                break;
            case "secretCollect":
                this.collectSecret(data);
                break;
        }
    }
    
    sendSocketData(data) {
        socketConnection.sendDungeonData({ data, players: this.players.map(a => a.username) })
    }

    
    syncPlayersThruSocket() {
        this.players.forEach(p => p.checkUpdateUUID())

        World.getAllPlayers().forEach(player => {
            let name = getPlayerName(player)
            if (!this.playersNameToId[name]) return
            let p = this.players[name]
            if (!p) return

            p.setX(player.getX())
            p.setY(player.getZ())
            p.setRotate(player.getYaw() + 180)
            p.locallyUpdated = Date.now()
            this.nameToUuid[name] = player.getUUID().toString()

            this.sendSocketData({
                type: "playerLocation",
                username: name,
                x: player.getX(),
                y: player.getY(),
                z: player.getZ(),
                yaw: player.getYaw() + 180
            })
        })
    }

}