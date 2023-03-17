package bettermap.utils

import bettermap.BetterMap.Companion.mc
import com.google.common.collect.ComparisonChain
import com.google.common.collect.Ordering
import net.minecraft.client.network.NetworkPlayerInfo
import net.minecraft.world.WorldSettings

object TabList {
    /**
     * Taken from [net.minecraft.client.gui.GuiPlayerTabOverlay.PlayerComparator].
     */
    private val tabListOrder = Ordering.from<NetworkPlayerInfo> { o1, o2 ->
        if (o1 == null) return@from -1
        if (o2 == null) return@from 0
        return@from ComparisonChain.start().compareTrueFirst(
            o1.gameType != WorldSettings.GameType.SPECTATOR, o2.gameType != WorldSettings.GameType.SPECTATOR
        ).compare(
            o1.playerTeam?.registeredName ?: "", o2.playerTeam?.registeredName ?: ""
        ).compare(o1.gameProfile.name, o2.gameProfile.name).result()
    }

    /**
     * Gets the tab list and the associated network player info.
     */
    fun getTabList(): List<Pair<NetworkPlayerInfo, String>> {
        return mc.thePlayer?.sendQueue?.playerInfoMap
            ?.let { tabListOrder.immutableSortedCopy(it) }
            ?.map { Pair(it, mc.ingameGUI.tabList.getPlayerName(it)) } ?: emptyList()
    }

    /**
     * Returns a valid dungeon tab list, or null if not in a dungeon or no tab list is found.
     */
    fun getDungeonTabList(): List<Pair<NetworkPlayerInfo, String>>? {
        return getTabList().let { if (it.size > 18 && it[0].second.contains("§r§b§lParty §r§f(")) it else null }
    }
}
