
/// <reference types="../CTAutocomplete" />

import { m } from "../mappings/mappings"
import DungeonMap from "./Components/DungeonMap"
import MapRenderer from "./Render/MapRenderer"
import RenderContextManager from "./Render/RenderContextManager"
import DataLoader from "./Utils/DataLoader"
import betterMapServer from "./socketConnection"
import { bmData, renderCenteredString } from "./Utils/Utils"

/// <reference lib="es2015" />

/**@type {DungeonMap} */
let currentDungeonMap = null
let deadPlayers = new Set()

let renderContextManager = new RenderContextManager();
let dungeonMapRenderContext = renderContextManager.createRenderContext(bmData.map.x, bmData.map.y, 150*bmData.map.scale, bmData.map.headScale);

let mapRenderer = new MapRenderer();


register("step", () => {
    if (DataLoader.isInDungeon && DataLoader.dungeonFloor) {
        if (!currentDungeonMap) { //entered dungeon, create map data
            currentDungeonMap = new DungeonMap(DataLoader.dungeonFloor, deadPlayers)
        }
    } else {
        if (currentDungeonMap) { //left dungeon, clear map data
            currentDungeonMap.destroy();
            currentDungeonMap = null
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
    if (!currentDungeonMap) return;
    currentDungeonMap.updatePlayers()
    currentDungeonMap.identifyCurrentRoom();
}).setFps(1)

betterMapServer.datacallback = (data) => {
    if (!currentDungeonMap) return
    currentDungeonMap.socketData(data)
}

// {
//     "posX": 700,
//     "posY": 10,
//     "size": 150,
//     "headScale": 8,
//     "image": null,
//     "imageLastUpdate": 0,
//     "lastImage": 0
// }

register("renderOverlay", () => {
    if (!dungeonMapRenderContext || !currentDungeonMap) return
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
})

register("actionBar", (curr, max) => {
    if (!currentDungeonMap) return
    currentDungeonMap.secretCountActionBar(parseInt(curr), parseInt(max))
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


// --------------------------------------------

const mapEditGUI = new Gui()

// Temp (?) command.
register("command", (...args) => {
    if (!args.length || !args[0]) return // Config GUI in future
    if (args[0] == "edit") {
        mapEditGUI.open()
    }
}).setTabCompletions(["edit"]).setName("bettermap").setAliases(["bm"])

// Change the position of the map
register("dragged", (dx, dy, mx, my, btn) => {
    if (!mapEditGUI.isOpen()) return
    bmData.map.x = mx
    bmData.map.y = my
    bmData.save()
    renderContextManager.updateCurrentRenderContext()
})

// Change the scale of the map, heads and checkmarks
register("scrolled", (mx, my, direction) => {
    if (!mapEditGUI.isOpen()) return
    if (Client.isShiftDown()) {
        if (direction == 1) bmData.map.headScale += 0.1 // Scrolling down
        else bmData.map.headScale -= 0.1 // Up
    }
    else if (Client.isControlDown()) {
        if (direction == 1) bmData.map.checkmarkScale += 0.05
        else bmData.map.checkmarkScale -= 0.05
    }
    else {
        if (direction == 1) bmData.map.scale += 0.01
        else bmData.map.scale -= 0.01
    }
    bmData.save()
    renderContextManager.updateCurrentRenderContext()
})

// Info text for the map edit gui.
register("renderOverlay", () => {
    if (!mapEditGUI.isOpen()) return
    renderCenteredString([
        "Click and drag to move the map",
        "Scroll to change the map scale",
        "Shift + Scroll to change the player head scale",
        "Control + Scroll to change the checkmark scale."
    ], Renderer.screen.getWidth()/2, Renderer.screen.getHeight()/3, 1)
})