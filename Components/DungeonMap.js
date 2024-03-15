import { f, m } from "../../mappings/mappings.js"
import Position from "../Utils/Position.js"
import Room from "./Room.js"

import { getScoreboardInfo, getTabListInfo, getRequiredSecrets } from "../Utils/Score"
import Door from "./Door.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"
import { changeScoreboardLine, dungeonOffsetX, dungeonOffsetY, MESSAGE_PREFIX, MESSAGE_PREFIX_SHORT, renderLore, getPlayerName } from "../Utils/Utils.js"
import DataLoader from "../Utils/DataLoader.js"
import { fetch } from "../Utils/networkUtils.js"
import renderLibs from "../../guimanager/renderLibs.js"
import settings from "../Extra/Settings/CurrentSettings.js"
import { RoomEvents, toDisplayString } from "./RoomEvent.js"
import RecordManager from "../Routes/find proper name/RecordManager.js"

let PlayerComparator = Java.type("net.minecraft.client.gui.GuiPlayerTabOverlay").PlayerComparator
let c = PlayerComparator.class.getDeclaredConstructor()
c.setAccessible(true);
let sorter = c.newInstance()

class DungeonMap {
    constructor(floor, deadPlayers, registerEvents = true) {
        /**
         * @type {Map<String, Room>} The string is in form x,y eg 102,134 and will correspond to the top left corner of a room component
         */
        this.rooms = new Map()
        /**
         * @type {Map<String, Door>} The string is in form x,y eg 102,134 and will correspond to the top left corner of a door
         */
        this.doors = new Map()

        /**
         * @type {Set<Door>} A set of all wither doors in the dungeon
         */
        this.witherDoors = new Set()

        this.fullRoomScaleMap = 0 // How many pixels on the map is 32 blocks
        this.widthRoomImageMap = 0 // How wide the main boxes are on the map

        /**
         * @type {Set<Room>} So that its easy to loop over all rooms without duplicates
         */
        this.roomsArr = new Set()

        this.floor = floor // Eg "M2" or "E" or "F7"
        this.floorNumber = this.floor == "E" ? 0 : parseInt(this.floor[this.floor.length - 1])

        this.deadPlayers = deadPlayers
        this.playerNick = null;

        this.lastChanged = Date.now()

        this.dungeonTopLeft = undefined

        this.recordManager = new RecordManager();

        this.cachedScore = {
            time: 0,
            data: undefined
        }

        this.mimicKilled = false;
        this.firstDeath = false
        this.firstDeathHadSpirit = false

        this.nameToUuid = {
            "you": Player.getUUID().toString()
        }

        this.cursorStoreXY = undefined
        this.dropdownXY = undefined

        // Load from world datra

        this.lastRoomId = undefined
        this.lastChange = 0
        this.roomXY = "0,0"
        this.lastXY = undefined

        // Simulate changing bloccks to air to fix green room not having air border around it
        this.setAirLocs = new Set()

        // Set of xyz locations of collected secrets
        this.collectedSecrets = new Set()

        // Rooms that were already identified
        this.identifiedRoomIds = new Set();
        this.identifiedPuzzleCount = 0;

        this.pingIds = 0
        this.pingIdFuncs = new Map()

        this.dungeonFinished = false
        this.deadBlazes = 0;

        this.keys = 0
        this.bloodOpen = false

        //initialize with 0, only if score is below threshold will they get set to 1 then set to 2 after said
        this.broadcast270message = 0;
        this.broadcast300message = 0;


    }

    /*
     * NOTE: the callback function will be given a boolean representing wether the user is using bettermap
     * TODO: Make a server side custom packet to get this info so it doesent require both players to be in a dungeon
     * 
     * @example
     * DungeonMap.pingPlayer("Soopyboo32", (usingMap) => {
     *     if(usingMap){
     *         ChatLib.chat("Soopyboo32 is using bettermap")
     *     }else{
     *         ChatLib.chat("Soopyboo32 is NOT using bettermap")
     *     }
     * })
     */
    pingPlayer(username, callback) {
        if (username === Player.getName()) {
            callback(true) // Server doesent allow sending data to self
            return
        }

        let pingId = this.pingIds++

        this.pingIdFuncs.set(pingId, [Date.now(), callback])

        socketConnection.sendDungeonData({ "data": { "type": "ping", "from": Player.getName(), "id": pingId }, "players": [username] })
    }

    regenRooms() {
        this.doors.clear()
        this.rooms.clear()
        this.roomsArr.clear()
        this.lastRoomId = undefined
        this.identifiedRoomIds.clear()
    }

    addDoorToAdjacentRooms(door) {
        if (door.horizontal) {
            let left = door.position.arrayX - 1;
            let right = door.position.arrayX
            let y = Math.round(door.position.arrayY - 0.3);
            let leftRoom = this.rooms.get(left + ',' + y);
            let rightRoom = this.rooms.get(right + ',' + y);
            if (leftRoom) leftRoom.addDoor(door);
            if (rightRoom) rightRoom.addDoor(door);
        }
        else {
            let up = door.position.arrayY - 1
            let down = door.position.arrayY
            let x = Math.round(door.position.arrayX - 0.3);
            let upRoom = this.rooms.get(x + ',' + up);
            let downRoom = this.rooms.get(x + ',' + down);
            if (upRoom) upRoom.addDoor(door);
            if (downRoom) downRoom.addDoor(door);
        }

    }

    destroy() {
        this.rooms.clear()
        this.roomsArr.clear()
        this.collectedSecrets.clear()
        this.triggers.forEach(a => a.unregister())
        this.triggers = []
    }

    /**
     * This will re-render all render images
     */
    markChanged() {
        this.lastChanged = Date.now()
    }

