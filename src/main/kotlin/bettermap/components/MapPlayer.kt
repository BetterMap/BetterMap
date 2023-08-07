package bettermap.components

import bettermap.BetterMap.Companion.scope
import bettermap.utils.APIUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import net.minecraft.client.network.NetworkPlayerInfo
import net.minecraft.entity.player.EntityPlayer
import net.minecraft.entity.player.EnumPlayerModelParts

data class MapPlayer(val networkPlayerInfo: NetworkPlayerInfo, val tabTextInfo: MatchGroupCollection) {

    val skyBlockLevel = tabTextInfo["skyBlockLevel"]?.value?.toIntOrNull() ?: 0
    val rank = tabTextInfo["rank"]?.value ?: ""
    val emblem = tabTextInfo["emblem"]?.value ?: ""
    val name = tabTextInfo["name"]?.value ?: ""
    val profileType = tabTextInfo["profileType"]?.value ?: ""
    val dungeonClass = tabTextInfo["dungeonClass"]?.value ?: ""
    val classLevel = tabTextInfo["classLevel"]?.value?.toIntOrNull() ?: 0


    /** Minecraft formatting code for the player's name */
    var colorPrefix = 'f'
    /** The player's name with formatting code */
    val formattedName: String
        get() = "§$colorPrefix$name"

    var mapX = 0
    var mapY = 0
    var yaw = 0f

    /** Has information from player entity been loaded */
    var playerLoaded = false
    var icon = ""
    var renderHat = false
    var dead = false
    var uuid = ""

    /** Stats for compiling player tracker information */
    var startingSecrets = 0
    var lastRoom = ""
    var lastTime = 0L
    var roomVisits: MutableList<Pair<Long, String>> = mutableListOf()

    /** Set player data that requires entity to be loaded */
    fun setData(player: EntityPlayer) {
        renderHat = player.isWearing(EnumPlayerModelParts.HAT)
        uuid = player.uniqueID.toString()
        playerLoaded = true
        scope.launch(Dispatchers.IO) {
            startingSecrets = APIUtils.getSecrets(uuid)
        }
    }
}
