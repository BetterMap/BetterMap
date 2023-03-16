package bettermap.components

class Room(val type: RoomType, val components: List<Position>, val roomID: String? = null) {
    val doors: List<Door> = listOf()
    val shape: String = findShape()
    var state: RoomState = RoomState.UNOPENED
        set(value) {
            if (value != field) {
                roomStateChange(field, value)
            }
            field = value
        }
    fun findShape(): String {
        val xTiles = components.groupBy { it.worldX }.size
        val yTiles = components.groupBy { it.worldY }.size

        return when {
            xTiles == 1 || yTiles == 1 -> "1x${components.size}"
            xTiles == 2 && yTiles == 2 -> "2x2"
            else -> "L"
        }
    }

    fun roomStateChange(old: RoomState, new: RoomState) {

    }
}