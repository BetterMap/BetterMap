import { m } from "../../mappings/mappings.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"
import CurrentSettings from "../Extra/Settings/CurrentSettings.js"
import { firstLetterCapital } from "../Utils/Utils.js"
import { createEvent, RoomEvents, toDisplayString } from "./RoomEvent.js"

class Room {

    static SPAWN = 0
    static NORMAL = 1
    static PUZZLE = 2
    static MINIBOSS = 3
    static FAIRY = 4
    static BLOOD = 5
    static UNKNOWN = 6
    static TRAP = 7
    static BLACK = 8 //for wither door only

    static FAILED = -1;
    static UNOPENED = 0;
    static ADJACENT = 1;
    static OPENED = 2;
    static CLEARED = 3;
    static COMPLETED = 4;

    /**
     * Creates a room based on a type, components, and a room id
     * @param {Any} dungeon 
     * @param {Number} type 
     * @param {Array<Position>} components 
     * @param {String} roomId 
     */
    constructor(dungeon, type, components, roomId) {
        /**
         * @type {Array<Door>}
         */
        this.adjacentDoors = []
        this.roomEvents = []

        this.dungeon = dungeon

        this.type = type
        this.components = components
        this.width = 30;
        this.height = 30;
        this.minX = null;
        this.minY = null;
        this.shape = this.findShape()
        this.rotation = this.findRotation();

        /**
         * -1 -> failed
         * 0 -> not opened / not on the map yet
         * 1 -> adjacent, not opened, but visible on the map
         * 2 -> opened
         * 3 -> white tick
         * 4 -> green tick
         */
        this._checkmarkState = 0

        this.maxSecrets = undefined
        this._currentSecrets = undefined


        // Room data from the room id
        this.data = undefined

        this._roomId = undefined
        this.roomId = roomId
    }

    set checkmarkState(val) {
        if (this.checkmarkState !== val) {
            this.addEvent(RoomEvents.CHECKMARK_STATE_CHANGE, this.checkmarkState, val)

            if ((this._checkmarkState === Room.OPENED || this._checkmarkState === Room.UNOPENED)
                && (val === Room.CLEARED || val === Room.COMPLETED)
                && this.type !== Room.FAIRY && this.type !== Room.SPAWN) {
                let players = this.getPlayersInRoom()

                players.forEach(p => {
                    p.maxRooms++
                    if (players.length === 1) {
                        p.minRooms++
                    }
                    p.roomsData.push([players, this])
                })
            }
        }
        this._checkmarkState = val
    }

    get checkmarkState() {
        return this._checkmarkState
    }

    set currentSecrets(val) {
        if ((this.currentSecrets || 0) !== (val || 0)) {
            this.addEvent(RoomEvents.SECRET_COUNT_CHANGE, (this.currentSecrets || 0) + "/" + (this.maxSecrets || "???"), (val || 0) + "/" + (this.maxSecrets || "???"))
        }
        this._currentSecrets = val
    }

    get currentSecrets() {
        return this._currentSecrets
    }

    addComponents(newComponents) {

        let parts = []
        this.components.forEach(c => parts.push(c.arrayX + ',' + c.arrayY));

        this.components.push(newComponents)
        this.shape = this.findShape()
        this.rotation = this.findRotation();
    }

    addDoor(newDoor) {
        this.adjacentDoors.push(newDoor);
        this.shape = this.findShape()
        this.rotation = this.findRotation()
    }

    /**
     * Finds the shape of the room and updates the room's 'shape' field.
     */
    findShape() {
        const len = this.components.length
        if (len == 1) return "1x1"
        if (len == 2) return "1x2"

        const x = this.components.map(a => a.arrayX)
        const y = this.components.map(a => a.arrayY)
        const uniqueX = new Set(x).size
        const uniqueY = new Set(y).size

        if (uniqueX == 2 && uniqueY == 2 && len == 4) return "2x2"
        if ((uniqueX == 1 || uniqueY == 1)) {
            if (len == 3) return "1x3"
            if (len == 4) return "1x4"
        }
        return "L"
    }

