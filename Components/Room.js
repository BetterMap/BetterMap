import DungeonRoomData from "../Data/DungeonRoomData.js"
import settings from "../Extra/Settings/CurrentSettings.js"
import CurrentSettings from "../Extra/Settings/CurrentSettings.js"
import { drawBoxAtBlock } from "../Utils/renderUtils.js"
import RoomComponent from "../Utils/RoomComponent.js"
import { Checkmark, chunkLoaded, firstLetterCapital, rotateCoords } from "../Utils/Utils.js"
import MapPlayer from "./MapPlayer.js"
import { createEvent, RoomEvents, toDisplayString } from "./RoomEvent.js"

class Room {

    // Room and Door Types
    static SPAWN = 0
    static NORMAL = 1
    static PUZZLE = 2
    static MINIBOSS = 3
    static FAIRY = 4
    static BLOOD = 5
    static UNKNOWN = 6
    static TRAP = 7
    static BLACK = 8 // For wither door only

    // Checkmarks
    // static FAILED = -1;
    // static UNOPENED = 0;
    // static ADJACENT = 1;
    // static OPENED = 2;
    // static CLEARED = 3;
    // static COMPLETED = 4;

    /**
     * Creates a room based on a type, components, and a room id
     * @param {Any} dungeon 
     * @param {Number} type 
     * @param {Array<RoomComponent>} components 
     */
    constructor(dungeon, type, components, roofHeight=null) {
        /**
         * @type {Array<Door>}
         */
        this.adjacentDoors = []
        this.roomEvents = []

        this.dungeon = dungeon

        this.name = null
        this.type = type
        this.components = components
        this.sortComponents()
        this.components.forEach(component => this.dungeon.rooms.set(component, this))

        this.width = 30;
        this.height = 30;
        this.minX = null;
        this.minY = null;
        this.shape = this.findShape()
        this.rotation = null
        this.roofHeight = roofHeight
        this.cores = []
        
        this.findRotationAndCorner();

        /**
         * -1 -> failed
         * 0 -> not opened / not on the map yet
         * 1 -> adjacent, not opened, but visible on the map
         * 2 -> opened
         * 3 -> white tick
         * 4 -> green tick
         */
        this._checkmarkState = Checkmark.NONE

        this.maxSecrets = 0
        this._currentSecrets = undefined
        this.currentSecrets = 0
        


        // Room data from the room id
        this.data = undefined

    }

    /**
     * Loads this room's room data
     * @param {Object} roomData 
     */
    setRoomData(roomData) {
        this.data = roomData
        this.name = roomData.name
        this.type = this.getTypeFromString(this.data.type)
        this.maxSecrets = this.data.secrets
        this.cores = roomData.cores
    }

    /**
     * Loads the room data for this room from it's core
     * @param {Number} core 
     * @returns 
     */
    loadFromCore(core) {
        let roomData = DungeonRoomData.getDataFromCore(core)
        if (!roomData) return false

        this.setRoomData(roomData)
        return true
    }

