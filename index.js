
/// <reference types="../CTAutocomplete" />

import DungeonMap from "./Components/DungeonMap"
import DataLoader from "./Utils/DataLoader"

/// <reference lib="es2015" />

/**@type {DungeonMap} */
let currentDungeonMap = undefined
let dungeonMapRenderContext = undefined

register("step", () => {
    if (DataLoader.isInDungeon && DataLoader.dungeonFloor) {
        if (!currentDungeonMap) {
            currentDungeonMap = new DungeonMap(DataLoader.dungeonFloor)

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
        }
    }
}).setFps(5)

register("renderOverlay", () => {
    if (dungeonMapRenderContext && currentDungeonMap) {
        currentDungeonMap.draw(dungeonMapRenderContext)
    }
})
