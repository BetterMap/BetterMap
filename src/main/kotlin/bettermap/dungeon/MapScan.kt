package bettermap.dungeon

import bettermap.components.Door
import bettermap.components.Room

object MapScan {

    fun getDungeonMap(): DungeonMap? {
        if (!MapUtils.calibrated) return null
        return MapUtils.getMapData()?.colors?.let {
            DungeonMap(it)
        }
    }

    fun updateRoomsFromMap(map: DungeonMap) {
        val added = Array(11) { BooleanArray(11) }
        for (y in 0..5) {
            for (x in 0..5) {
                val arrX = x * 2
                val arrY = y * 2
                val tile = map.getTile(arrX, arrY)

                if (!added[arrX][arrY] && tile is Room) {

                   updateRoomConnections(map, tile)

                    added[arrX][arrY] = true
                    tile.components.forEach { added[it.first][it.second] = true }

                    Dungeon.rooms["$arrX,$arrY"] = Dungeon.rooms.getOrElse("$arrX,$arrY") { tile }.apply {
                        components.clear()
                        components.addAll(tile.components)
                    }
                }
            }
        }
    }

    /**
     * Adds connected rooms and doors to the room
     */
    fun updateRoomConnections(map: DungeonMap, room: Room) {
        val pos = room.position.arrayPos
        room.components.clear()
        room.doors.clear()
        room.components.add(pos)
        val queue = mutableListOf(pos)

        while (queue.isNotEmpty()) {
            val (currentX, currentY) = queue.removeFirst()

            directions.forEach { (dx, dy) ->

                val newPos = Pair(currentX + dx, currentY + dy)
                val tile = map.getTile(newPos.first, newPos.second)

                if (tile is Room) {
                    if (!room.components.contains(newPos)) {
                        room.components.add(newPos)
                        queue.add(newPos)
                    }
                } else if (tile is Door) {
                    // why the fuck do we need to add doors
                    room.doors.add(tile)
                    Dungeon.doors["${pos.first},${pos.second}"] = tile
                }
            }
        }
    }

    val directions = arrayOf(Pair(1, 0), Pair(0, 1), Pair(-1, 0), Pair(0, -1))
}
