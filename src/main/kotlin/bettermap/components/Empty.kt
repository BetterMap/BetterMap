package bettermap.components

class Empty(
    override val type: RoomType = RoomType.UNKNOWN,
    override val position: Position = Position(0.0, 0.0)
) : Tile()