    /**
     * Update players from tab list, also sends locations of players in render distance to other players
     */
    updatePlayers() {
        if (!Player.getPlayer()) return; //How tf is this null sometimes wtf 
        let pl = Player.getPlayer()["field_71174_a"]["func_175106_d"]().sort((a, b) => sorter.compare(a, b)); // Tab player list

        let i = 0;

        let thePlayer = undefined;
        for (let p of pl) {
            if (!p["func_178854_k"]()) continue;
            let line = p["func_178854_k"]()["func_150260_c"]();
            // https://regex101.com/r/cUzJoK/3
            line = line.replace(/§[a-fnmz0-9r]/g, ''); //support dungeons guide custom name colors
            let match = line.match(/^\[(\d+)\] (?:\[\w+\] )*(\w+) (?:.)*?\((\w+)(?: (\w+))*\)$/);
            if (!match) continue;
            let [_, sbLevel, name, clazz, level] = match;
            sbLevel = parseInt(sbLevel);
            // This is a tab list line for a player
            let playerName = getPlayerName(Player);
            if (name === playerName || name === this.playerNick) {// Move the current player to end of list
                thePlayer = [p, name, match];
                continue;
            }
            if (!this.players[i]) this.players[i] = new MapPlayer(p, this, name);
            this.players[i].networkPlayerInfo = p;
            this.playersNameToId[name] = i;
            this.players[i].updateTablistInfo(match);

            i++;
        }

        if (thePlayer) {// Move current player to end of list
            let [networkInfo, name, matchObject] = thePlayer;
            if (!this.players[i]) this.players[i] = new MapPlayer(networkInfo, this, name);
            this.players[i].networkPlayerInfo = networkInfo;
            this.playersNameToId[thePlayer[1]] = i;
            if (this.playerNick)
                this.playersNameToId[Player.getName()] = i;
            this.players[i].updateTablistInfo(matchObject);
        } else if (!this.playerNick) {
            //find the players nick
            pl.forEach(playerInfo => {
                if (playerInfo.func_178845_a().getId() == Player.getUUID()) {
                    this.playerNick = playerInfo.func_178845_a().getName();
                }
            })
        }

        for (let player of this.players) {
            let room = player.getRoom(this);
            if (player.currentRoomCache == room) continue;
            if (player.currentRoomCache) player.currentRoomCache.addEvent(RoomEvents.PLAYER_EXIT, player);
            if(player.getName() === Player.getName()) {
                this.recordManager.
            }
            player.currentRoomCache = room;
            room?.addEvent(RoomEvents.PLAYER_ENTER, player);
        }
    }

    /**
     * updates info in tab
     */
    updateTabInfo() {
        // ChatLib.chat(JSON.stringify(settings));
        if (!settings.settings.tabCryptCount && !settings.settings.tabSecretCount && (!settings.settings.tabMimic || this.floorNumber < 6)) return;
        // We pretend it's already done if the settings are disabled
        let modifiedCrypt = !settings.settings.tabCryptCount;
        let modifiedSecrets = !settings.settings.tabSecretCount;
        let modifiedMimic = !settings.settings.tabMimic || this.floorNumber < 6;
        const ChatComponentText = Java.type('net.minecraft.util.ChatComponentText');

        if (!Client.getMinecraft().field_71439_g) return

        let playerInfoList = Client.getMinecraft().field_71439_g.field_71174_a.func_175106_d();
        playerInfoList.forEach((playerInfo) => {
            if (playerInfo.func_178854_k() === null) return;
            let displayName = playerInfo.func_178854_k().func_150254_d();
            if (!modifiedMimic && displayName.includes('Mimic Dead:')) {
                modifiedMimic = true;
                if (displayName.includes('YES')) return;
                if (!this.mimicKilled) return;
                playerInfo.func_178859_a(new ChatComponentText('§r Mimic Dead: ' + (this.mimicKilled ? '§aYES§r' : '§cNO§r')))
            }
            if (!modifiedCrypt && displayName.includes('Crypts:')) {
                modifiedCrypt = true;
                const totalCryptCount = this.roomsArr.reduce((prev, room) => prev + (room.data?.crypts || 0), 0);
                if (displayName.includes('/' + totalCryptCount)) return;
                var newTabLine;
                if (displayName.includes('/')) {
                    newTabLine = displayName.split('/')[0] + '§6/' + totalCryptCount;
                }
                else {
                    newTabLine = displayName + '§6/' + totalCryptCount;
                }
                playerInfo.func_178859_a(new ChatComponentText(newTabLine));
            }
            if (!modifiedSecrets && displayName.includes('Secrets Found:') && !displayName.includes('%')) {
                modifiedSecrets = true;
                const totalSecretCount = this.getScore().totalSecrets || "?"// This.roomsArr.reduce((prev, room) => prev + (room.maxSecrets || 0), 0);
                if (displayName.includes('/' + totalSecretCount)) return;
                var newTabLine;
                if (displayName.includes('/')) {
                    newTabLine = displayName.split('/')[0] + '§b/' + totalSecretCount;
                }
                else {
                    newTabLine = displayName + '§b/' + totalSecretCount;
                }
                playerInfo.func_178859_a(new ChatComponentText(newTabLine));
            }
        })

        // Mimic isnt even in tab yet
        if (!modifiedMimic) {
            let tabInfoList = ['§r Mimic Dead: §cNO'];
            this.addLinesToTabList(tabInfoList, 'Crypt');
        }
    }

    addLinesToTabList = (lines, startCriteria) => {
        const ChatComponentText = Java.type('net.minecraft.util.ChatComponentText');
        let startToInject = false;
        if (!Client.getMinecraft().field_71439_g) return
        let playerInfoList = Client.getMinecraft().field_71439_g.field_71174_a.func_175106_d();
        playerInfoList = [...playerInfoList].sort((first, second) => first.func_178845_a().getName().localeCompare(second.func_178845_a().getName()))
        playerInfoList.forEach((playerInfo) => {
            if (lines.length === 0) return;
            if (playerInfo.func_178854_k() === null) return;
            let displayName = playerInfo.func_178854_k().func_150254_d();
            if (!displayName) return;
            if (displayName.includes(startCriteria)) {
                startToInject = true;
                return;
            }
            if (startToInject) {
                let nextLine = lines.pop();
                playerInfo.func_178859_a(new ChatComponentText(nextLine));
            }
        })
    }