    set checkmarkState(val) {
        // Checkmark changed to either Whiteo or Green
        if (this.checkmarkState !== val && val !== Checkmark.GRAY && val !== Checkmark.NONE) {
            this.addEvent(RoomEvents.CHECKMARK_STATE_CHANGE, this.checkmarkState, val)

            const old = this._checkmarkState
            const newlyCheckmarked = (old == Checkmark.NONE || old == Checkmark.GRAY) && (val == Checkmark.WHITE || val == Checkmark.GREEN)

            if (newlyCheckmarked && this.type !== Room.FAIRY && this.type !== Room.SPAWN) {
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

    sortComponents() {
        this.components.sort((a, b) => a.posIndex - b.posIndex)
    }
    
    /**
     * 
     * @param {RoomComponent} component 
     */
    addComponent(component) {
        if (this.components.includes(component)) return

        this.components.push(component)
        this.sortComponents()

        this.shape = this.findShape()
        this.findRotationAndCorner();

        this.dungeon.rooms.set(component, this)
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

    findRotationAndCorner() {
        // Roof height is needed to find stained clay
        if (!this.roofHeight) return

        if (this.type == Room.FAIRY) {
            this.rotation = 0
            let x = this.components[0].worldX
            let z = this.components[0].worldY

            this.corner = [x-15.5, 0, z-15.5]
            return
        }

        const minX = Math.min(...this.components.map(a => a.worldX))
        const maxX = Math.max(...this.components.map(a => a.worldX))
        const minY = Math.min(...this.components.map(a => a.worldY))
        const maxY = Math.max(...this.components.map(a => a.worldY))

        // Corners of the room, in clockwise order from top left
        const spots = [
            [minX - 15, minY - 15],
            [maxX + 15, minY - 15],
            [maxX + 15, maxY + 15],
            [minX - 15, maxY + 15]
        ]

        for (let i = 0; i < spots.length; i++) {
            let [x, z] = spots[i]

            if (!chunkLoaded(x, this.roofHeight, z)) return

            // Looking for blue stained hardened clay at the corner of the room
            let block = World.getBlockAt(x, this.roofHeight, z)
            if (block.type.getID() !== 159 || block.getMetadata() !== 11) continue

            this.rotation = i
            this.corner = [x+0.5, 0, z+0.5]
            return
        }
    }

    /**
     * @param {RoomEvent} event 
     * @param  {...any} args 
     */
    addEvent(event, ...args) {
        this.roomEvents.push(createEvent(event, ...args))
    }

    getTypeFromString(typeString) {
        const types = {
            "spawn": Room.SPAWN,
            "normal": Room.NORMAL,
            "mobs": Room.NORMAL,
            "miniboss": Room.NORMAL,
            "puzzle": Room.PUZZLE,
            "gold": Room.MINIBOSS,
            "fairy": Room.FAIRY,
            "blood": Room.BLOOD,
            "unknown": Room.UNKNOWN,
            "trap": Room.TRAP,
        }
        
        if (!(typeString in types)) return null

        return types[typeString]
    }

    setType(type) {
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

    /**
     * 
     * @returns {MapPlayer[]}
     */
    getPlayersInRoom() {
        return this.dungeon.players.filter(p => p.getRoom() === this)
    }

    getLore() {
        let roomLore = []

        if (this.data) {
            roomLore.push(this.name ?? '???')
            // roomLore.push("&8" + (this.roomId || ""))
            if (CurrentSettings.settings.devInfo) roomLore.push('&9Rotation: ' + (this.rotation ?? 'NONE'));
            if (this.data && this.data?.soul) roomLore.push("&dFAIRY SOUL!")
            if (this.maxSecrets) roomLore.push("Secrets: " + this.currentSecrets + ' / ' + this.maxSecrets)
            if (this.data?.crypts !== undefined && (this.type === Room.NORMAL || this.type === Room.MINIBOSS || this.type === Room.TRAP)) roomLore.push("Crypts: " + this.data.crypts)
            if (this.type === Room.NORMAL) roomLore.push("Ceiling Spiders: " + (this.data?.spiders ? "Yes" : "No"))
        }
        else {
            roomLore.push(this.name ?? 'Unknown room!')
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

    /**
     * Converts coordinates from the real world into relative, rotated room coordinates
     * @param {[Number, Number, Number]} coord 
     * @returns 
     */
    getRoomCoord(coord, ints=true) {
        if (this.rotation == null || !this.corner) return null

        const cornerCoord = ints ? this.corner.map(Math.floor) : this.corner
        const roomCoord = rotateCoords(coord.map((v, i) => v - cornerCoord[i]), this.rotation)

        if (ints) return roomCoord.map(Math.floor)
        
        return roomCoord
    }

    /**
     * Converts relative room coords and inversely rotates and translates them to real world coordinates
     * @param {[Number, Number, Number]} coord 
     * @returns 
     */
    getRealCoord(coord, ints=true) {
        if (this.rotation == null || !this.corner) return null
    
        const rotated = rotateCoords(coord, 4 - this.rotation)
        const roomCorner = ints ? this.corner.map(Math.floor) : this.corner
        const realCoord = rotated.map((v, i) => v + roomCorner[i])
    
        if (ints) return realCoord.map(Math.floor)
    
        return realCoord

    }

    drawRoomSecrets() {
        if (!settings.settings.showSecrets) return
        if (!this.data || !this.corner) return
        // TODO: account for 3/1 room
        if (this.currentSecrets >= this.maxSecrets) return
        if (!("secret_coords" in this.data)) return //ChatLib.chat("No Data!")

        // Every secret type in the room
        Object.entries(this.data.secret_coords).forEach(([type, secrets]) => {
            // Loop over every secret
            secrets.forEach((pos) => {
                const secretPos = this.getRealCoord(pos)
                if (!secretPos) return
                let [ x, y, z ] = secretPos

                if (this.dungeon.collectedSecrets.has(x + "," + y + "," + z)) return;

                if (type == "chest") drawBoxAtBlock(x+0.0625, y, z+0.0625, 0, 1, 0, 0.875, 0.875)
                if (type == "item") drawBoxAtBlock(x + 0.25, y, z + 0.25, 0, 0, 1, 0.5, 0.5)
                if (type == "wither") drawBoxAtBlock(x + 0.25, y, z + 0.25, 1, 0, 1, 0.5, 0.5)
                if (type == "bat") drawBoxAtBlock(x + 0.25, y + 0.25, z + 0.25, 0, 1, 0, 0.5, 0.5)
                if (type == "redstone_key") drawBoxAtBlock(x + 0.25, y, z + 0.25, 1, 0, 0, 0.5, 0.5)
            });
        })

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
        return `Room["${this.name || "Unknown"}", [${this.components.map(a => a.toString()).join(",")}], ${this.type}, rot=${this.rotation}]`
    }
}

let checkmarkStateName = new Map()

checkmarkStateName.set(Checkmark.FAILED, "FAILED")
checkmarkStateName.set(Checkmark.GRAY, "GRAY")
checkmarkStateName.set(Checkmark.NONE, "NONE")
checkmarkStateName.set(Checkmark.WHITE, "WHITE")
checkmarkStateName.set(Checkmark.GREEN, "GREEN")

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
