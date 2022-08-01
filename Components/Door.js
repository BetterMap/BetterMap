import Position from "../Utils/Position"

class Door {
    /**
     * @param {Room} type 
     * @param {Position} position 
     */
    constructor(type, position, horizontal) {
        this.type = type//same as room type
        this.position = position

        this.horizontal = horizontal
    }
}

export default Door