    findRotation() {
        if (this.type === Room.FAIRY) return 1;

        // Commented out stuff gets the room rotation differently to whatever soopy decided on for his rotations ):
        // Rotates the room the same way Hypixel does, getting the same result as if you were to scan the ceiling.

        // let components = this.components.map(a => [a.arrayX, a.arrayY])
        // const x = this.components.map(a => a.arrayX)
        // const y = this.components.map(a => a.arrayY)
        // const uniqueX = new Set(x).size
        // const uniqueY = new Set(y).size

        // // 2x2's never rotate
        // if (this.shape == "2x2") return 1

        // // Flat long room = not rotated, vertical = rotated 270 degrees
        // if (["1x4", "1x3", "1x2"].includes(this.shape)) {
        //     if (uniqueX == 1) return 1
        //     if (uniqueY == 1) return 3
        // }


        // // L rooms
        // if (this.shape == "L") {
        //     // Finds the component with two adjacent components. The corner of the L.
        //     let corner = components.find(([x1, y1]) => components.filter(([x2, y2])=>(y1 == y2 && (x1 == x2+1 || x1 == x2-1)) || (x1 == x2 && (y1 == y2+1 || y1 == y2-1))).length == 2)
        //     let [cx, cy] = corner

        //     const minx = Math.min(...x)
        //     const maxx = Math.max(...x)
        //     const miny = Math.min(...y)
        //     const maxy = Math.max(...y)

        //     if (cx == minx && cy == maxy) return 1 // Bottom Left
        //     if (cx == maxx&& cy == maxy) return 2 // Bottom Right
        //     if (cx == maxx&& cy == miny) return 3 // Top Right
        //     if (cx == minx && cy == miny) return 4 // Top Left
        // }

        // // Only 1x1's left, not done yet

        // if (this.shape == "1x1") {
        //     // a
        // }

        // -------------------------


        let minX = -1, maxX = -1, minY = -1, maxY = -1;
        this.components.forEach((c) => {
            if (minX < 0 || c.arrayX < minX)
                minX = c.arrayX;
            if (maxX < 0 || c.arrayX > maxX)
                maxX = c.arrayX;

            if (minY < 0 || c.arrayY < minY)
                minY = c.arrayY;
            if (maxY < 0 || c.arrayY > maxY)
                maxY = c.arrayY;

            if (!this.minX || this.minX > c.worldX)
                this.minX = c.worldX;
            if (!this.minY || this.minY > c.worldY)
                this.minY = c.worldY;
        });

        let dx = maxX - minX;
        let dy = maxY - minY;

        this.width = 30 + 32 * dx;
        this.height = 30 + 32 * dy;

        if (dx > 0 && dy > 0) {
            //2x2
            if (this.components.length === 4) {
                return 1;
            } else if (this.components.length === 3) {
                let parts = [];
                this.components.forEach(c => parts.push(c.arrayX + ',' + c.arrayY));
                if (!parts.includes(minX + ',' + minY)) {
                    return 4;
                } else if (!parts.includes(minX + ',' + maxY)) {
                    return 3;
                } else if (!parts.includes(maxX + ',' + minY)) {
                    return 1;
                } else if (!parts.includes(maxX + ',' + maxY)) {
                    return 2;
                }
                return -1;
                // OH IT'S AN L ROOM
            }
        } else if (dx > 0) {
            return 1;
        } else if (dy > 0) {
            return 2;
        } else {
            let roomX = minX;
            let roomY = minY;
            let doorLocations = this.adjacentDoors.map(a => `${a.position.arrayX},${a.position.arrayY}`)
            let up = doorLocations.includes((roomX + 0.5) + ',' + (roomY));
            let down = doorLocations.includes((roomX + 0.5) + ',' + (roomY + 1));
            let right = doorLocations.includes((roomX + 1) + ',' + (roomY + 0.5));
            let left = doorLocations.includes((roomX) + ',' + (roomY + 0.5));
            //1x1s, check door positions
            if (this.adjacentDoors.length === 4) {
                // Do not ask me why
                return 1;
            } else if (this.adjacentDoors.length === 3) {
                if (!left) return 3;
                if (!right) return 1;
                if (!up) return 4;
                if (!down) return 2;

            } else if (this.adjacentDoors.length === 1) {
                // Dead end 
                if (right)
                    return 2;
                else if (left)
                    return 4;
                else if (down)
                    return 3;
                else if (up)
                    return 1;

            } else {
                if (up && down) return 2;
                if (left && right) return 1;

                if (left && down) return 1;
                if (up && left) return 2;
                if (up && right) return 3;
                if (right && down) return 4;
            }
        }
        return -1;
    }

    get roomId() {
        return this._roomId
    }
    /**@param {String} value */
    set roomId(value) {
        if (!value) return

        this._roomId = value.trim()
        this.data = DungeonRoomData.getDataFromId(value.trim())

        if (!this.data) return
        let oldMax = this.maxSecrets

        this.maxSecrets = this.data.secrets
        this.currentSecrets = this.currentSecrets || 0

        if (this.maxSecrets !== oldMax) {
            this.addEvent(RoomEvents.SECRET_COUNT_CHANGE, (this.currentSecrets || 0) + "/" + (oldMax || "???"), (this.currentSecrets || 0) + "/" + this.maxSecrets)
        }
    }

    addEvent(event, ...args) {
        this.roomEvents.push(createEvent(event, ...args))
    }

