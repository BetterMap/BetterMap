import SoopyNumber from "../../guimanager/Classes/SoopyNumber"
import Position from "./Position"

/**
 * Extension of Position which only allows arrayX and arrayY to be integer values
 */
export default class RoomComponent extends Position {
    constructor(worldX, worldY, dungeonMap) {
        this.worldXRaw = new SoopyNumber(worldX) // Using the number wrapper so theres easy support for animations
        this.worldYRaw = new SoopyNumber(worldY) // See usage in MapPlayer.js

        this.dungeonMap = dungeonMap
    }

    static fromArrayPos(x, y) {
        return new RoomComponent(-185 + x * 32, -185 + y * 32)
    }

    get arrayX() {
        return Math.floor((this.worldX + 185) / 32)
    }
    get arrayY() {
        return Math.floor((this.worldY + 185) / 32)
    }

    toString() {
        return `(${this.arrayX},${this.arrayY})`
    }
}