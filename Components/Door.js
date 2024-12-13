import Position from "../Utils/Position"

class Door {
    /**
     * @param {Room} type 
     * @param {Position} position 
     */
    constructor(type, position, horizontal) {
        this.type = type// Same as room type
        this.position = position

        this.horizontal = horizontal
    }

    getX() {
        return this.position.worldX
    }

    getZ() {
        return this.position.worldY
    }

    toString() {
        return `Door[(${this.getX()}, ${this.getZ()}), (${this.position.arrayX}, ${this.position.arrayY}) ${this,this.type}]`
    }
}

export default Door