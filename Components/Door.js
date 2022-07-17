class Door {
    /**
     * @param {Room} type 
     * @param {Position} position 
     */
    constructor(type, position, horisontal) {
        this.type = type
        this.position = position

        this.horisontal = horisontal
    }


    render(graphics) {
        graphics.setColor(this.getRenderColor())

        graphics.fillRect(this.position.worldX, this.position.worldY,)

    }
}

export default Door