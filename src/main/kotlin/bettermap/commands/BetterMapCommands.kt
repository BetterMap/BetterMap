package bettermap.commands

import bettermap.BetterMap.Companion.mc
import bettermap.components.*
import bettermap.dungeon.Dungeon
import bettermap.dungeon.MapScan
import bettermap.dungeon.MapUtils
import bettermap.dungeon.PositionUtils
import cc.polyfrost.oneconfig.libs.universal.UChat
import net.minecraft.command.CommandBase
import net.minecraft.command.ICommandSender
import net.minecraft.util.BlockPos

class BetterMapCommands : CommandBase() {

    override fun getCommandName(): String = "bettermap"

    override fun getCommandAliases(): List<String> = listOf("bm", "bmap")

    override fun getCommandUsage(sender: ICommandSender): String = "/$commandName"

    override fun getRequiredPermissionLevel(): Int = 0

    override fun processCommand(sender: ICommandSender, args: Array<String>) {
        if (args.isEmpty()) return
        when (args[0]) {
            "calibrate" -> {
                // Calibrates map. Should run before doing anything.
                MapUtils.calibrated = MapUtils.calibrateMap()
                UChat.chat("Calibrating Map: ${MapUtils.calibrated}")
            }

            "rooms" -> {
                // Prints out all detected rooms and positions
                UChat.chat(Dungeon.rooms.entries.joinToString { (position, room) ->
                    "name: ${room.data?.name} $position: ${room.position.arrayPos}, components: ${room.components.joinToString { "[${it.first}, ${it.second}]" }}"
                })
            }

            "current" -> {
                // Prints out current player room and location
                UChat.chat(PositionUtils.getCurrentRoomID().toString())
                val pos = Position.arrayPosFromWorld(mc.thePlayer.posX, mc.thePlayer.posZ)
                UChat.chat(pos)
                Dungeon.rooms.values.find {
                    it.components.contains(pos)
                }?.data?.let {
                    UChat.chat(it)
                }
            }

            "map" -> {
                // Prints out a chat version of the current scanned map
                val map = MapScan.getDungeonMap() ?: return
                for (y in 0..10) {
                    val row = Array<Tile>(11) { Empty() }
                    for (x in 0..10) {
                        row[x] = map.getTile(x, y)
                    }
                    UChat.chat(row.joinToString(prefix = "[", postfix = "]") { tile ->
                        when (tile) {
                            is Door -> "D:${tile.type.name}"
                            is Room -> "R:${tile.type.name}"
                            else -> "Empty"
                        }.padEnd(10)
                    })
                }
            }
        }
    }

    override fun addTabCompletionOptions(
        sender: ICommandSender,
        args: Array<String>,
        pos: BlockPos
    ): MutableList<String> {
        if (args.size == 1) {
            return getListOfStringsMatchingLastWord(args, listOf("calibrate", "rooms", "current", "map"))
        }
        return super.addTabCompletionOptions(sender, args, pos)
    }
}
