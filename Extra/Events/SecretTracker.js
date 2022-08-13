import { registerForge } from "../../Utils/forgeEvents"
import EventManager from "./EventManager"

let tempItemIdLocs = new Map()
let collectedLocations = new Set()

registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, undefined, (e) => {
    if (event.entity instanceof EntityItem) {
        let e = new Entity(event.entity)
        let pos = [e.getX(), e.getY(), e.getZ()]

        tempItemIdLocs.set(event.entity[m.getEntityId.Entity](), pos)
    }
})

register("soundPlay", (pos, name, volume, pitch, categoryName, event) => {
    let loc = [pos.x, pos.y, pos.z]
    let nameSplitted = name.split(".")
    if (name === "mob.enderdragon.hit") { //etherwarp
        EventManager.triggerEvent(EventManager.EVENT_ETHERWARP, loc[0], loc[1], loc[2])
    }
    if (name === "random.explode" && pitch !== 1) { //tnt OR MIGHT BE spirit scepter
        this.addRecordingPoint("tnts", loc)
        EventManager.triggerEvent(EventManager.EVENT_SUPERBOOM, loc[0], loc[1], loc[2])
    }
    if (name === "mob.bat.death") {
        //TODO: detect bat spawn location thru entity spawn world event
        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "bat", loc[0], loc[1], loc[2])
    }
    if (nameSplitted[0] === "dig") { //mining block
        EventManager.triggerEvent(EventManager.EVENT_STONK, loc[0], loc[1], loc[2])
    }
})

register("worldLoad", () => {
    tempItemIdLocs.clear()
    collectedLocations.clear()
})

register("playerInteract", (action, position, event) => {
    if (action.toString() !== "RIGHT_CLICK_BLOCK") return

    let pos = [Player.lookingAt().getX() + 0.5, Player.lookingAt().getY(), Player.lookingAt().getZ() + 0.5]

    let id = Player.lookingAt().getType().getID()

    if (id === 54) { //chest
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "chest", pos[0], pos[1], pos[2])
    }
    if (id === 146) { //trapped chest (mimic?)
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "trap_chest", pos[0], pos[1], pos[2])
    }
    if (id === 144) { //skull (wither ess or redstone key) //TODO: detect difference with redstone key
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "wither", pos[0], pos[1], pos[2])
    }
    if (id === 69) { //lever
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETSTEP, "lever", pos[0], pos[1], pos[2])
    }
})

register("packetReceived", (packet) => {
    let pos = this.tempItemIdLocs.get(packet[m.getCollectedItemEntityID]())

    EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "item", pos[0], pos[1], pos[2])
}).setPacketClasses([net.minecraft.network.play.server.S0DPacketCollectItem])