    setType(type) {
        if (this.roomId) return
        this.type = type
    }
    /**
     * returns true if a room was cleared (at least white checkmark)
     */
    isCleared() {
        // Always assume blood is cleared
        if (this.type === Room.BLOOD) return true;

        return this.checkmarkState >= Room.CLEARED;
    }

    getPlayersInRoom() {
        return this.dungeon.players.filter(p => p.getRoom(this.dungeon) === this)
    }

    getLore() {
        let roomLore = []
        if (this.roomId) {
            roomLore.push(this.data?.name || '???')
            roomLore.push("&8" + (this.roomId || ""))
            if (CurrentSettings.settings.devInfo) roomLore.push('&9Rotation: ' + (this.rotation || 'NONE'));
            if (this.data && this.data?.soul) roomLore.push("&dFAIRY SOUL!")
            if (this.maxSecrets) roomLore.push("Secrets: " + this.currentSecrets + ' / ' + this.maxSecrets)
            if (this.data?.crypts !== undefined && (this.type === Room.NORMAL || this.type === Room.MINIBOSS || this.type === Room.TRAP)) roomLore.push("Crypts: " + this.data.crypts)
            if (this.type === Room.NORMAL) roomLore.push("Spiders: " + (this.data?.spiders ? "Yes" : "No"))
        } else {
            roomLore.push('Unknown room!')
            if (CurrentSettings.settings.devInfo) roomLore.push('&9Rotation: ' + (this.rotation || 'NONE'));
        }

        if (CurrentSettings.settings.devInfo) {
            roomLore.push(`Shape: ${this.shape}`)
            roomLore.push("--------------")
            for (let event of this.roomEvents) {
                roomLore.push(toDisplayString(this, event))
            }
        }

        return roomLore
    }

    toRoomCoords(px, py, pz) {
        let { x, y, z } = this.rotateCoords(px, py, pz);
        return { x: this.minX + x, y: y, z: this.minY + z };
    }

    getRelativeCoords(x, y, z) {
        let dx = x - this.minX
        let dy = y;
        let dz = z - this.minY;

        // Rotate opposite direction
        switch (this.rotation) {
            case 2:
                return { x: dz, y: dy, z: this.width - dx };
            case 3:
                return { x: this.width - dx, y: dy, z: this.height - dz };;
            case 4:
                return { x: this.height - dz, y: dy, z: dx };;
            case 1:
            default:
                return { x: dx, y: dy, z: dz };
        }
    }

    rotateCoords(x, y, z) {
        switch (this.rotation) {
            case 2:
                return { x: this.width - z, y: y, z: x };
            case 3:
                return { x: this.width - x, y: y, z: this.height - z };
            case 4:
                return { x: z, y: y, z: this.height - x };
            case 1:
            // No break, default rotation
            default:
                return { x: x, y: y, z: z };
        }
    }

    checkmarkStateToName(state = this.checkmarkState) {
        return Room.checkmarkStateToName(state)
    }

    static checkmarkStateToName(state) {
        return firstLetterCapital(checkmarkStateName.get(state).toLowerCase())
    }

    typeToName(type = this.type) {
        return Room.typeToName(type)
    }

    static typeToName(type) {
        return firstLetterCapital(typeName.get(type).toLowerCase())
    }

    typeToColor(type = this.type) {
        return Room.typeToColor(type)
    }

    static typeToColor(type) {
        return typeColor.get(type)
    }
}

let checkmarkStateName = new Map()

checkmarkStateName.set(Room.FAILED, "FAILED")
checkmarkStateName.set(Room.UNOPENED, "UNOPENED")
checkmarkStateName.set(Room.ADJACENT, "ADJACENT")
checkmarkStateName.set(Room.OPENED, "OPENED")
checkmarkStateName.set(Room.CLEARED, "CLEARED")
checkmarkStateName.set(Room.COMPLETED, "COMPLETED")

let typeName = new Map()
typeName.set(Room.SPAWN, "SPAWN")
typeName.set(Room.NORMAL, "NORMAL")
typeName.set(Room.PUZZLE, "PUZZLE")
typeName.set(Room.MINIBOSS, "MINIBOSS")
typeName.set(Room.FAIRY, "FAIRY")
typeName.set(Room.BLOOD, "BLOOD")
typeName.set(Room.UNKNOWN, "UNKNOWN")
typeName.set(Room.TRAP, "TRAP")
typeName.set(Room.BLACK, "BLACK")

let typeColor = new Map()
typeColor.set(Room.SPAWN, "a")
typeColor.set(Room.NORMAL, "7")
typeColor.set(Room.PUZZLE, "d")
typeColor.set(Room.MINIBOSS, "e")
typeColor.set(Room.FAIRY, "d")
typeColor.set(Room.BLOOD, "c")
typeColor.set(Room.UNKNOWN, "f")
typeColor.set(Room.TRAP, "6")
typeColor.set(Room.BLACK, "0")

export default Room
