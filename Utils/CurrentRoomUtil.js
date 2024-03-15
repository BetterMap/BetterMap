
/**
 * NOTE: check for roomid is falsy before using
 * @returns {String} the current room id
 */
export const getCurrentRoomId = () => {
    if (Scoreboard.getLines().length === 0) return undefined
    let id = Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1).getName().trim().split(" ").pop()

    if (!id.includes(",")) return undefined  // Not id, eg id not on scoreboard

    return id
}

