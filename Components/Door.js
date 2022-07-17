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

    render(graphics) {
        graphics.setColor(this.getRenderColor())

        graphics.fillRect(this.position.worldX + (this.horisontal ? 1 : 0), this.position.worldY + (this.horisontal ? 0 : 1), this.horisontal ? 6 : 8, this.horisontal ? 8 : 6)
    }
}

export default Door