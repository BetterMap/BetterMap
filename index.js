
/// <reference types="../CTAutocomplete" />
/// <reference lib="es2015" />

import DungeonMap from "./Components/DungeonMap"
import MapRenderer from "./Render/MapRenderer"
import RenderContextManager from "./Render/RenderContextManager"
import DataLoader from "./Utils/DataLoader"
import betterMapServer from "./socketConnection"
import SettingsManager from "./Extra/Settings/SettingsManager"
import DungeonRoomData from "./Data/DungeonRoomData.js"
import CurrentSettings from "./Extra/Settings/CurrentSettings"
import eventManager from "./Extra/Events/EventManager"
import { MESSAGE_PREFIX } from "./Utils/Utils"
import { drawBoxAtBlock } from "./Utils/renderUtils"
import settings from "./Extra/Settings/CurrentSettings"
import socketConnection from "./socketConnection"
let MapData = Java.type("net.minecraft.world.storage.MapData")
require("./Extra/Events/SecretTracker.js")

/**@type {DungeonMap} */
let currentDungeonMap = undefined
let deadPlayers = new Set()

let renderContextManager = new RenderContextManager();
let mapRenderer = new MapRenderer();
CurrentSettings.renderContextManager = renderContextManager

let settingsManager = new SettingsManager(renderContextManager)
let dungeonMapRenderContext = settingsManager.createRenderContext();
CurrentSettings.renderContext = renderContextManager.getRenderContextData(dungeonMapRenderContext)
CurrentSettings.settingsManager = settingsManager

require("./Extra/LeapGui/leapGui.js")

register("step", () => {
    if (DataLoader.isInDungeon && DataLoader.dungeonFloor || currentDungeonMap?.getCurrentRoomId() === "30,225") {
        if (!currentDungeonMap) { // Entered dungeon, create map data
            currentDungeonMap = new DungeonMap(DataLoader.dungeonFloor, deadPlayers)
            CurrentSettings.currentDungeon = currentDungeonMap
        }
    } else {
        if (currentDungeonMap) { // Left dungeon, clear map data
            currentDungeonMap.destroy();
            currentDungeonMap = undefined
            CurrentSettings.currentDungeon = undefined
        }
    }

    if (!currentDungeonMap) return

    if (Player.getX() < 0 && Player.getZ() < 0) { // Ensuring they are not in boss room
        
        let mapData = null

        try {
            let item = Player.getInventory().getStackInSlot(8)
            // getMapData
            mapData = item.getItem().func_77873_a(item.getItemStack(), World.getWorld())
            if (mapData && !currentDungeonMap.mapId) {
                currentDungeonMap.mapId = item.getMetadata()
            }
        } catch (error) {
            if (currentDungeonMap.mapId) {
                // loadItemData
                mapData = World.getWorld().func_72943_a(MapData.class, "map_" + currentDungeonMap.mapId)
            }
        }

        if (mapData) {
            currentDungeonMap.updateFromMap(mapData)
        }
    }

    currentDungeonMap.updatePuzzles();
    currentDungeonMap.updateTabInfo();
}).setFps(5)

register("packetReceived", (packet) => {
    if (currentDungeonMap && !currentDungeonMap.mapId) {
        // getMapId
        currentDungeonMap.mapId = packet.func_149188_c()
    }
}).setFilteredClass(net.minecraft.network.play.server.S34PacketMaps)

register("step", () => {
    if (!currentDungeonMap)
        return;
    currentDungeonMap.updatePlayers()
}).setFps(1)

register("step", () => {
    if (!currentDungeonMap) return;
    currentDungeonMap.syncPlayersThruSocket()
}).setFps(3)

betterMapServer.datacallback = (data) => {
    if (currentDungeonMap) {
        currentDungeonMap.socketData(data)
    }
}

eventManager.onSecretCollect((type, x, y, z) => {
    if (currentDungeonMap) currentDungeonMap.onSecretCollect(type, x, y, z)
})

register("command", (name) => {
    if (!name) {
        ChatLib.chat(MESSAGE_PREFIX + 'Missing argument. Usage: §c/bping [name]')
        return;
    }
    socketConnection.isUsingBMap([name], ([usingMap]) => {
        if (usingMap) {
            ChatLib.chat(MESSAGE_PREFIX + name + " is using bettermap")
        } else {
            ChatLib.chat(MESSAGE_PREFIX + name + " is NOT using bettermap (or isn't online)")
        }
    })
}).setName("bping", true)

