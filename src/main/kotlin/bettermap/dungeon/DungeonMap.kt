package bettermap.dungeon

import bettermap.components.*

class DungeonMap(mapColors: ByteArray) {
    private var centerColors: ByteArray = ByteArray(121)
    private var sideColors: ByteArray = ByteArray(121)
    private val cacheTiles: Array<Tile?> = Array(121) { null }

    init {
        val halfTile = MapUtils.mapTileSize / 2
        val halfRoom = MapUtils.mapRoomSize / 2
        val startX = MapUtils.startCorner.first + halfRoom
        val startY = MapUtils.startCorner.second + halfRoom

        for (y in 0..10) {
            for (x in 0..10) {
                val mapX = startX + x * halfTile
                val mapY = startY + y * halfTile

                centerColors[y * 11 + x] = mapColors[mapY * 128 + mapX]

                val sideIndex = if (x % 2 == 0 && y % 2 == 0) {
                    val topX = mapX - halfRoom
                    val topY = mapY - halfRoom
                    topY * 128 + topX
                } else {
                    val horizontal = y % 2 == 1
                    if (horizontal) {
                        mapY * 128 + mapX - 4
                    } else {
                        (mapY - 4) * 128 + mapX
                    }
                }

                sideColors[y * 11 + x] = mapColors[sideIndex]
            }
        }
    }

    fun getTile(arrayX: Int, arrayY: Int): Tile {
        val index = arrayY * 11 + arrayX
        if (index !in cacheTiles.indices) return Empty()

        if (cacheTiles[index] == null) {
            cacheTiles[index] = scanTile(arrayX, arrayY)
        }

        return cacheTiles[index] ?: Empty()
    }

    private fun scanTile(arrayX: Int, arrayY: Int): Tile {
        val centerColor = centerColors[arrayY * 11 + arrayX].toInt()
        val sideColor = sideColors[arrayY * 11 + arrayX].toInt()
        val position = Position.topLeftPosFromArray(arrayX, arrayY)

        if (centerColor == 0) return Empty()

        if (arrayX % 2 == 0 && arrayY % 2 == 0) {
            val type = roomColors[sideColor] ?: return Empty()
            return Room(type, position).apply {
                when (centerColor) {
                    34 -> state = RoomState.CLEARED

                    30 -> {
                        state = RoomState.COMPLETED
                        currentSecrets = maxSecrets
                    }

                    18 -> if (type != RoomType.BLOOD) {
                        state = RoomState.FAILED
                    }

                    else -> state = if (type == RoomType.UNKNOWN) RoomState.ADJACENT else RoomState.OPENED
                }
            }
        } else {
            val horizontal = arrayY % 2 == 1

            val type = roomColors.getOrElse(centerColor) {
                if (centerColor == 119) RoomType.BLACK else RoomType.NORMAL
            }

            return if (sideColor == 0) {
                Door(type, position, horizontal)
            } else {
                Room(type, position)
            }
        }
    }

    companion object {
        val roomColors: Map<Int, RoomType> = mapOf(
            30 to RoomType.SPAWN,
            66 to RoomType.PUZZLE,
            82 to RoomType.FAIRY,
            18 to RoomType.BLOOD,
            62 to RoomType.TRAP,
            63 to RoomType.NORMAL,
            74 to RoomType.MINIBOSS,
            85 to RoomType.UNKNOWN
        )
    }
}
