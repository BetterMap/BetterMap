package bettermap.components

import bettermap.components.roomdata.RoomData

class Room(
    override var type: RoomType,
    override val position: Position,
    val components: MutableList<Pair<Int, Int>> = mutableListOf(),
    var roomID: String? = null,
) : Tile() {
    val doors: MutableList<Door> = mutableListOf()
    val shape: RoomShape = findShape()
    var data: RoomData? = null
    var currentSecrets = 0
    var maxSecrets = 10
    var state: RoomState = RoomState.UNOPENED
        set(value) {
            if (value != field) {
                roomStateChange(field, value)
            }
            field = value
        }

    fun findShape(): RoomShape {
        val xTiles = components.groupBy { it.first }.size
        val yTiles = components.groupBy { it.second }.size

        return when {
            xTiles == 1 || yTiles == 1 -> RoomShape.valueOf("S1x${components.size}")
            xTiles == 2 && yTiles == 2 -> RoomShape.S2x2
            else -> RoomShape.SL
        }
    }

    fun roomStateChange(old: RoomState, new: RoomState) {

    }
}