    /**
     * Update players within render distance
     */
    updatePlayersFast() {
        World.getAllPlayers().forEach(player => {
            let playerName = getPlayerName(player);
            let p = this.players[this.playersNameToId[playerName]]
            if (!p) return

            p.setX(player.getX())
            p.setY(player.getZ())
            p.setRotate(player.getYaw() + 180)
            p.locallyUpdated = Date.now()
        })
    }

    /**
     * Update players location/rotation from dungeon rotation
     * @param {Object} deco 
     * @returns 
     */
    loadPlayersFromDecoration(deco) {
        if (!this.dungeonTopLeft) return

        let i = 0
        deco.forEach((icon, vec4b) => {
            if (i > this.players.length) return
            while (!this.players[i] || this.deadPlayers.has(this.players[i].username.toLowerCase())) {
                i++
                if (i > this.players.length) return
            }

            if (Date.now() - this.players[i].locallyUpdated > 1500) {
                let iconX = MathLib.map(vec4b.func_176112_b() - this.dungeonTopLeft[0] * 2, 0, 256, 0, 138)
                let iconY = MathLib.map(vec4b.func_176113_c() - this.dungeonTopLeft[1] * 2, 0, 256, 0, 138)
                let x = iconX / (128 / 6) * 32 - 96
                let y = iconY / (128 / 6) * 32 - 96
                let rot = vec4b.func_176111_d()
                rot = rot * 360 / 16 + 180

                this.players[i].setRotateAnimate(rot)
                this.players[i].setXAnimate(x)
                this.players[i].setYAnimate(y)
            }

            i++
        });
    }

