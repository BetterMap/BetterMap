import SoopyNumber from "../../guimanager/Classes/SoopyNumber"

/**
 * A utility class for storing locations of things
 * Includes builtin support for converting between locations in the world and render locations on map ect
 * Also has animation support
 * @class
 */
class Position {
    constructor(worldX, worldY, dungeonMap) {
        this.worldXRaw = new SoopyNumber(worldX) // Using the number wrapper so theres easy support for animations
        this.worldYRaw = new SoopyNumber(worldY) // See usage in MapPlayer.js

        this.dungeonMap = dungeonMap
    }

    equals(otherPosition) {
        return this.worldX === otherPosition.worldX && this.worldY === otherPosition.worldY
    }

    get worldX() {
        return this.worldXRaw.get()
    }
    get worldY() {
        return this.worldYRaw.get()
    }

    set worldX(val) {
        this.worldXRaw.set(val, 0)
    }
    set worldY(val) {
        this.worldYRaw.set(val, 0)
    }

    get mapX() {
        if (!this.dungeonMap.dungeonTopLeft) return 0
        return MathLib.map(this.worldX, -200, -8, this.dungeonMap.dungeonTopLeft[0], this.dungeonMap.dungeonTopLeft[0] + this.dungeonMap.fullRoomScaleMap * 6)
    }
    get mapY() {
        if (!this.dungeonMap.dungeonTopLeft) return 0
        return MathLib.map(this.worldY, -200, -8, this.dungeonMap.dungeonTopLeft[1], this.dungeonMap.dungeonTopLeft[1] + this.dungeonMap.fullRoomScaleMap * 6)
    }
    get arrayX() {
        return Math.round((this.worldX + 200) / 32 * 2) / 2
    }
    get arrayY() {
        return Math.round((this.worldY + 200) / 32 * 2) / 2
    }

    get arrayStr() {
        return `${this.arrayX},${this.arrayY}`
    }

    set mapX(val) {
        if (!this.dungeonMap.dungeonTopLeft) return 0
        this.worldX = MathLib.map(val, this.dungeonMap.dungeonTopLeft[0], this.dungeonMap.dungeonTopLeft[0] + this.dungeonMap.fullRoomScaleMap * 6, -200, -8)
    }
    set mapY(val) {
        if (!this.dungeonMap.dungeonTopLeft) return 0
        this.worldY = MathLib.map(val, this.dungeonMap.dungeonTopLeft[1], this.dungeonMap.dungeonTopLeft[1] + this.dungeonMap.fullRoomScaleMap * 6, -200, -8)
    }

    get renderX() {
        if (!this.dungeonMap.dungeonTopLeft) return 0
        return MathLib.map(this.worldX, -200, -8, 0, 1)
    }
    get renderY() {
        if (!this.dungeonMap.dungeonTopLeft) return 0
        return MathLib.map(this.worldY, -200, -8, 0, 1)
    }
    
    get posIndex() {
        // 200 + 0.5 to make transition between rooms smoother
        // 32 is the size of each room including the door
        const arrX = Math.floor((this.worldX + 200.5) / 32)
        const arrY = Math.floor((this.worldY + 200.5) / 32)
        
        return arrX + arrY * 6
    }

    toString() {
        return `Position[${this.arrayX}, ${this.arrayY}]`
    }
}

export default Position