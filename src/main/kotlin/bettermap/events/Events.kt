package bettermap.events

import net.minecraft.network.Packet
import net.minecraftforge.fml.common.eventhandler.Event

class ReceivePacketEvent(val packet: Packet<*>) : Event()
