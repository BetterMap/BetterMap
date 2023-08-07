package bettermap.dungeon

import bettermap.BetterMap.Companion.mc
import bettermap.components.Door
import bettermap.components.MapPlayer
import bettermap.components.Position
import bettermap.components.Room
import bettermap.components.roomdata.DungeonRoomData
import bettermap.events.ReceivePacketEvent
import bettermap.utils.Location.inDungeons
import net.minecraft.network.play.server.S02PacketChat
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent
import net.minecraftforge.fml.common.gameevent.TickEvent
import net.minecraftforge.fml.common.gameevent.TickEvent.ClientTickEvent

/**
 * Holds all global variables used. Specific functions should be delegated into their own classes inside the dungeon package.
 */
object Dungeon {
    /**
     * Size of a room and door in blocks
     */
    const val roomSize: Int = 32

    /**
     * Top left corner of dungeon
     */
    const val startX: Int = -200
    const val startY: Int = -200

    /**
     * Map of rooms with array coordinates "x,y"
     */
    val rooms: MutableMap<String, Room> = mutableMapOf()
    val doors: MutableMap<String, Door> = mutableMapOf()

    // Update player's location
    var lastRoomID = ""
    var lastPosChange = 0L
    var lastPosition = Pair(-1, -1)

    // Player name to map player class
    val dungeonTeammates = mutableMapOf<String, MapPlayer>()
    // The latest map from hotbar
    var renderMap: DungeonMap? = null

    @SubscribeEvent
    fun onTick(event: ClientTickEvent) {
        if (event.phase != TickEvent.Phase.END) return
        if (!inDungeons) return
        if (!MapUtils.calibrated) {
            MapUtils.calibrateMap()
            return
        }
        val map = MapScan.getDungeonMap() ?: return
        renderMap = map
        MapScan.updateRoomsFromMap(map)
        updateCurrentRoom()
    }

    @SubscribeEvent
    fun onChatPacket(event: ReceivePacketEvent) {
        if (event.packet !is S02PacketChat) return
        if (event.packet.type.toInt() == 2 || !inDungeons) return
        when (event.packet.chatComponent.unformattedText) {
            "Starting in 4 seconds." -> PlayerUpdate.preloadHeads()
            "[NPC] Mort: Here, I found this map when I first entered the dungeon." -> {
                PlayerUpdate.getPlayers()
            }
        }
    }

    fun updateCurrentRoom() {
        val pos = Position.arrayPosFromWorld(mc.thePlayer.posX, mc.thePlayer.posZ)

        if (pos == lastPosition && System.currentTimeMillis() - lastPosChange > 1000) {

            val id = PositionUtils.getCurrentRoomID() ?: return

            if (id != lastRoomID) {
                rooms.values.find {
                    it.components.contains(pos)
                }?.run {
                    roomID = id
                    data = DungeonRoomData.getDataFromID(id)
                }
                lastRoomID = id
            }
        } else {
            lastPosition = pos
            lastPosChange = System.currentTimeMillis()
        }
    }

    fun reset() {
        rooms.clear()
        doors.clear()
        lastPosition = Pair(-1, -1)
    }

    @SubscribeEvent
    fun onPacket(event: ReceivePacketEvent) {
    }
}
