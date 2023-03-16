package bettermap.dungeon

import bettermap.BetterMap.Companion.mc
import bettermap.utils.Utils.equalsOneOf
import net.minecraft.item.ItemMap
import net.minecraft.util.Vec4b
import net.minecraft.world.storage.MapData

/**
 * Temp taken from FunnyMap.
 */
object MapUtils {

    /**
     * Gets the position X of a map marker from 0-127
     */
    val Vec4b.mapX: Int
        get() = (this.func_176112_b() + 128) shr 1

    /**
     * Gets the position Z of a map marker from 0-127
     */
    val Vec4b.mapZ: Int
        get() = (this.func_176113_c() + 128) shr 1

    /**
     * Gets the yaw of a map marker
     */
    val Vec4b.yaw: Float
        get() = this.func_176111_d() * 22.5f

    /**
     * Top left corner of where map draws. Similar to /Components/DungeonMap.dungeonTopLeft
     */
    var startCorner: Pair<Int, Int> = Pair(5, 5)

    /**
     * Size of a room on the map. Similar to /Components/DungeonMap.widthRoomImageMap
     */
    var mapRoomSize: Int = 16

    /**
     * Size of a room and door on the map. Similar to /Components/DungeonMap.roomAndDoorWidth
     */
    val mapTileSize: Int
        get() = mapRoomSize + 4

    /**
     * Ratio to convert map pixels to world blocks. (mapRoomSize + mapDoorSize) / blocks
     */
    var coordMultiplier: Double = 0.625
    var calibrated: Boolean = false

    fun getMapData(): MapData? {
        val map = mc.thePlayer?.inventory?.getStackInSlot(8) ?: return null
        if (map.item !is ItemMap || !map.displayName.contains("Magical Map")) return null
        return (map.item as ItemMap).getMapData(map, mc.theWorld)
    }

    /**
     * Calibrates map metrics based on the size and location of the entrance room.
     */
    fun calibrateMap(): Boolean {
        val (start, size) = findEntranceCorner()
        if (size.equalsOneOf(16, 18)) {
            mapRoomSize = size
            val startX = start and 127
            val startZ = start shr 7
            startCorner = Pair(startX % mapTileSize, startZ % mapTileSize)
            coordMultiplier = (mapTileSize / Dungeon.roomSize).toDouble()
            return true
        }
        return false
    }

    /**
     * Finds the starting index of the entrance room as well as the size of the room.
     */
    private fun findEntranceCorner(): Pair<Int, Int> {
        var start = 0
        var currLength = 0
        getMapData()?.colors?.forEachIndexed { index, byte ->
            if (byte.toInt() == 30) {
                if (currLength == 0) start = index
                currLength++
            } else {
                if (currLength >= 16) {
                    return Pair(start, currLength)
                }
                currLength = 0
            }
        }
        return Pair(start, currLength)
    }
}