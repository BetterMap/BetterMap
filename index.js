
/// <reference types="../CTAutocomplete" />

import { m } from "../mappings/mappings"
import DungeonMap from "./Components/DungeonMap"
import DataLoader from "./Utils/DataLoader"

/// <reference lib="es2015" />

/**@type {DungeonMap} */
let currentDungeonMap = undefined
let dungeonMapRenderContext = undefined
let deadPlayers = new Set()

register("step", () => {
    if (DataLoader.isInDungeon && DataLoader.dungeonFloor) {
        if (!currentDungeonMap) {
            currentDungeonMap = new DungeonMap(DataLoader.dungeonFloor, deadPlayers)

            dungeonMapRenderContext = currentDungeonMap.createRenderContext({ x: Renderer.screen.getWidth() - 150 - 10, y: 10, size: 150 })
        }
    } else {
        if (currentDungeonMap) {
            currentDungeonMap.destroy()
            currentDungeonMap = undefined
            dungeonMapRenderContext = undefined
        }
    }

    if (currentDungeonMap) {
        let mapData
        try {
            let item = Player.getInventory().getStackInSlot(8)
            mapData = item.getItem()[m.getMapData](item.getItemStack(), World.getWorld())
        } catch (error) {
        }
        if (mapData) {
            currentDungeonMap.updateFromMap(mapData)
        } else {
            currentDungeonMap.updateFromWorld()
        }
    }
}).setFps(5)

register("step", () => {
    if (!currentDungeonMap)
        return;
    currentDungeonMap.updatePlayers()
    currentDungeonMap.identifyCurrentRoom();
}).setFps(1)

register("renderOverlay", () => {
    if (dungeonMapRenderContext && currentDungeonMap) {
        currentDungeonMap.updatePlayersFast()
        currentDungeonMap.draw(dungeonMapRenderContext)
    }
})

register("worldLoad", () => {
    if (currentDungeonMap) {
        currentDungeonMap.destroy()
        currentDungeonMap = null
    }
    deadPlayers.clear()
})

register("chat", (info) => {
    let player = ChatLib.removeFormatting(info.split(" ")[0])

    deadPlayers.add(player.toLowerCase())
}).setChatCriteria("&r&c ☠ ${info} and became a ghost&r&7.&r")
register("chat", (info) => {
    let player = ChatLib.removeFormatting(info.split(" ")[0])

    deadPlayers.delete(player.toLowerCase())
}).setChatCriteria("&r&a ❣ &r${info} was revived${*}!&r")