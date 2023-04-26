package bettermap.utils

import bettermap.BetterMap.Companion.mc
import bettermap.events.ReceivePacketEvent
import net.minecraft.network.play.server.S02PacketChat
import net.minecraft.util.StringUtils
import net.minecraftforge.event.world.WorldEvent
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent
import net.minecraftforge.fml.common.gameevent.TickEvent
import net.minecraftforge.fml.common.network.FMLNetworkEvent

object Location {

    private var onHypixel = false
    var inSkyblock = false
    var inDungeons = false
    var dungeonFloor = -1
    var inBoss = false

    private var tickCount = 0

    private val entryMessages = listOf(
        "[BOSS] Bonzo: Gratz for making it this far, but I’m basically unbeatable.",
        "[BOSS] Scarf: This is where the journey ends for you, Adventurers.",
        "[BOSS] The Professor: I was burdened with terrible news recently...",
        "[BOSS] Thorn: Welcome Adventurers! I am Thorn, the Spirit! And host of the Vegan Trials!",
        "[BOSS] Livid: Welcome, you arrive right on time. I am Livid, the Master of Shadows.",
        "[BOSS] Sadan: So you made it all the way here... Now you wish to defy me? Sadan?!",
        "[BOSS] Maxor: WELL WELL WELL LOOK WHO'S HERE!"
    )

    @SubscribeEvent
    fun onTick(event: TickEvent.ClientTickEvent) {
        if (event.phase != TickEvent.Phase.START || mc.theWorld == null) return
        tickCount++
        if (tickCount % 20 != 0) return

        inSkyblock = onHypixel && mc.theWorld.scoreboard?.getObjectiveInDisplaySlot(1)?.name == "SBScoreboard"

        if (!inDungeons) {
            Scoreboard.getLines().find {
                Scoreboard.cleanLine(it).run {
                    contains("The Catacombs (") && !contains("Queue")
                }
            }?.let {
                inDungeons = true
                dungeonFloor = it.substringBefore(")").lastOrNull()?.digitToIntOrNull() ?: 0
            }
        }

        tickCount = 0
    }

    @SubscribeEvent
    fun onChat(event: ReceivePacketEvent) {
        if (event.packet !is S02PacketChat) return
        if (event.packet.type.toInt() == 2 || !inDungeons) return
        val text = StringUtils.stripControlCodes(event.packet.chatComponent.unformattedText)
        if (entryMessages.any { it == text }) inBoss = true
    }

    @SubscribeEvent
    fun onConnect(event: FMLNetworkEvent.ClientConnectedToServerEvent) {
        onHypixel = mc.runCatching {
            !event.isLocal && ((thePlayer?.clientBrand?.lowercase()?.contains("hypixel")
                ?: currentServerData?.serverIP?.lowercase()?.contains("hypixel")) == true)
        }.getOrDefault(false)
    }

    @SubscribeEvent
    fun onWorldUnload(event: WorldEvent.Unload) {
        inDungeons = false
        dungeonFloor = -1
        inBoss = false
    }

    @SubscribeEvent
    fun onDisconnect(event: FMLNetworkEvent.ClientDisconnectionFromServerEvent) {
        onHypixel = false
        inSkyblock = false
        inDungeons = false
        dungeonFloor = -1
        inBoss = false
    }
}
