
/// <reference types="../CTAutocomplete" />

import { m } from "../mappings/mappings"
import DungeonMap from "./Components/DungeonMap"
import MapRenderer from "./Render/MapRenderer"
import RenderContextManager from "./Render/RenderContextManager"
import DataLoader from "./Utils/DataLoader"
import betterMapServer from "./socketConnection"
import SettingsManager from "./Extra/Settings/SettingsManager"
import RenderLib from "../RenderLib/index"
import DungeonRoomData from "./Data/DungeonRoomData.js"
import CurrentSettings from "./Extra/Settings/CurrentSettings"
require("./Extra/Events/SecretTracker.js")

/// <reference lib="es2015" />

/**@type {DungeonMap} */
let currentDungeonMap = undefined
let deadPlayers = new Set()

let renderContextManager = new RenderContextManager();
let mapRenderer = new MapRenderer();

let settingsManager = new SettingsManager(renderContextManager, mapRenderer)
let dungeonMapRenderContext = settingsManager.createRenderContext();
CurrentSettings.settings = settingsManager.currentSettings



register("step", () => {
    if (DataLoader.isInDungeon && DataLoader.dungeonFloor || currentDungeonMap?.getCurrentRoomId() === "30,225") {
        if (!currentDungeonMap) { //entered dungeon, create map data
            currentDungeonMap = new DungeonMap(DataLoader.dungeonFloor, deadPlayers)
            global.betterMapDungeonMap = currentDungeonMap
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
            currentDungeonMap.updateFromWorld();
        }
        currentDungeonMap.updatePuzzles();
    }
}).setFps(5)

register("step", () => {
    if (!currentDungeonMap)
        return;
    currentDungeonMap.updatePlayers()
    currentDungeonMap.identifyCurrentRoom();
}).setFps(1)
register("step", () => {
    if (!currentDungeonMap)
        return;
    currentDungeonMap.syncPlayersThruSocket()
}).setFps(3)

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

        if (!Client.isInChat()) {
            currentDungeonMap.dropdownXY = undefined
        }

        if (Client.isInChat() || currentDungeonMap.cursorStoreXY) {
            //Putting checks and xy loading here so that we can draw tooltips in other guis in the future
            let cursorX = Client.getMouseX();
            let cursorY = Client.getMouseY();
            currentDungeonMap.drawRoomTooltip(mapContext, cursorX, cursorY);
        }

    }
})

