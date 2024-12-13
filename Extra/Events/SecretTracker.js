import { registerForge } from "../../Utils/forgeEvents"
import EventManager from "./EventManager"
const EntityItem = Java.type("net.minecraft.entity.item.EntityItem")

let tempItemIdLocs = new Map()
let collectedLocations = new Set()

// TODO: add a check that all of these events only trigger when inside dungeons

registerForge(net.minecraftforge.event.entity.EntityJoinWorldEvent, undefined, (event) => {
    if (event.entity instanceof EntityItem) {
        let e = new Entity(event.entity)
        let pos = [e.getX(), e.getY(), e.getZ()]
        //                              getEntityId
        tempItemIdLocs.set(event.entity.func_145782_y(), pos)
    }
})

register("soundPlay", (pos, name, volume, pitch, categoryName, event) => {
    let loc = [pos.x, pos.y, pos.z]
    let nameSplitted = name.split(".")
    if (name === "mob.enderdragon.hit") { // Etherwarp
        EventManager.triggerEvent(EventManager.EVENT_ETHERWARP, loc[0], loc[1], loc[2])
    }
    if (name === "random.explode" && pitch !== 1) { // Tnt OR MIGHT BE spirit scepter
        EventManager.triggerEvent(EventManager.EVENT_SUPERBOOM, loc[0], loc[1], loc[2])
    }
    if (name === "mob.bat.death") {
        // TODO: detect bat spawn location thru entity spawn world event
        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "bat", loc[0], loc[1], loc[2])
    }
    if (nameSplitted[0] === "dig") { // Mining block
        EventManager.triggerEvent(EventManager.EVENT_STONK, loc[0], loc[1], loc[2])
    }
})

register("worldLoad", () => {
    tempItemIdLocs.clear()
    collectedLocations.clear()
})

register("playerInteract", (action, position, event) => {
    if (action.toString() !== "RIGHT_CLICK_BLOCK") return

    let pos = [Player.lookingAt().getX(), Player.lookingAt().getY(), Player.lookingAt().getZ()]

    let id = Player.lookingAt().getType().getID()

    if (id === 54) { // Chest
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "chest", pos[0], pos[1], pos[2])
    }
    if (id === 146) { // Trapped chest (mimic?)
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "trap_chest", pos[0], pos[1], pos[2])
    }
    if (id === 144) { // Skull (wither ess or redstone key) //TODO: detect difference with redstone key
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "wither", pos[0], pos[1], pos[2])
    }
    if (id === 69) { // Lever
        if (collectedLocations.has(pos.join(","))) return
        collectedLocations.add(pos.join(","))

        EventManager.triggerEvent(EventManager.EVENT_SECRETSTEP, "lever", pos[0], pos[1], pos[2])
    }
})

register("packetReceived", (packet) => {
    //                                       getCollectedItemEntityID
    let pos = this.tempItemIdLocs.get(packet.func_149354_c())
    if (!pos) return
    // TODO: only trigger on secret iten
    Client.scheduleTask(() => {
        EventManager.triggerEvent(EventManager.EVENT_SECRETCOLLECT, "item", pos[0], pos[1], pos[2])
    })
}).setPacketClasses([net.minecraft.network.play.server.S0DPacketCollectItem])