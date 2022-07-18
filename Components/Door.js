import { roomColorMap } from "../Data/Colors"

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

    getRenderColor() {
        return roomColorMap.get(this.type)
    }

}

export default Door