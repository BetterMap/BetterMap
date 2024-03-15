export default class WorldUpdater {

    constructor() {

    }

    updateFromWorld() {
        let roomid = this.getCurrentRoomId()
        if (!roomid) return // No roomid eg inbetween 2 rooms
        if (!this.getCurrentRoomData()) return

        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 9 // Top left of current 1x1 that players in
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 9

        let playerMapX = ~~((Player.getX() + 200) / 32);
        let playerMapY = ~~((Player.getZ() + 200) / 32);
        let currentRoom = this.rooms.get(playerMapX + ',' + playerMapY);

        if (!currentRoom || !currentRoom.roomId || currentRoom.type === Room.UNKNOWN) { // Current room not already identified
            if (roomid !== this.lastRoomId && this.canUpdateRoom()) { // Room id changed, check current room
                this.lastRoomId = roomid

                let roomWorldData = this.getRoomWorldData()

                let rotation = roomWorldData.width > roomWorldData.height ? 0 : 1

                // L shape rooms only rooms that 'need' rotation all others can be 0 -> horizontal or 1-> verticle

                if (this.getCurrentRoomData().shape === "L") rotation = roomWorldData.rotation
                if (this.getCurrentRoomData().type === "spawn") {
                    roomWorldData.x = x + 1
                    roomWorldData.y = y + 1

                    this.setAirLocs.add((x - 1) + "," + (y - 1))
                    this.setAirLocs.add((x) + "," + (y - 1))
                    this.setAirLocs.add((x - 1) + "," + (y))

                    this.setAirLocs.add((x + 32) + "," + (y - 1))
                    this.setAirLocs.add((x + 32 - 1) + "," + (y - 1))
                    this.setAirLocs.add((x + 32) + "," + (y))

                    this.setAirLocs.add((x - 1) + "," + (y + 32))
                    this.setAirLocs.add((x - 1) + "," + (y - 1 + 32))
                    this.setAirLocs.add((x) + "," + (y + 32))

                    this.setAirLocs.add((x + 32) + "," + (y + 32))
                    this.setAirLocs.add((x + 32 - 1) + "," + (y + 32))
                    this.setAirLocs.add((x + 32) + "," + (y - 1 + 32))
                }

                this.setRoom(roomWorldData.x, roomWorldData.y, rotation, roomid, true)
                this.identifiedRoomIds.add(roomid);
            }
        }


        if (this.lastXY !== x + "," + y) {
            this.lastXY = x + "," + y

            // Checking for doors on all sides of room
            if (this.getBlockAt(x + 16, 73, y)) this.setDoor(x + 16, y, 0, true)
            if (this.getBlockAt(x, 73, y + 16)) this.setDoor(x, y + 16, 1, true)
            if (this.getBlockAt(x + 16, 73, y + 32)) this.setDoor(x + 16, y + 32, 0, true)
            if (this.getBlockAt(x + 32, 73, y + 16)) this.setDoor(x + 32, y + 16, 1, true)
        }
    }
}