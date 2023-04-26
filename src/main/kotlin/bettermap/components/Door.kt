package bettermap.components

class Door(
    override var type: RoomType,
    override val position: Position,
    val horizontal: Boolean
) : Tile()
