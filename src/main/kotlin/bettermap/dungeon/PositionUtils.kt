package bettermap.dungeon

import bettermap.components.roomdata.DungeonRoomData
import bettermap.components.roomdata.RoomData
import bettermap.utils.Scoreboard

object PositionUtils {
    fun getCurrentRoomID(): String? {
        val line = Scoreboard.getLines().lastOrNull()?.trim()?.split(" ")?.lastOrNull() ?: return null
        return if (line.contains(",")) line else null
    }

    fun getCurrentRoomData(): RoomData? {
        return getCurrentRoomID()?.let { DungeonRoomData.getDataFromID(it) }
    }
}
