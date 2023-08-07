package bettermap

import bettermap.commands.BetterMapCommands
import bettermap.components.roomdata.DungeonRoomData
import bettermap.dungeon.Dungeon
import bettermap.utils.Location
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.asCoroutineDispatcher
import net.minecraft.client.Minecraft
import net.minecraftforge.client.ClientCommandHandler
import net.minecraftforge.common.MinecraftForge
import net.minecraftforge.fml.common.Mod
import net.minecraftforge.fml.common.event.FMLInitializationEvent
import net.minecraftforge.fml.common.event.FMLLoadCompleteEvent
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent
import java.util.concurrent.Executors

@Mod(
    modid = BetterMap.MOD_ID, name = BetterMap.MOD_NAME, version = BetterMap.MOD_VERSION
)
class BetterMap {
    @Mod.EventHandler
    fun preInit(event: FMLPreInitializationEvent) {
    }

    @Mod.EventHandler
    fun onInit(event: FMLInitializationEvent) {
        ClientCommandHandler.instance.registerCommand((BetterMapCommands()))
        listOf(
            Dungeon, Location
        ).forEach(MinecraftForge.EVENT_BUS::register)
        DungeonRoomData // Initialize loading room data
    }

    @Mod.EventHandler
    fun postInit(event: FMLLoadCompleteEvent) {
    }

    companion object {
        const val MOD_ID = "bettermap"
        const val MOD_NAME = "BetterMap"
        const val MOD_VERSION = "1.0-forge"

        val mc: Minecraft = Minecraft.getMinecraft()
        val gson: Gson = GsonBuilder().disableHtmlEscaping().setPrettyPrinting().create()
        val scope = CoroutineScope(Executors.newFixedThreadPool(4).asCoroutineDispatcher())
    }
}
