package bettermap.dungeon

import bettermap.BetterMap.Companion.mc
import bettermap.components.MapPlayer
import bettermap.components.Position
import bettermap.dungeon.MapUtils.mapX
import bettermap.dungeon.MapUtils.mapZ
import bettermap.dungeon.MapUtils.yaw
import bettermap.utils.TabList
import net.minecraft.client.network.NetworkPlayerInfo

object PlayerUpdate {

    private val colorCodeRegex = Regex("§[a-fnmz0-9]")
    private val playerRegex =
        Regex("^\\[(?<skyBlockLevel>\\d+)] (?:\\[(?<rank>\\w+)] )?(?<name>\\w+) (?:(?<emblem>[^♲Ⓑ])?(?<profileType>[♲Ⓑ])? )?\\((?<dungeonClass>\\w+)(?: (?<classLevel>\\w+))?\\)$")


    fun preloadHeads() {
        val tabEntries = TabList.getDungeonTabList() ?: return
        for (i in listOf(5, 9, 13, 17, 1)) {
            // Accessing the skin locations to load in skin
            tabEntries[i].first.locationSkin
        }
    }

    fun getPlayers() {
        val tabEntries = TabList.getDungeonTabList() ?: return
        Dungeon.dungeonTeammates.clear()
        var iconNum = 0
        for (i in listOf(5, 9, 13, 17, 1)) {
            with(tabEntries[i]) {
                val matchGroup = playerRegex.matchEntire(second)?.groups ?: return@with
                val name = matchGroup["name"]?.value ?: return@with
                if (name != "") {
                    MapPlayer(first, matchGroup).apply {
                        mc.theWorld.getPlayerEntityByName(name)?.let { setData(it) }
                        colorPrefix = second.substringBefore(name, "f").last()
                        icon = "icon-$iconNum"
                    }
                    iconNum++
                }
            }
        }
    }

    fun updatePlayers(tabEntries: List<Pair<NetworkPlayerInfo, String>>) {
        if (Dungeon.dungeonTeammates.isEmpty()) return
        // Update map icons
        var iconNum = 0
        for (i in listOf(5, 9, 13, 17, 1)) {

            val tabText = tabEntries[i].second.replace(colorCodeRegex, "")
            val matchGroup = playerRegex.matchEntire(tabText)?.groups ?: continue
            val name = matchGroup["name"]?.value ?: continue

            Dungeon.dungeonTeammates.getOrPut(name) {
                MapPlayer(tabEntries[i].first, matchGroup)
            }.apply {
                if (!playerLoaded) {
                    mc.theWorld.getPlayerEntityByName(name)?.let { setData(it) }
                }

                dead = tabText.contains("(DEAD)")
                if (dead) {
                    icon = ""
                } else {
                    icon = "icon-$iconNum"
                    iconNum++
                }
            }
        }

        val decor = MapUtils.getMapData()?.mapDecorations ?: return
        Dungeon.dungeonTeammates.forEach { (name, player) ->
            if (name == mc.thePlayer.name) {
                player.yaw = mc.thePlayer.rotationYawHead
                Position.mapPosFromWorld(mc.thePlayer.posX, mc.thePlayer.posZ).let { (x, y) ->
                    player.mapX = x
                    player.mapY = y
                }
                return@forEach
            }
            decor.entries.find { (icon, _) -> icon == player.icon }?.let { (_, vec4b) ->
                player.mapX = vec4b.mapX
                player.mapY = vec4b.mapZ
                player.yaw = vec4b.yaw
            }
        }
    }
}
