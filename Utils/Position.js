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
        return MathLib.map(this.worldX, -200, -8, this.dungeonMap.dungeonTopLeft[0], this.dungeonMap.dungeonTopLeft[0] + this.dungeonMap.fullRoomScaleMap * 6)
    }
    get mapY() {
        return MathLib.map(this.worldY, -200, -8, this.dungeonMap.dungeonTopLeft[1], this.dungeonMap.dungeonTopLeft[1] + this.dungeonMap.fullRoomScaleMap * 6)
    }
    set mapX(val) {
        this.worldX = MathLib.map(val, this.dungeonMap.dungeonTopLeft[0], this.dungeonMap.dungeonTopLeft[0] + this.dungeonMap.fullRoomScaleMap * 6, -200, -8)
    }
    set mapY(val) {
        this.worldY = MathLib.map(val, this.dungeonMap.dungeonTopLeft[1], this.dungeonMap.dungeonTopLeft[1] + this.dungeonMap.fullRoomScaleMap * 6, -200, -8)
    }

    get renderX() {
        //TODO: logic
    }
    get renderX() {
        //TODO: logic
    }
}

export default Position