class Position {
    constructor(worldX, worldY, dungeonMap) {
        this.worldX = worldX
        this.worldY = worldY


        this.dungeonMap = dungeonMap
    }

    equals(otherPosition) {
        return this.worldX === otherPosition.worldX && this.worldY === otherPosition.worldY
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
        return ~~((this.worldX + 200) / 32);
    }
    get arrayY() {
        return ~~((this.worldY + 200) / 32);
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
}

export default Position