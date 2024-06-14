import { m } from "../../mappings/mappings.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"
import settings from "../Extra/Settings/CurrentSettings.js"
import CurrentSettings from "../Extra/Settings/CurrentSettings.js"
import { drawBoxAtBlock } from "../Utils/renderUtils.js"
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
    static BLACK = 8 // For wither door only

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

        this.cores = []

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
                    if (players.length === 1) p.minRooms++
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
        
    }

    /**
     * @param {RoomEvent} event 
     * @param  {...any} args 
     */
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
            if (this.type === Room.NORMAL) roomLore.push("Ceiling Spiders: " + (this.data?.spiders ? "Yes" : "No"))
        }
        else {
            roomLore.push('Unknown room!')
            if (CurrentSettings.settings.devInfo) roomLore.push('&9Rotation: ' + (this.rotation > -1 ? this.rotation : 'NONE'));
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
            case 0:
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
            case 0:
                return { x: z, y: y, z: this.height - x };
            case 1:
            // No break, default rotation
            default:
                return { x: x, y: y, z: z };
        }
    }

    drawRoomSecrets() {
        if (!settings.settings.showSecrets) return
        if (!this.data) return
        // TODO: account for 3/1 room
        if (this.currentSecrets === this.maxSecrets) return
        if (!("secret_coords" in this.data)) return //ChatLib.chat("No Data!")

        // Every secret type in the room
        Object.entries(this.data.secret_coords).forEach(([type, secrets]) => {
            // Loop over every secret
            secrets.forEach(([rx, ry, rz]) => {
                let { x, y, z } = this.toRoomCoords(rx, ry, rz)
                if (this.dungeon.collectedSecrets.has(x + "," + y + "," + z)) return;

                if (type == "chest") drawBoxAtBlock(x, y, z, 0, 1, 0, 1, 1)
                if (type == "item") drawBoxAtBlock(x + 0.25, y, z + 0.25, 0, 0, 1, 0.5, 0.5)
                if (type == "wither") drawBoxAtBlock(x + 0.25, y, z + 0.25, 1, 0, 1, 0.5, 0.5)
                if (type == "bat") drawBoxAtBlock(x + 0.25, y + 0.25, z + 0.25, 0, 1, 0, 0.5, 0.5)
                if (type == "redstone_key") drawBoxAtBlock(x + 0.25, y, z + 0.25, 1, 0, 0, 0.5, 0.5)
            });
        })

        // this.data.secret_coords?.chest?.forEach(([rx, ry, rz]) => {
        //     let { x, y, z } = this.toRoomCoords(rx, ry, rz);

        //     if (this.dungeon.collectedSecrets.has(x + "," + y + "," + z)) return
        //     drawBoxAtBlock(x, y, z, 0, 1, 0, 1, 1)
        // });
        // this.data.secret_coords?.item?.forEach(([rx, ry, rz]) => {
        //     let { x, y, z } = this.toRoomCoords(rx, ry, rz);

        //     if (this.dungeon.collectedSecrets.has(x + "," + y + "," + z)) return
        //     drawBoxAtBlock(x + 0.25, y, z + 0.25, 0, 0, 1, 0.5, 0.5)
        // });
        // this.data.secret_coords?.wither?.forEach(([rx, ry, rz]) => {
        //     let { x, y, z } = this.toRoomCoords(rx, ry, rz);

        //     if (this.dungeon.collectedSecrets.has(x + "," + y + "," + z)) return
        //     drawBoxAtBlock(x + 0.25, y, z + 0.25, 1, 0, 1, 0.5, 0.5)
        // });
        // this.data.secret_coords?.bat?.forEach(([rx, ry, rz]) => {
        //     let { x, y, z } = this.toRoomCoords(rx, ry, rz);

        //     if (this.dungeon.collectedSecrets.has(x + "," + y + "," + z)) return
        //     drawBoxAtBlock(x + 0.25, y + 0.25, z + 0.25, 0, 1, 0, 0.5, 0.5)
        // });
        // this.data.secret_coords?.redstone_key?.forEach(([rx, ry, rz]) => {
        //     let { x, y, z } = this.toRoomCoords(rx, ry, rz);

        //     if (this.dungeon.collectedSecrets.has(x + "," + y + "," + z)) return
        //     drawBoxAtBlock(x + 0.25, y, z + 0.25, 1, 0, 0, 0.5, 0.5)
        // });
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

    toString() {
        return `Room[name=${this.data?.name || "Unknown"}, components=${this.components}]`
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