register("clicked", (x, y, button, isPress) => {
    if (dungeonMapRenderContext && currentDungeonMap) {

        let mapContext = renderContextManager.getRenderContextData(dungeonMapRenderContext)

        if (Client.isInChat()) {
            currentDungeonMap.roomGuiClicked(mapContext, x, y, button, isPress);
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

let showSecretWaypoints = false;
register("renderWorld", () => {
    if (!showSecretWaypoints) return;
    if (!currentDungeonMap) return;
    let curRoom = currentDungeonMap.getCurrentRoom();
    if (!curRoom) return;
    if (!curRoom.data) return;
    curRoom.data?.secret_coords?.chest?.forEach(([rx, ry, rz]) => {
        let { x, y, z } = curRoom.toRoomCoords(rx, ry, rz);
        RenderLib.drawEspBox(x + .5, y, z + .5, 1, 1, 1, 0, 0, 1, true);
    });
    curRoom.data?.secret_coords?.item?.forEach(([rx, ry, rz]) => {
        let { x, y, z } = curRoom.toRoomCoords(rx, ry, rz);
        RenderLib.drawEspBox(x + .5, y, z + .5, 1, 1, 0, 1, 0, 1, true);
    });
    curRoom.data?.secret_coords?.wither?.forEach(([rx, ry, rz]) => {
        let { x, y, z } = curRoom.toRoomCoords(rx, ry, rz);
        RenderLib.drawEspBox(x + .5, y, z + .5, 1, 1, 0, 0, 1, 1, true);
    });
    curRoom.data?.secret_coords?.bat?.forEach(([rx, ry, rz]) => {
        let { x, y, z } = curRoom.toRoomCoords(rx, ry, rz);
        RenderLib.drawEspBox(x + .5, y, z + .5, 1, 1, 1, 0, 1, 1, true);
    });
    curRoom.data?.secret_coords?.redstone_key?.forEach(([rx, ry, rz]) => {
        let { x, y, z } = curRoom.toRoomCoords(rx, ry, rz);
        RenderLib.drawEspBox(x + .5, y, z + .5, 1, 1, 1, 1, 0, 1, true);
    });
});

register('command', () => {
    roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
    let px = ~~Player.getX();
    let py = ~~Player.getY();
    let pz = ~~Player.getZ();
    let currentRoom = currentDungeonMap.getCurrentRoom();

    for (let rx = px - 3; rx < px + 3; rx++) {
        for (let ry = py - 3; ry < py + 3; ry++) {
            for (let rz = pz - 3; rz < pz + 3; rz++) {
                if ([54, 146].includes(World.getBlockAt(rx, ry, rz).type.getID())) {
                    ChatLib.chat('Found chest at ' + rx + '/' + ry + '/' + rz);

                    let { x, y, z } = currentRoom.getRelativeCoords(rx, ry, rz);
                    ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

                    for (let room of roomData) {
                        if (room.id.includes(currentRoom.roomId)) {
                            ChatLib.chat('Added data to ' + room.name);
                            if (!room.secret_coords) room.secret_coords = {}
                            if (!room.secret_coords.chest) room.secret_coords.chest = [];
                            room.secret_coords.chest.push([x, y, z])
                        }
                    };
                }
            }
        }
    }
    let roomJson = JSON.stringify(roomData, null, 2);
    FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

    DungeonRoomData.reloadData();
    currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
}).setName('addchests');


register('command', () => {
    roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
    let px = ~~Player.getX() - 1;
    let py = ~~Player.getY();
    let pz = ~~Player.getZ() - 1;
    ChatLib.chat('Player is at ' + px + '/' + py + '/' + pz);
    let currentRoom = currentDungeonMap.getCurrentRoom();
    let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
    ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

    for (let room of roomData) {
        if (room.id.includes(currentRoom.roomId)) {
            ChatLib.chat('Added data to ' + room.name);
            if (!room.secret_coords) room.secret_coords = {}
            if (!room.secret_coords.item) room.secret_coords.item = [];
            room.secret_coords.item.push([x, y, z])
        }
    };
    let roomJson = JSON.stringify(roomData, null, 2);
    FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

    DungeonRoomData.reloadData();
    currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
}).setName('additem');



register('command', () => {
    roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
    let px = ~~Player.getX() - 1;
    let py = ~~Player.getY();
    let pz = ~~Player.getZ() - 1;
    let currentRoom = currentDungeonMap.getCurrentRoom();
    let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
    ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

    for (let room of roomData) {
        if (room.id.includes(currentRoom.roomId)) {
            ChatLib.chat('Added data to ' + room.name);
            if (!room.secret_coords) room.secret_coords = {}
            if (!room.secret_coords.wither) room.secret_coords.wither = [];
            room.secret_coords.wither.push([x, y, z])
        }
    };
    let roomJson = JSON.stringify(roomData, null, 2);
    FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

    DungeonRoomData.reloadData();
    currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
}).setName('addwither');


register('command', (height) => {
    roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
    let px = ~~Player.getX() - 1;
    let py = ~~Player.getY() + 1 + (isNaN(height) ? 0 : parseInt(height));
    let pz = ~~Player.getZ() - 1;
    let currentRoom = currentDungeonMap.getCurrentRoom();
    let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
    ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

    for (let room of roomData) {
        if (room.id.includes(currentRoom.roomId)) {
            ChatLib.chat('Added data to ' + room.name);
            if (!room.secret_coords) room.secret_coords = {}
            if (!room.secret_coords.bat) room.secret_coords.bat = [];
            room.secret_coords.bat.push([x, y, z])
        }
    };
    let roomJson = JSON.stringify(roomData, null, 2);
    FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

    DungeonRoomData.reloadData();
    currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
}).setName('addbat');

register('command', () => {
    roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
    let px = ~~Player.getX() - 1;
    let py = ~~Player.getY();
    let pz = ~~Player.getZ() - 1;
    let currentRoom = currentDungeonMap.getCurrentRoom();
    let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
    ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

    for (let room of roomData) {
        if (room.id.includes(currentRoom.roomId)) {
            ChatLib.chat('Added data to ' + room.name);
            if (!room.secret_coords) room.secret_coords = {}
            if (!room.secret_coords.redstone_key) room.secret_coords.redstone_key = [];
            room.secret_coords.redstone_key.push([x, y, z])
        }
    };
    let roomJson = JSON.stringify(roomData, null, 2);
    FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

    DungeonRoomData.reloadData();
    currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
}).setName('addredstonekey');

register('command', () => {
    DungeonRoomData.reloadData();
    currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
}).setName('reloadroomdata');

register('command', () => {
    showSecretWaypoints = !showSecretWaypoints;
}).setName('showsecretwaypoints');