    /**
     * Update dungeon from map data
     * @param {Object} mapData 
     * @returns 
     */
    updateFromMap(mapData) {
        if (this.dungeonFinished) return

        this.loadPlayersFromDecoration(mapData[f.mapDecorations])

        let mapColors = mapData[f.colors.MapData]

        if (!this.dungeonTopLeft) {
            // Find the top left pixel of the entrance room
            let thing = mapColors.findIndex((a, i) => a == 30 && i + 15 < mapColors.length && mapColors[i + 7] == 30 && mapColors[i + 15] == 30)
            if (thing == -1) return

            // Get the room size
            let i = 0
            while (mapColors[thing + i] == 30) i++
            this.widthRoomImageMap = i
            this.roomAndDoorWidth = this.widthRoomImageMap + 4

            // Find the corner of the top left most room on the map
            let x = (thing % 128) % this.roomAndDoorWidth
            let y = Math.floor(thing / 128) % this.roomAndDoorWidth

            // Adjust for Entrance and Floor 1's altered map position
            if ([0, 1].includes(this.floorNumber)) x += this.roomAndDoorWidth
            if (this.floorNumber == 0) y += this.roomAndDoorWidth

            this.dungeonTopLeft = [x, y]
            this.fullRoomScaleMap = Math.floor(this.widthRoomImageMap * 5 / 4)
        }

        if (!this.dungeonTopLeft) return

        let roomColors = {
            30: Room.SPAWN,
            66: Room.PUZZLE,
            82: Room.FAIRY,
            18: Room.BLOOD,
            62: Room.TRAP,
            74: Room.MINIBOSS,
            85: Room.UNKNOWN
        }

        for (let y = 0; y < 6; y++) {// Scan top left of rooms looking for valid rooms
            for (let x = 0; x < 6; x++) {
                let mapX = this.dungeonTopLeft[0] + this.roomAndDoorWidth * x
                let mapY = this.dungeonTopLeft[1] + this.roomAndDoorWidth * y
                if (mapX > 127 || mapY > 127) continue
                let pixelColor = mapColors[mapX + mapY * 128]
                if (!pixelColor) continue
                if (pixelColor in roomColors) {
                    if (roomColors[pixelColor] === Room.BLOOD) {
                        this.bloodOpen = true
                    }

                    // Special room at that location
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(x + "," + y)
                    if (!currRoom) {
                        let room = new Room(this, roomColors[pixelColor], [position], undefined)
                        this.rooms.set(x + "," + y, room)
                        this.roomsArr.add(room)
                        room.checkmarkState = room.type === Room.UNKNOWN ? Room.ADJACENT : Room.OPENED
                        this.markChanged()
                    }
                    else {
                        if (currRoom.type !== roomColors[pixelColor] && !currRoom.roomId) {
                            currRoom.setType(roomColors[pixelColor])
                            currRoom.checkmarkState = currRoom.type === Room.UNKNOWN ? Room.ADJACENT : Room.OPENED
                            this.markChanged();
                        }
                        if (currRoom.checkmarkState === Room.ADJACENT && currRoom.type !== Room.UNKNOWN && roomColors[pixelColor] !== Room.UNKNOWN) {
                            currRoom.checkmarkState = Room.OPENED
                            this.markChanged();
                        }
                    }
                }
                if (pixelColor === 63) {
                    // Normal room at that location
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(x + "," + y)

                    // Current rooms to the left and above, incase a merge needs to happen
                    // Will be undefined if no merge needs to happen
                    let currRoomLeft = mapColors[(mapX - 1) + (mapY) * 128] === 63 ? this.rooms.get((x - 1) + "," + y) : undefined
                    let currRoomTop = mapColors[(mapX) + (mapY - 1) * 128] === 63 ? this.rooms.get(x + "," + (y - 1)) : undefined
                    let currRoomTopRight = mapColors[(mapX + this.roomAndDoorWidth - 1) + (mapY) * 128] === 63 && mapColors[(mapX + this.roomAndDoorWidth) + (mapY - 1) * 128] === 63 ? this.rooms.get((x + 1) + "," + (y - 1)) : undefined

                    if (!currRoom && !currRoomLeft && !currRoomTop && !currRoomTopRight) { // No room and no merge
                        let room = new Room(this, Room.NORMAL, [position], undefined)
                        this.rooms.set(x + "," + y, room)
                        this.roomsArr.add(room)
                        this.markChanged()
                    }
                    // Already a normal room either in same location, or needs to merge up or left
                    else {
                        if (currRoom && currRoom.checkmarkState === Room.ADJACENT) {
                            currRoom.checkmarkState = Room.OPENED
                            this.markChanged();
                        }
                        // Another room in the same location
                        if (currRoom && currRoom.type !== Room.NORMAL) {
                            currRoom.setType(Room.NORMAL)
                            currRoom.checkmarkState = Room.OPENED
                            this.markChanged()
                        }
                        // Need to merge left
                        if (currRoomLeft && currRoom !== currRoomLeft && currRoomLeft.type === Room.NORMAL && !currRoomLeft.components.some(a => position.equals(a))) {
                            if (currRoom) this.roomsArr.delete(currRoom)
                            currRoomLeft.addComponents(position)
                            this.rooms.set(x + "," + y, currRoomLeft)
                            this.markChanged()
                        }
                        // Need to merge up
                        if (currRoomTop && currRoom !== currRoomTop && currRoomTop.type === Room.NORMAL && !currRoomTop.components.some(a => position.equals(a))) {
                            if (currRoom) this.roomsArr.delete(currRoom)
                            currRoomTop.addComponents(position)
                            this.rooms.set(x + "," + y, currRoomTop)
                            this.markChanged()
                        }
                        // Need to merge up
                        if (currRoomTopRight && currRoom !== currRoomTopRight && currRoomTopRight.type === Room.NORMAL && !currRoomTopRight.components.some(a => position.equals(a))) {
                            if (currRoom) this.roomsArr.delete(currRoom)
                            currRoomTopRight.addComponents(position)
                            this.rooms.set(x + "," + y, currRoomTopRight)
                            this.markChanged()
                        }
                    }
                }

                // Check for checkmark
                let roomCenter = mapColors[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128]
                let checkmarkPos = new Position(0, 0, this)
                checkmarkPos.mapX = mapX
                checkmarkPos.mapY = mapY
                let checkmarkRoom = this.rooms.get(checkmarkPos.arrayX + "," + checkmarkPos.arrayY)
                // White tick
                if (roomCenter === 34 && checkmarkRoom && checkmarkRoom.checkmarkState !== Room.CLEARED) {
                    checkmarkRoom.checkmarkState = Room.CLEARED
                    this.markChanged()
                }
                // Green tick
                if (roomCenter === 30 && checkmarkRoom.checkmarkState !== Room.COMPLETED) {
                    checkmarkRoom.checkmarkState = Room.COMPLETED
                    checkmarkRoom.currentSecrets = checkmarkRoom.maxSecrets
                    this.markChanged()
                }
                // Red X
                if (roomCenter === 18 && checkmarkRoom && checkmarkRoom.checkmarkState !== Room.FAILED && checkmarkRoom.type !== Room.BLOOD) {
                    checkmarkRoom.checkmarkState = Room.FAILED
                    this.markChanged()
                }

                // Check for doors

                if (mapColors[(mapX + this.widthRoomImageMap / 2) + (mapY - 1) * 128] !== 0 // Door above room
                    && mapColors[(mapX) + (mapY - 1) * 128] === 0) {

                    let color = mapColors[(mapX + this.widthRoomImageMap / 2) + (mapY - 1) * 128]

                    let type = Room.NORMAL
                    if (color in roomColors) type = roomColors[color]
                    if (color === 119) type = Room.BLACK

                    let position = new Position(0, 0, this)
                    position.mapX = mapX + this.widthRoomImageMap / 2 - 1
                    position.mapY = mapY - 3

                    position.worldX = Math.round(position.worldX)
                    position.worldY = Math.round(position.worldY)
                    let door = this.doors.get(position.arrayX + "," + position.arrayY)

                    if (door && door.type !== type) {
                        // Door already exists, update it.
                        door.type = type
                        if (type === Room.BLACK || type === Room.BLOOD) this.witherDoors.add(door)
                        else this.witherDoors.delete(door)
                        this.markChanged()
                    }
                    if (!door) {
                        // Door not in map, add new door
                        let newDoor = new Door(type, position, false)
                        this.doors.set(position.arrayX + "," + position.arrayY, newDoor)
                        this.addDoorToAdjacentRooms(newDoor);
                        if (type === Room.BLACK || type === Room.BLOOD) this.witherDoors.add(newDoor)
                        this.markChanged()
                    }
                }

                if (mapColors[(mapX - 1) + (mapY + this.widthRoomImageMap / 2) * 128] !== 0 // Door left of room
                    && mapColors[(mapX - 1) + (mapY) * 128] === 0) {

                    let color = mapColors[(mapX - 1) + (mapY + this.widthRoomImageMap / 2) * 128]

                    let type = Room.NORMAL
                    if (color in roomColors) type = roomColors[color]
                    if (color === 119) type = Room.BLACK

                    let position = new Position(0, 0, this)
                    position.mapX = mapX - 3
                    position.mapY = mapY + this.widthRoomImageMap / 2 - 1

                    position.worldX = Math.round(position.worldX)
                    position.worldY = Math.round(position.worldY)

                    if (!this.doors.get(position.arrayX + "," + position.arrayY)) {
                        // Door not in map, add new door
                        let door = new Door(type, position, true)
                        this.doors.set(position.arrayX + "," + position.arrayY, door);
                        this.addDoorToAdjacentRooms(door);
                        if (type === Room.BLACK || type === Room.BLOOD) this.witherDoors.add(door)
                        this.markChanged()
                    }
                    else {
                        // Door already there
                        let door = this.doors.get(position.arrayX + "," + position.arrayY)
                        if (door.type !== type) {
                            door.type = type
                            if (type === Room.BLACK || type === Room.BLOOD) { this.witherDoors.add(door) }
                            else { this.witherDoors.delete(door) }
                            this.markChanged()
                        }
                    }
                }
            }
        }
    }

