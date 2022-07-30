import Position from "../Utils/Position"

class Door {
    /**
     * @param {Room} type 
     * @param {Position} position 
     */
    constructor(type, position, horisontal) {
        this.type = type//same as room type
        this.position = position

        this.horisontal = horisontal
    }
}

export default Door