register("command", () => {
    if (!currentDungeonMap) {
        ChatLib.chat(MESSAGE_PREFIX + "You must be in a dungeon to run this command.")
        return
    }

    let people = currentDungeonMap.players.map(p => p.username)

    socketConnection.isUsingBMap(people, (usingMap) => {
        people.forEach((name, index) => {
            if (usingMap[index]) {
                ChatLib.chat(MESSAGE_PREFIX + name + " is using bettermap")
            } else {
                ChatLib.chat(MESSAGE_PREFIX + name + " is NOT using bettermap (or isn't online)")
            }
        })
    })
}).setName("bpingp", true)

register("renderOverlay", () => {
    if (dungeonMapRenderContext && currentDungeonMap) {

        let mapContext = renderContextManager.getRenderContextData(dungeonMapRenderContext)
        currentDungeonMap.updatePlayersFast()
        currentDungeonMap.updateScoreboardScore()

        let cursorX = -1000
        let cursorY = -1000

        if (Client.isInChat()) {
            // Putting checks and xy loading here so that we can draw tooltips in other guis in the future
            cursorX = Client.getMouseX();
            cursorY = Client.getMouseY();
        }
        if (currentDungeonMap.cursorStoreXY) {
            [cursorX, cursorY] = currentDungeonMap.cursorStoreXY
        }

        mapRenderer.draw(mapContext, currentDungeonMap, cursorX, cursorY)

        if (!Client.isInChat()) {
            currentDungeonMap.dropdownXY = undefined
        }
    }
})

register("clicked", (x, y, button, isPress) => {
    if (dungeonMapRenderContext && currentDungeonMap) {

        let mapContext = renderContextManager.getRenderContextData(dungeonMapRenderContext)

        if (Client.isInChat()) {
            mapRenderer.clicked(mapContext, currentDungeonMap, x, y, button, isPress)
        }
    }
})

register("actionBar", (curr, max) => {
    if (currentDungeonMap) currentDungeonMap.secretCountActionBar(parseInt(curr), parseInt(max))
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

    if (player === "you") {
        player = Player.getName().toLowerCase()
    }

    deadPlayers.add(player.toLowerCase())
}).setChatCriteria("&r&c ☠ ${info} and became a ghost&r&7.&r")

register("chat", (info) => {
    let player = ChatLib.removeFormatting(info.split(" ")[0])

    if (player === "you") {
        player = Player.getName().toLowerCase()
    }

    deadPlayers.delete(player.toLowerCase())
}).setChatCriteria("&r&a ❣ &r${info} was revived${*}!&r")

register('command', () => {
    currentDungeonMap?.regenRooms()
}).setName('reloadmap', true);

register("renderWorld", () => {
    if (!currentDungeonMap) return

    if (settings.settings.boxDoors && !currentDungeonMap.bloodOpen) {
        let isOpenable = currentDungeonMap.keys >= 1
        currentDungeonMap.witherDoors.forEach(door => {
            let x = door.position.worldX - 1 // Round to nearest door location, incase map is too low quality to get exact block
            let y = door.position.worldY - 1

            drawBoxAtBlock(x, 69, y, isOpenable ? 0 : 1, isOpenable ? 1 : 0, 0, 3, 4)
        })
    }

    let curRoom = currentDungeonMap.getCurrentRoom();
    if (!curRoom) return
    curRoom.drawRoomSecrets()
});

// register('command', () => {
//     roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
//     let px = ~~Player.getX();
//     let py = ~~Player.getY();
//     let pz = ~~Player.getZ();
//     let currentRoom = currentDungeonMap.getCurrentRoom();

//     for (let rx = px - 3; rx < px + 3; rx++) {
//         for (let ry = py - 3; ry < py + 3; ry++) {
//             for (let rz = pz - 3; rz < pz + 3; rz++) {
//                 if ([54, 146].includes(World.getBlockAt(rx, ry, rz).type.getID())) {
//                     ChatLib.chat('Found chest at ' + rx + '/' + ry + '/' + rz);

//                     let { x, y, z } = currentRoom.getRelativeCoords(rx, ry, rz);
//                     ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

