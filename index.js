
/// <reference types="../CTAutocomplete" />

import { m } from "../mappings/mappings"
import DungeonMap from "./Components/DungeonMap"
import MapRenderer from "./Render/MapRenderer"
import RenderContextManager from "./Render/RenderContextManager"
import DataLoader from "./Utils/DataLoader"
import betterMapServer from "./socketConnection"
import SettingsManager from "./Extra/Settings/SettingsManager"

/// <reference lib="es2015" />

/**@type {DungeonMap} */
let currentDungeonMap = undefined
let deadPlayers = new Set()

let renderContextManager = new RenderContextManager();
let settingsManager = new SettingsManager(renderContextManager)
let dungeonMapRenderContext = settingsManager.createRenderContext({ posX: Renderer.screen.getWidth() - 150 - 10, posY: 10, size: 150 });

let mapRenderer = new MapRenderer();


register("step", () => {
    if (DataLoader.isInDungeon && DataLoader.dungeonFloor) {
        if (!currentDungeonMap) { //entered dungeon, create map data
            currentDungeonMap = new DungeonMap(DataLoader.dungeonFloor, deadPlayers)
        }
    } else {
        if (currentDungeonMap) { //left dungeon, clear map data
            currentDungeonMap.destroy();
            currentDungeonMap = undefined
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

betterMapServer.datacallback = (data) => {
    if (currentDungeonMap) {
        currentDungeonMap.socketData(data)
    }
}

register("renderOverlay", () => {
    if (dungeonMapRenderContext && currentDungeonMap) {

        let mapContext = renderContextManager.getRenderContextData(dungeonMapRenderContext)
        currentDungeonMap.updatePlayersFast()
        mapRenderer.draw(mapContext, currentDungeonMap)
        //render heads
        for (let player of currentDungeonMap.players) {
            player.drawIcon(mapContext)
        }


        if (Client.isInChat()) {
            //Putting checks and xy loading here so that we can draw tooltips in other guis in the future
            let cursorX = Client.getMouseX();
            let cursorY = Client.getMouseY();
            currentDungeonMap.drawRoomTooltip(mapContext, cursorX, cursorY);
        }

    }
})

register("actionBar", (curr, max) => {
    if (currentDungeonMap) {
        currentDungeonMap.secretCountActionBar(parseInt(curr), parseInt(max))
    }
}).setCriteria('&7${curr}/${max} Secrets').setParameter('contains')

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