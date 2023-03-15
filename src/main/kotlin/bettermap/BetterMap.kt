package bettermap

import bettermap.commands.BetterMapCommands
import net.minecraft.client.Minecraft
import net.minecraftforge.client.ClientCommandHandler
import net.minecraftforge.fml.common.Mod
import net.minecraftforge.fml.common.event.FMLInitializationEvent
import net.minecraftforge.fml.common.event.FMLLoadCompleteEvent
import net.minecraftforge.fml.common.event.FMLPreInitializationEvent

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
    }

    @Mod.EventHandler
    fun postInit(event: FMLLoadCompleteEvent) {
    }

    companion object {
        const val MOD_ID = "bettermap"
        const val MOD_NAME = "BetterMap"
        const val MOD_VERSION = "1.0-forge"

        val mc: Minecraft = Minecraft.getMinecraft()
    }
}