//                     for (let room of roomData) {
//                         if (room.id.includes(currentRoom.roomId)) {
//                             ChatLib.chat('Added data to ' + room.name);
//                             if (!room.secret_coords) room.secret_coords = {}
//                             if (!room.secret_coords.chest) room.secret_coords.chest = [];
//                             room.secret_coords.chest.push([x, y, z])
//                         }
//                     };
//                 }
//             }
//         }
//     }
//     let roomJson = JSON.stringify(roomData, null, 2);
//     FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

//     DungeonRoomData.reloadData();
//     currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
// }).setName('addchests');


// register('command', () => {
//     roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
//     let px = ~~Player.getX() - 1;
//     let py = ~~Player.getY();
//     let pz = ~~Player.getZ() - 1;
//     ChatLib.chat('Player is at ' + px + '/' + py + '/' + pz);
//     let currentRoom = currentDungeonMap.getCurrentRoom();
//     let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
//     ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

//     for (let room of roomData) {
//         if (room.id.includes(currentRoom.roomId)) {
//             ChatLib.chat('Added data to ' + room.name);
//             if (!room.secret_coords) room.secret_coords = {}
//             if (!room.secret_coords.item) room.secret_coords.item = [];
//             room.secret_coords.item.push([x, y, z])
//         }
//     };
//     let roomJson = JSON.stringify(roomData, null, 2);
//     FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

//     DungeonRoomData.reloadData();
//     currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
// }).setName('additem');



// register('command', () => {
//     roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
//     let px = ~~Player.getX() - 1;
//     let py = ~~Player.getY();
//     let pz = ~~Player.getZ() - 1;
//     let currentRoom = currentDungeonMap.getCurrentRoom();
//     let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
//     ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

//     for (let room of roomData) {
//         if (room.id.includes(currentRoom.roomId)) {
//             ChatLib.chat('Added data to ' + room.name);
//             if (!room.secret_coords) room.secret_coords = {}
//             if (!room.secret_coords.wither) room.secret_coords.wither = [];
//             room.secret_coords.wither.push([x, y, z])
//         }
//     };
//     let roomJson = JSON.stringify(roomData, null, 2);
//     FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

//     DungeonRoomData.reloadData();
//     currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
// }).setName('addwither');


// register('command', (height) => {
//     roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
//     let px = ~~Player.getX() - 1;
//     let py = ~~Player.getY() + 1 + (isNaN(height) ? 0 : parseInt(height));
//     let pz = ~~Player.getZ() - 1;
//     let currentRoom = currentDungeonMap.getCurrentRoom();
//     let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
//     ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

//     for (let room of roomData) {
//         if (room.id.includes(currentRoom.roomId)) {
//             ChatLib.chat('Added data to ' + room.name);
//             if (!room.secret_coords) room.secret_coords = {}
//             if (!room.secret_coords.bat) room.secret_coords.bat = [];
//             room.secret_coords.bat.push([x, y, z])
//         }
//     };
//     let roomJson = JSON.stringify(roomData, null, 2);
//     FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

//     DungeonRoomData.reloadData();
//     currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
// }).setName('addbat');

// register('command', () => {
//     roomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"));
//     let px = ~~Player.getX() - 1;
//     let py = ~~Player.getY();
//     let pz = ~~Player.getZ() - 1;
//     let currentRoom = currentDungeonMap.getCurrentRoom();
//     let { x, y, z } = currentRoom.getRelativeCoords(px, py, pz);
//     ChatLib.chat('Relative coords: ' + x + '/' + y + '/' + z);

//     for (let room of roomData) {
//         if (room.id.includes(currentRoom.roomId)) {
//             ChatLib.chat('Added data to ' + room.name);
//             if (!room.secret_coords) room.secret_coords = {}
//             if (!room.secret_coords.redstone_key) room.secret_coords.redstone_key = [];
//             room.secret_coords.redstone_key.push([x, y, z])
//         }
//     };
//     let roomJson = JSON.stringify(roomData, null, 2);
//     FileLib.write('BetterMap', "Data/roomdata.json", roomJson);

//     DungeonRoomData.reloadData();
//     currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
// }).setName('addredstonekey');

// register('command', () => {
//     DungeonRoomData.reloadData();
//     currentDungeonMap.getCurrentRoom().roomId = currentDungeonMap.getCurrentRoom().roomId;
// }).setName('reloadroomdata');