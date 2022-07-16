//array of adjacent doors
//checkmark state
//secret count and gotten amount
//shape of room
//x,y of room
//rotation of room

class Room {

    static SPAWN = 0
    static NORMAL = 1
    static PUZZLE = 2
    static MINIBOSS = 3
    static FAIRY = 4
    static BLOOD = 5
    static TRAP = 7
    static UNKNOWN = 6

    /**
     * Creates a room based on a type, components, and a room id
     * @param {Number} type 
     * @param {Array<[Number,Number]>} components 
     * @param {String} roomId 
     */
    constructor(type, components, roomId) {
        this.type = type
        this.components = components
        this.roomId = roomId

        /**
         * 0 -> no checkmark
         * 1 -> white tick
         * 2 -> green tick
         */
        this.checkmarkState = 0

        /**
         * @type {Array<Door>}
         */
        this.adjecentDoors = []
    }
}

export default Room