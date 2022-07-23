import { m } from "../../mappings/mappings.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"

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
     * @param {Number} type 
     * @param {Array<Position>} components 
     * @param {String} roomId 
     */
    constructor(type, components, roomId) {
        this._roomId = undefined

        this.type = type
        this.components = components

        /**
         * -1 -> failed
         * 0 -> not opened / not on the map yet
         * 1 -> adjacent, not opened, but visible on the map
         * 2 -> opened
         * 3 -> white tick
         * 4 -> green tick
         */
        this.checkmarkState = 0

        this.maxSecrets = undefined
        this.currentSecrets = undefined

        /**
         * @type {Array<Door>}
         */
        this.adjecentDoors = []

        //room data from the room id
        this.data = undefined

        this.roomId = roomId
    }

    get roomId() {
        return this._roomId
    }
    /**@param {String} value */
    set roomId(value) {
        if (!value) return

        this._roomId = value.trim()
        this.data = DungeonRoomData.getDataFromId(value.trim())

        if (this.data) {
            this.maxSecrets = this.data.secrets
            this.currentSecrets = this.currentSecrets || 0
        }
    }

    setType(type) {
        if (this.roomId) return
        this.type = type
    }
    /**
     * returns true if a room was cleared (at least white checkmark)
     */
    isCleared() {
        //always assume blood is cleared
        if (this.type === Room.BLOOD) return true;

        return this.checkmarkState >= Room.CLEARED;
    }

}

export default Room
