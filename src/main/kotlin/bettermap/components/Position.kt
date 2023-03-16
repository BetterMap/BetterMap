package bettermap.components

import bettermap.dungeon.Dungeon
import bettermap.dungeon.MapUtils
import kotlin.math.roundToInt

/**
 * A class that combines storing a world position, map position, and dungeon index (array) position.
 * Substitutes as /Utils/Position.js.
 */
class Position(val worldX: Double, val worldY: Double) {
    val mapPos: Pair<Int, Int>
        get() = mapPosFromWorld(worldX, worldY)

    val arrayPos: Pair<Int, Int>
        get() = arrayPosFromWorld(worldX, worldY)

    companion object {
        fun mapPosFromWorld(x: Double, y: Double): Pair<Int, Int> {
            return Pair(
                ((x - Dungeon.startX + Dungeon.roomSize) * MapUtils.coordMultiplier + MapUtils.startCorner.first).roundToInt(),
                ((y - Dungeon.startY + Dungeon.roomSize) * MapUtils.coordMultiplier + MapUtils.startCorner.second).roundToInt()
            )
        }

        fun arrayPosFromWorld(x: Double, y: Double): Pair<Int, Int> {
            return Pair(
                ((x - Dungeon.startX) / Dungeon.roomSize).toInt(),
                ((y - Dungeon.startY) / Dungeon.roomSize).toInt()
            )
        }

        fun arrayPosFromMap(x: Int, y: Int): Pair<Int, Int> {
            return Pair(
                (x - MapUtils.startCorner.first) / MapUtils.mapTileSize,
                (y - MapUtils.startCorner.second) / MapUtils.mapTileSize
            )
        }
    }
}