    updatePuzzles() {
        let puzzleNamesList = [];
        let identifiedPuzzleList = [];
        if (!TabList) return;
        let names = []
        try {
            names = TabList.getNames() // Sometimes this has a null pointer exception inside the function?
        } catch (_) {
            return
        }
        const puzStart = names.findIndex(a => a.removeFormatting().match(/^Puzzles: \(\d+\)$/))
        if (puzStart == -1) return
        // The five lines after the "Puzzles: (3)" line
        const puzLines = names.slice(puzStart + 1, puzStart + 6).map(a => a.removeFormatting())
        puzLines.forEach(line => {
            // https://regex101.com/r/qhNs78/1
            let match = line.match(/^ ([\w? ]+)+: \[(.)\] (?:\(.+\))?$/)
            if (!match) return
            let [_, name, status] = match
            if (name == "???") return
            puzzleNamesList.push(name)
            if (status !== "✖") return
            for (let room of this.roomsArr) {
                if (room.data?.name?.toLowerCase() !== name.toLowerCase()) continue
                room.checkmarkState = Room.FAILED
            }
        });
        let puzzleCount = 0
        this.roomsArr.forEach((room) => {
            if (room.type === Room.PUZZLE && room.checkmarkState !== Room.ADJACENT) {
                if (room.roomId)
                    identifiedPuzzleList.push(room.data?.name?.toLowerCase() || '???');
                puzzleCount++;
            }
        })
        if (puzzleNamesList.length <= this.identifiedPuzzleCount) {
            return
        };
        if (puzzleNamesList.length != puzzleCount) {
            return;
        }
        puzzleNamesList = puzzleNamesList.filter(e => !identifiedPuzzleList.includes(e.toLowerCase()));
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 6; j++) {
                let coords = i + ',' + j;
                let room = this.rooms.get(coords);
                if (!room) continue;
                if (room.type == Room.PUZZLE && !room.roomId) {
                    let puzzleName = puzzleNamesList.shift();
                    if (!puzzleName) continue;
                    let ids = DungeonRoomData.getRoomIdsFromName(puzzleName)
                    room.roomId = ids[0];
                    this.identifiedRoomIds.addAll(...ids);
                }
            }
        }
        this.identifiedPuzzleCount = puzzleNamesList.length;
    }

    /**
     * @returns {{"skill": Number,"exploration": Number,"time": Number,"bonus": Number,"total": Number,"mimic": Boolean,"secretsFound": Number, "crypts": Numbers, "deathPenalty": Number, "totalSecrets": Number, "minSecrets": Number, "totalCrypts": Number}}
     */
    getScore() {
        // Update score calculations every 500ms
        if (Date.now() - this.cachedScore.time < 500) return this.cachedScore.data

        let exploration = 0;
        let time = 100; // TODO:  Figure out how to actually do this one
        let skill = 0;
        let bonus = 0;

        // If floor is enterance the floor integer entered should be 0
        let requiredSecrets = getRequiredSecrets(parseInt(this.floor[this.floor.length - 1]) || 0, this.floor[0] === "M");
        let roomCompletion = getScoreboardInfo();
        let [secrets, crypts, deaths, unfinshedPuzzles, completedRoomsTab, collectedSecrets] = getTabListInfo();
        let completedRooms = [...this.rooms.values()].reduce((a, b) => b.isCleared() ? a + 1 : a, 0)

        // If map data is incomplete, it's worth using the higher number
        completedRooms = Math.max(completedRooms, completedRoomsTab);

        // Estimate total room count based of the cleared percentage and the tab info. If nothing is cleared, assume 36 rooms
        totalRoomEstimate = roomCompletion ? Math.round(completedRoomsTab / roomCompletion * 100) : 36;

        // Exploration
        exploration += Math.min(40, ~~(secrets / requiredSecrets * 40));
        exploration += Math.min(60, ~~(completedRooms / totalRoomEstimate * 60));

        // Time
        // NOPE

        // Skill
        skill += ~~(completedRooms / totalRoomEstimate * 80) - unfinshedPuzzles * 10;
        skill -= deaths * 2;
        if (this.firstDeathHadSpirit) skill += 1

        // Cant physically drop below 20 score, no matter what
        skill = Math.max(0, skill);
        skill += 20;

        // Bonus
        bonus += Math.min(5, crypts);
        if (this.floorNumber >= 6 && this.mimicKilled) bonus += 2;

        let paul = DataLoader.currentMayorPerks.has("EZPZ") || settings.settings.forcePaul

        if (paul) bonus += 10

        let totalCryptCount = this.roomsArr.reduce((prev, room) => prev + (room.data?.crypts || 0), 0);

        let totalSecrets = Math.round(collectedSecrets / (secrets / 100))

        let deathPenalty = deaths * 2 - this.firstDeathHadSpirit // FirstDeathHadSpirit gets coerced to number (0 or 1)

        let minSecrets = Math.ceil(totalSecrets * requiredSecrets / 100 * ((40 - bonus + deathPenalty) / 40))

        let total = skill + exploration + time + bonus;

        let shouldAllow300Message = settings.settings.showScoreMessage === "at300" || settings.settings.showScoreMessage === "always"
        let shouldAllow270Message = settings.settings.showScoreMessage === "at270" || settings.settings.showScoreMessage === "always"

        if (settings.settings.showScoreMessage === "automatic") {
            shouldAllow270Message = this.floorNumber <= 5
            shouldAllow300Message = this.floorNumber >= 5 || this.floor === "M4"
        }

        if (shouldAllow300Message && total >= 300 && this.broadcast300message === 1) {
            this.broadcast300message = 2;
            ChatLib.command('pc ' + settings.settings.custom300scoreMessage);
        } else if (shouldAllow270Message && total >= 270 && this.broadcast270message === 1) {
            this.broadcast270message = 2;
            ChatLib.command('pc ' + settings.settings.custom270scoreMessage);
        }

        if (total < 270 && this.broadcast270message === 0)
            this.broadcast270message = 1;
        if (total < 300 && this.broadcast300message === 0)
            this.broadcast300message = 1;

        this.cachedScore = {
            time: Date.now(),
            data: {
                "skill": skill,
                "exploration": exploration,
                "time": time,
                "bonus": bonus,
                "total": total,
                "mimic": this.mimicKilled,
                "secretsFound": collectedSecrets,
                "crypts": crypts,
                "deathPenalty": deathPenalty,
                "totalSecrets": totalSecrets,
                "minSecrets": minSecrets,
                "totalCrypts": totalCryptCount
            }
        }

        return this.cachedScore.data
    }

    /**
     * Gets the current room the player is standing in
     * @returns {Room}
     */
    getPlayerRoom() {
        let x = ~~((Player.getX() + dungeonOffsetX) / 32);
        let y = ~~((Player.getZ() + dungeonOffsetY) / 32);

        return this.rooms.get(x + ',' + y);
    }

    scanFirstDeathForSpiritPet(username) {
        if (this.firstDeath) return;
        this.firstDeath = true;

        if (!this.nameToUuid[username.toLowerCase()]) return;
        let uuid = this.nameToUuid[username.toLowerCase()]?.replace(/-/g, "");

        const printSpiritMessage = () => {
            if (this.firstDeathHadSpirit) return ChatLib.chat(`${MESSAGE_PREFIX}${username} ${username == "You" ? "do" : "does"} have a spirit pet.`);
            ChatLib.chat(`${MESSAGE_PREFIX}${username} ${username == "You" ? "do" : "does"} not have a spirit pet.`);
        };

        fetch(`https://api.tenios.dev/spiritPet/${uuid}`).json((spirit) => {
            this.firstDeathHadSpirit = spirit
            printSpiritMessage();
        });
    }

    secretCountActionBar(min, max) {
        if (!this.canUpdateRoom()) return
        let x = ~~((Player.getX() + dungeonOffsetX) / 32);
        let y = ~~((Player.getZ() + dungeonOffsetY) / 32);

        let currentRoom = this.rooms.get(x + ',' + y);

        if (!currentRoom || currentRoom.type === Room.UNKNOWN) return; // Current room not loaded yet
        if (currentRoom.currentSecrets !== min && (currentRoom.maxSecrets === max || !currentRoom.roomId)) {
            currentRoom.currentSecrets = min
            currentRoom.maxSecrets = max
            if (currentRoom.checkmarkState === Room.CLEARED && currentRoom.currentSecrets >= currentRoom.maxSecrets) currentRoom.checkmarkState = Room.COMPLETED;

            this.markChanged() // Re-render map incase of a secret count specific texturing

            this.sendSocketData({
                type: 'roomSecrets',
                min,
                max,
                x,
                y
            })
        }
    }

    /**
     * Transforms world coords to relative coords. If the coords are not in a known room, returns null
     * @param {Number} x 
     * @param {Number} y 
     * @param {Number} z 
     */
    toRelativeCoords(x, y, z) {
        let px = ~~((x + dungeonOffsetX) / 32);
        let py = ~~((z + dungeonOffsetY) / 32);
        let room = this.rooms.get(px + ',' + py);
        if (!room) return null;
        return room.getRelativeCoords(x, y, z);
    }

    getCurrentRoom() {
        let x = ~~((Player.getX() + dungeonOffsetX) / 32);
        let y = ~~((Player.getZ() + dungeonOffsetY) / 32);

        return this.rooms.get(x + ',' + y);
    }

    identifyCurrentRoom() {
        if (!this.canUpdateRoom()) return
        let x = ~~((Player.getX() + dungeonOffsetX) / 32);
        let y = ~~((Player.getZ() + dungeonOffsetY) / 32);

        let roomId = this.getCurrentRoomId();

        if (!roomId) return; // Room id not loaded or inbetween 2 rooms
        if (this.identifiedRoomIds.has(roomId)) return; // Already loaded room

        let currentRoom = this.rooms.get(x + ',' + y);

        if (!currentRoom || currentRoom.roomId || currentRoom.type === Room.UNKNOWN) return; // Current room not loaded yet, or already loaded id

        currentRoom.roomId = roomId;
        this.identifiedRoomIds.add(roomId);

        this.markChanged() // Re-render map incase of a room-id specific texturing

        this.sendSocketData({
            type: "roomId",
            x, y, roomId
        })
    }

    roomGuiClicked(context, cursorX, cursorY, button, isPress) {
        if (!isPress) return

        if (this.dropdownXY) {
            dungeonMapButtons.forEach(([name, callback], index) => {

                let bx = this.dropdownXY[0] + 1
                let by = this.dropdownXY[1] + 25 * index + 1
                let bw = 73
                let bh = 23

                let hovered = cursorX >= bx && cursorX <= bx + bw && cursorY >= by && cursorY <= by + bh

                if (hovered) {
                    callback(this, this.dropdownXY[2])
                }
            })
            this.dropdownXY = undefined
            return
        }

        if (button === 1) { // Right click -> store x, y and render even if chat not open
            this.dropdownXY = undefined
            if (this.cursorStoreXY) this.cursorStoreXY = undefined
            else this.cursorStoreXY = [cursorX, cursorY]
            return
        }

        let { x, y, size } = context.getMapDimensions();
        const borderPixels = 27 / 256 * size;
        if (cursorX < x + borderPixels || cursorY < y + borderPixels || cursorX > x + size - borderPixels || cursorY > y + size - borderPixels) return;

        // Mouse somewhere on map
        let worldX = (((cursorX - x - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingLeft - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200
        let worldY = (((cursorY - y - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingTop - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200

        let coordsX = ~~((worldX + 200) / 32)
        let coordsY = ~~((worldY + 200) / 32)

        if (!this.rooms.has(coordsX + ',' + coordsY)) return // No room at mouse

        let room = this.rooms.get(coordsX + ',' + coordsY); // Hovered room

        if (button !== 0) return // Ignore buttons like middle mouse

        this.dropdownXY = [cursorX + 8, cursorY - 16, room]
        this.cursorStoreXY = undefined

    }

    drawRoomTooltip(context, cursorX, cursorY) {
        let { x, y, size } = context.getMapDimensions();

        if (this.dropdownXY) {
            let width = 125
            Renderer.retainTransforms(true)
            Renderer.translate(0, 0, 1000)
            Renderer.drawRect(Renderer.color(0, 0, 0), this.dropdownXY[0], this.dropdownXY[1], width, 25 * dungeonMapButtons.length)

            dungeonMapButtons.forEach(([name, callback], index) => {

                let bx = this.dropdownXY[0] + 1
                let by = this.dropdownXY[1] + 25 * index + 1
                let bw = width - 2
                let bh = 23

                let hovered = cursorX >= bx && cursorX <= bx + bw && cursorY >= by && cursorY <= by + bh

                Renderer.drawRect(Renderer.color(hovered ? 100 : 50, hovered ? 100 : 50, hovered ? 100 : 50), bx, by, bw, bh)

                let scale = Math.min(1, (bw - 4) / Renderer.getStringWidth(ChatLib.removeFormatting(name)))
                renderLibs.drawStringCenteredFull(name, bx + bw / 2, by + bh / 2, scale)
                Renderer.scale(1 / scale, 1 / scale)
            })
            Renderer.retainTransforms(false)
            return
        }

        if (cursorX < x || cursorY < y || cursorX > x + size || cursorY > y + size) return;

        // Mouse somewhere on map

        let worldX = (((cursorX - x - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingLeft - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200
        let worldY = (((cursorY - y - context.borderWidth) / context.size * context.getImageSize(this.floor) - context.paddingTop - context.roomSize / 2 - context.roomGap / 2) / context.blockSize + 0.5) * 32 - 200

        if (((worldX + 200) / 32) < 0) return
        if (((worldY + 200) / 32) < 0) return

        let coordsX = ~~((worldX + 200) / 32)
        let coordsY = ~~((worldY + 200) / 32)

        // No room at mouse
        if (!this.rooms.has(coordsX + ',' + coordsY)) return

        let room = this.rooms.get(coordsX + ',' + coordsY);

        let roomLore = room.getLore()

        renderLore(cursorX, cursorY, roomLore)

    }

    canUpdateRoom() {
        let currRoom = this.getRoomXYWorld().join(",")
        if (this.roomXY !== currRoom) {
            this.roomXY = currRoom
            this.lastChange = Date.now() // Add delay between checking for rooms if switch room
        }
        return Date.now() - this.lastChange > 1000
    }

    setRoom(x, y, rotation, roomId, locallyFound) {
        if (!roomId) return
        if (locallyFound) {
            if (this.identifiedRoomIds.has(roomId)) return
            this.identifiedRoomIds.add(roomId);
        }

        let coordsX = ~~((x + 200) / 32)
        let coordsY = ~~((y + 200) / 32)

        let locstr = coordsX + "," + coordsY

        let roomData = DungeonRoomData.getDataFromId(roomId)
        let type = Room.NORMAL

        const types = {
            "mobs": Room.NORMAL,
            "miniboss": Room.NORMAL,
            "rare": Room.NORMAL,
            "spawn": Room.SPAWN,
            "puzzle": Room.PUZZLE,
            "gold": Room.MINIBOSS,
            "fairy": Room.FAIRY,
            "blood": Room.BLOOD,
            "trap": Room.TRAP
        }
        if (roomData.type in types) type = types[roomData.type]

        let components = []

        switch (roomData.shape) { // Add room components based on shape
            case "1x1":
                components.push(new Position(x, y))
                break
            case "1x2":
                components.push(new Position(x, y))
                if (rotation === 0) {
                    components.push(new Position(x + 32, y))
                }
                else {
                    components.push(new Position(x, y + 32))
                }
                break
            case "1x3":
                components.push(new Position(x, y))
                if (rotation === 0) {
                    components.push(new Position(x + 32, y))
                    components.push(new Position(x + 64, y))
                }
                else {
                    components.push(new Position(x, y + 32))
                    components.push(new Position(x, y + 64))
                }
                break
            case "1x4":
                components.push(new Position(x, y))
                if (rotation === 0) {
                    components.push(new Position(x + 32, y))
                    components.push(new Position(x + 64, y))
                    components.push(new Position(x + 96, y))
                }
                else {
                    components.push(new Position(x, y + 32))
                    components.push(new Position(x, y + 64))
                    components.push(new Position(x, y + 96))
                }
                break
            case "2x2":
                components.push(new Position(x, y))
                components.push(new Position(x + 32, y))
                components.push(new Position(x, y + 32))
                components.push(new Position(x + 32, y + 32))
                break
            case "L":
                if (rotation !== 2) components.push(new Position(x, y))
                if (rotation !== 1) components.push(new Position(x, y + 32))
                if (rotation !== 3) components.push(new Position(x + 32, y))
                if (rotation !== 0) components.push(new Position(x + 32, y + 32))
                //top left isnt inside of the L room 
                if (rotation === 2) locstr = x + ',' + (y + 32);
                break
        }

        let room = this.rooms.get(locstr);
        if (room) { // Already a room there
            room = this.rooms.get(locstr)
            room.setType(type)
            room.components = components
            room.rotation = room.findRotation();
            room.roomId = roomId
        } else {
            room = new Room(this, type, components, roomId)
        }

        room.checkmarkState = 1

        room.components.forEach(c => {
            this.roomsArr.delete(this.rooms.get(c.arrayX + "," + c.arrayY))
            this.rooms.set(c.arrayX + "," + c.arrayY, room)
        })
        this.roomsArr.add(room)
        this.markChanged()

        if (locallyFound) {
            this.sendSocketData({
                type: "roomLocation",
                x, y, rotation, roomId
            })
        }
    }

    setDoor(x, y, ishorizontal, locallyFound, type = -1) {
        let rx = x - 4 // Offset xy of room placed in world so it matches nicely with rendering
        let ry = y - 4
        let pos = new Position(rx, ry);
        if (this.doors.get(pos.arrayX + "," + pos.arrayY)) return // Already door loaded there
        let id = World.getBlockAt(new BlockPos(x, 69, y)).type.getID() //get type of door

        if (type === -1) {
            if (id === 0) type = Room.UNKNOWN
            else if (id === 97) type = Room.NORMAL
            else if (id === 173) type = Room.BLACK
            else if (id === 159) type = Room.BLOOD
            else return // Return if door issnt made of those blocks (maby its not actually a door, eg back of green room)
        }

        if (ishorizontal) {
            {
                // Add Room.UNKNOWN to the right if needed

                let x2 = Math.floor((x + 15 + 8) / 32) * 32 - 8
                let y2 = Math.floor((y + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(this, Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1 // 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
            {
                // Add Room.UNKNOWN to the left if needed

                let x2 = Math.floor((x - 15 + 8) / 32) * 32 - 8
                let y2 = Math.floor((y + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(this, Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1// 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
        }
        else {
            {
                // Add Room.UNKNOWN to the top if needed

                let x2 = Math.floor((x + 8) / 32) * 32 - 8
                let y2 = Math.floor((y + 15 + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(this, Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1// 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
            {
                // Add Room.UNKNOWN to the bottom if needed

                let x2 = Math.floor((x + 8) / 32) * 32 - 8
                let y2 = Math.floor((y - 15 + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(this, Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1// 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
        }

        let door = new Door(type, pos, ishorizontal)
        this.addDoorToAdjacentRooms(door);
        this.doors.set(pos.arrayX + "," + pos.arrayY, door)
        if (type === Room.BLACK || type === Room.BLOOD) { this.witherDoors.add(door) }
        else { this.witherDoors.delete(door) }
        this.markChanged()

        if (locallyFound) {
            this.sendSocketData({
                type: "doorLocation",
                x, y, ishorizontal, doorType: type
            })
        }
    }

    onSecretCollect(type, x, y, z) {
        let loc = `${x},${y},${z}`

        let currentRoom = this.getCurrentRoom()
        if (type === "bat" && currentRoom?.data) {
            let closestD = Infinity
            currentRoom.data.secret_coords?.bat?.forEach(([rx, ry, rz]) => {
                let { x: x2, y: y2, z: z2 } = currentRoom.toRoomCoords(rx, ry, rz);

                if (this.collectedSecrets.has(x2 + "," + y2 + "," + z2)) return
                let distance = (x2 - x) ** 2 + (y2 - y) ** 2 + (z2 - z) ** 2
                if (distance < closestD) {
                    closestD = distance
                    loc = x2 + "," + y2 + "," + z2
                }
            });
        }
        if (type === "item" && currentRoom?.data) {
            let closestD = 25

            currentRoom.data.secret_coords?.item?.forEach(([rx, ry, rz]) => {
                let { x: x2, y: y2, z: z2 } = currentRoom.toRoomCoords(rx, ry, rz);

                if (this.collectedSecrets.has(x2 + "," + y2 + "," + z2)) return
                let distance = (x2 - x) ** 2 + (y2 - y) ** 2 + (z2 - z) ** 2
                if (distance < closestD) {
                    closestD = distance
                    loc = x2 + "," + y2 + "," + z2
                }
            });
        }

        this.collectedSecrets.add(loc)
        this.sendSocketData({ type: "secretCollect", location: loc })
    }

    updateScoreboardScore() {
        if (!settings.settings.fixScore) return;
        let lines = Scoreboard?.getLines();
        let score = this.cachedScore?.data?.total;
        if (!score) return;
        if (!lines || !lines.length) return
        for (let i = 0; i < lines.length; i++) {
            let cleanedLine = lines[i].getName().removeFormatting().replace(/[^\x00-\x7F]/g, "")
            // https://regex101.com/r/bIMFjc/1
            let match = cleanedLine.match(/^Cleared: (\d+)% \((\d+)\)$/)
            if (!match) continue
            let [_, completion, wrong_score] = match
            let scoreboardScore = lines[i].getPoints()
            changeScoreboardLine(scoreboardScore, `§rCleared: §c${completion}% §7(§b${score}§7)`, false);
            return
        }
    }
}

export default DungeonMap


let dungeonMapButtons = [
    ["Show RoomInfo In Chat", (dungeonMap, clickedRoom) => {
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
        clickedRoom.getLore().forEach(l => ChatLib.chat(l))
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
    }],
    ["Show RoomEvents In Chat", (dungeonMap, clickedRoom) => {
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
        for (let event of clickedRoom.roomEvents) {
            ChatLib.chat(toDisplayString(clickedRoom, event))
        }
        ChatLib.chat("&c" + ChatLib.getChatBreak("-"))
    }],
    ["Navigate", (dungeonMap, clickedRoom) => { ChatLib.chat("NAVIGATION NOT ADDED YET D:") }]
]