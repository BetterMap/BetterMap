package bettermap.components

import bettermap.dungeon.Dungeon
import bettermap.dungeon.MapUtils
import kotlin.math.roundToInt

/**
 * A class that combines storing a world position, map position, and dungeon index (array) position.
 * Substitutes as /Utils/Position.js.
 */
class Position(val worldX: Double, val worldY: Double) {

    /**
     * Minecraft world position. Ranged 192 blocks positive from [Dungeon.startX] and [Dungeon.startY].
     */
    val worldPos: Pair<Double, Double> = Pair(worldX, worldY)

    /**
     * Position on the dungeon map item. Ranged from 1-128 inclusive.
     */
    val mapPos: Pair<Int, Int>
        get() = mapPosFromWorld(worldX, worldY)

    /**
     * Array position of dungeon map. Each room or door is one index. Ranged from 0-10 inclusive.
     */
    val arrayPos: Pair<Int, Int>
        get() = arrayPosFromWorld(worldX, worldY)

    companion object {
        fun mapPosFromWorld(x: Double, y: Double): Pair<Int, Int> {
            return Pair(
                ((x - Dungeon.startX) * MapUtils.coordMultiplier + MapUtils.startCorner.first).roundToInt(),
                ((y - Dungeon.startY) * MapUtils.coordMultiplier + MapUtils.startCorner.second).roundToInt()
            )
        }

        fun arrayPosFromWorld(x: Double, y: Double): Pair<Int, Int> {
            return Pair(
                ((x - Dungeon.startX) / Dungeon.roomSize).toInt() * 2,
                ((y - Dungeon.startY) / Dungeon.roomSize).toInt() * 2
            )
        }

        fun arrayPosFromMap(x: Int, y: Int): Pair<Int, Int> {
            return Pair(
                (x - MapUtils.startCorner.first) / MapUtils.mapTileSize,
                (y - MapUtils.startCorner.second) / MapUtils.mapTileSize
            )
        }

        fun worldPosFromMap(x: Int, y: Int): Pair<Double, Double> {
            return Pair(
                Dungeon.startX + (x - MapUtils.startCorner.first) * Dungeon.roomSize / MapUtils.mapTileSize.toDouble(),
                Dungeon.startY + (y - MapUtils.startCorner.second) * Dungeon.roomSize / MapUtils.mapTileSize.toDouble()
            )
        }

        fun topLeftPosFromArray(x: Int, y: Int): Position {
            return Position(
                Dungeon.startX + x * Dungeon.roomSize.toDouble(),
                Dungeon.startY + y * Dungeon.roomSize.toDouble()
            )
        }
    }
}
