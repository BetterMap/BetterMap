package bettermap.commands

import net.minecraft.command.CommandBase
import net.minecraft.command.ICommandSender

class BetterMapCommands : CommandBase() {

    override fun getCommandName(): String = ""

    override fun getCommandAliases(): List<String> = listOf()

    override fun getCommandUsage(sender: ICommandSender): String = "/$commandName"

    override fun getRequiredPermissionLevel(): Int = 0

    override fun processCommand(sender: ICommandSender, args: Array<String>) {

    }
}
