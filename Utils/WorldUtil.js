getRotation(x, y, width, height, roofY) {
    let currRoomData = this.getCurrentRoomData()
    if (!currRoomData) return -1

    if (currRoomData.shape !== "L") {
        if (this.getTopBlockAt(x, y, roofY) === 11) return 0
        if (this.getTopBlockAt(x + width, y, roofY) === 11) return 1
        if (this.getTopBlockAt(x + width, y + height, roofY) === 11) return 2
        if (this.getTopBlockAt(x, y + height, roofY) === 11) return 3
    }
    else {
        let one = this.getTopBlockAt2(x + width / 2 + 1, y + height / 2, roofY)
        let two = this.getTopBlockAt2(x + width / 2 - 1, y + height / 2, roofY)
        let three = this.getTopBlockAt2(x + width / 2, y + height / 2 + 1, roofY)
        let four = this.getTopBlockAt2(x + width / 2, y + height / 2 - 1, roofY)

        if (one === 0 && three === 0) return 0
        if (two === 0 && three === 0) return 1
        if (one === 0 && four === 0) return 3
        if (two === 0 && four === 0) return 2// 3 IS SO TOXIK HGOLY HEL I HATE L SHAPE ROOMS WHY DO THIS TO ME
    }

    return -1
}

getBlockIdAt(x, y, z) {
    if (this.setAirLocs?.has(x + "," + z)) return 0

    return World.getBlockAt(new BlockPos(x, y, z)).type.getID()
}