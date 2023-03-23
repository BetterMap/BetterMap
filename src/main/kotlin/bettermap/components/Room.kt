package bettermap.components

class Room(val type: RoomType, val components: List<Position>, val roomID: String? = null) {
    val doors: List<Door> = listOf()
    val shape: RoomShape = findShape()
    var state: RoomState = RoomState.UNOPENED
        set(value) {
            if (value != field) {
                roomStateChange(field, value)
            }
            field = value
        }

    fun findShape(): RoomShape {
        val xTiles = components.groupBy { it.worldX }.size
        val yTiles = components.groupBy { it.worldY }.size

        return when {
            xTiles == 1 || yTiles == 1 -> RoomShape.valueOf("S1x${components.size}")
            xTiles == 2 && yTiles == 2 -> RoomShape.S2x2
            else -> RoomShape.SL
        }
    }

    fun roomStateChange(old: RoomState, new: RoomState) {

    }
}
