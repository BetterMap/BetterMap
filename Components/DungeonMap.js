import { f, m } from "../../mappings/mappings.js"
import Position from "../Utils/Position.js"
import MapPlayer from "./MapPlayer.js"
import Room from "./Room.js"

import { getScoreboardInfo, getTabListInfo, getRequiredSecrets } from "../Utils/Score"
import Door from "./Door.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"
import { dungeonOffsetX, dungeonOffsetY, MESSAGE_PREFIX, renderLore } from "../Utils/Utils.js"
import socketConnection from "../socketConnection.js"
import DataLoader from "../Utils/DataLoader.js"
import { fetch } from "../Utils/networkUtils.js"
import renderLibs from "../../guimanager/renderLibs.js"
import settings from "../Extra/Settings/CurrentSettings.js"
import { RoomEvents, toDisplayString } from "./RoomEvent.js"

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

        this.fullRoomScaleMap = 0 //how many pixels on the map is 32 blocks
        this.widthRoomImageMap = 0 //how wide the main boxes are on the map

        /**
         * @type {Set<Room>} So that its easy to loop over all rooms without duplicates
         */
        this.roomsArr = new Set()

        this.floor = floor //eg "M2" or "E" or "F7"
        this.floorNumber = this.floor == "E" ? 0 : parseInt(this.floor[this.floor.length - 1])

        this.deadPlayers = deadPlayers

        this.lastChanged = Date.now()

        this.dungeonTopLeft = undefined
        this.dungeonTopLeft2 = undefined

        /**
         * @type {Array<MapPlayer>}
         */
        this.players = []
        this.playersNameToId = {}

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

        // Rooms that were already identified
        this.identifiedRoomIds = new Set();
        this.identifiedPuzzleCount = 0;

        this.dungeonFinished = false

        let mimicDeadMessages = ["$SKYTILS-DUNGEON-SCORE-MIMIC$", "Mimic Killed!", "Mimic Dead!", "Mimic dead!"]

        this.triggers = []
        if (registerEvents) {
            this.triggers.push(register("chat", (msg) => {
                mimicDeadMessages.forEach(dmsg => {
                    if (msg.includes(dmsg)) this.mimicKilled = true
                })
            }).setChatCriteria("&r&9Party &8> ${msg}"))
            this.triggers.push(register("chat", (end, e) => {
                if (end.includes("Stats")) return

                this.dungeonFinished = true

                ChatLib.chat(MESSAGE_PREFIX + "Cleared room counts:")
                this.players.forEach(p => {
                    let m = new Message()
                    m.addTextComponent(new TextComponent(MESSAGE_PREFIX + "&3" + p.username + "&7 cleared "))

                    let roomLore = ""
                    p.roomsData.forEach(([players, room]) => {
                        let name = room.data?.name ?? room.shape
                        let type = room.typeToName()
                        let color = room.typeToColor()

                        let stackStr = players.length === 1 ? "" : " Stacked with " + players.filter(pl => pl !== p).map(p => p.username).join(", ")

                        roomLore += `&${color}${name} (${type})${stackStr}\n`
                    })

                    m.addTextComponent(new TextComponent("&6" + p.minRooms + "-" + p.maxRooms).setHover("show_text", roomLore.trim()))
                    m.addTextComponent(new TextComponent("&7 rooms and got &6" + p.secretsCollected + "&7 secrets"))

                    m.chat()
                })
            }).setChatCriteria('&r&c${*}e Catacombs &r&8- &r&eFloor${end}').setContains())
            //&r&r&r                     &r&cThe Catacombs &r&8- &r&eFloor I Stats&r
            //&r&r&r               &r&cMaster Mode Catacombs &r&8- &r&eFloor III Stats&r
            //&r&r&r                         &r&cThe Catacombs &r&8- &r&eFloor V&r

            this.triggers.push(register("entityDeath", (entity) => {
                if (entity.getClassName() !== "EntityZombie") return
                let e = entity.getEntity()
                if (!e.func_70631_g_()) return // .isChild()

                // Check all armor slots, if they are all null then mimic is die!
                if ([0, 1, 2, 3].every(a => !e.func_82169_q(a))) {
                    ChatLib.chat("Mimic Kapow!")
                    this.mimicKilled = true
                    this.sendSocketData({ type: "mimicKilled" })
                }
            }))

            this.triggers.push(register("chat", (info) => {
                let player = ChatLib.removeFormatting(info).split(" ")[0]

                this.scanFirstDeathForSpiritPet(player)
            }).setChatCriteria("&r&c ☠ ${info} and became a ghost&r&7.&r"))
        }
    }

    socketData(data) {
        switch (data.type) {
            case "playerLocation":
                let p = this.players[this.playersNameToId[data.username]]
                if (!p) return

                p.setXAnimate(data.x, 350)
                p.setYAnimate(data.z, 350)
                p.setRotateAnimate(data.yaw, 350)
                p.locallyUpdated = Date.now()
                break;
            case "roomSecrets":
                let currentRoom = this.rooms.get(data.x + ',' + data.y);

                if (!currentRoom || currentRoom.type === Room.UNKNOWN) return; //current room not loaded yet

                if (currentRoom.currentSecrets !== data.min) {
                    currentRoom.currentSecrets = data.min

                    this.markChanged() //re-render map incase of a secret count specific texturing
                }
                break;
            case "doorLocation":
                this.setDoor(data.x, data.y, data.ishorizontal, false, data.doorType)
                break;
            case "roomLocation":
                this.setRoom(data.x, data.y, data.rotation, data.roomId, false)
                break;
            case "roomId":
                let currentRoom2 = this.rooms.get(data.x + ',' + data.y);

                if (!currentRoom2 || currentRoom2.roomId || currentRoom2.type === Room.UNKNOWN) return; //current room not loaded yet, or already loaded id

                currentRoom2.roomId = data.roomId;

                this.markChanged() //re-render map incase of a room-id specific texturing
                break;
            case "mimicKilled":
                this.mimicKilled = true
                break;
        }
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
        } else {
            let up = door.position.arrayY - 1
            let down = door.position.arrayY
            let x = Math.round(door.position.arrayX - 0.3);
            let upRoom = this.rooms.get(x + ',' + up);
            let downRoom = this.rooms.get(x + ',' + down);
            if (upRoom) upRoom.addDoor(door);
            if (downRoom) downRoom.addDoor(door);
        }

    }

    sendSocketData(data) {
        socketConnection.sendDungeonData({ data, players: this.players.map(a => a.username) })
    }

    destroy() {
        this.rooms.clear()
        this.roomsArr.clear()
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
        let pl = Player.getPlayer()[f.sendQueue.EntityPlayerSP][m.getPlayerInfoMap]().sort((a, b) => sorter.compare(a, b)) //tab player list
        let i = 0

        let thePlayer = undefined
        for (let p of pl) {
            if (!p[m.getDisplayName.NetworkPlayerInfo]()) continue
            let line = p[m.getDisplayName.NetworkPlayerInfo]()[m.getUnformattedText]().trim().replace("♲ ", "") //TODO: Remove bingo symbol
            line = line.replace(/\[[A-Z]+?\] /, "") //support yt/admin rank
            if (line.endsWith(")") && line.includes(" (") && line.split(" (").length === 2 && line.split(" (")[0].split(" ").length === 1 && line.split(" (")[1].length > 3) {
                // This is a tab list line for a player
                let name = line.split(" ")[0]

                if (name === Player.getName()) { //move the current player to end of list
                    thePlayer = [p, name]
                    continue
                }

                if (!this.players[i]) {
                    this.players[i] = new MapPlayer(p, this, name)
                }
                this.players[i].networkPlayerInfo = p
                this.playersNameToId[name] = i

                i++
            }
        }

        if (thePlayer) { //move current player to end of list
            if (!this.players[i]) {
                this.players[i] = new MapPlayer(thePlayer[0], this, thePlayer[1])
            }
            this.players[i].networkPlayerInfo = thePlayer[0]
            this.playersNameToId[thePlayer[1]] = i
        }

        for (let player of this.players) {
            let room = player.getRoom(this);
            if (player.currentRoomCache !== room) {

                if (player.currentRoomCache) {
                    player.currentRoomCache.addEvent(RoomEvents.PLAYER_EXIT, player)
                }

                player.currentRoomCache = room

                room.addEvent(RoomEvents.PLAYER_ENTER, player)
            }
        }
    }

    /**
     * updates info in tab
     */
    updateTabInfo() {
        // ChatLib.chat(JSON.stringify(settings));
        if (!settings.settings.tabCryptCount && !settings.settings.tabSecretCount && (!settings.settings.tabMimic || this.floorNumber < 6)) return;
        //we pretend it's already done if the settings are disabled
        let modifiedCrypt = !settings.settings.tabCryptCount;
        let modifiedSecrets = !settings.settings.tabSecretCount;
        let modifiedMimic = !settings.settings.tabMimic || this.floorNumber < 6;
        const ChatComponentText = Java.type('net.minecraft.util.ChatComponentText');

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
                } else {
                    newTabLine = displayName + '§6/' + totalCryptCount;
                }
                playerInfo.func_178859_a(new ChatComponentText(newTabLine));
            }
            if (!modifiedSecrets && displayName.includes('Secrets Found:') && !displayName.includes('%')) {
                modifiedSecrets = true;
                const totalSecretCount = this.getScore().totalSecrets || "?"//this.roomsArr.reduce((prev, room) => prev + (room.maxSecrets || 0), 0);
                if (displayName.includes('/' + totalSecretCount)) return;
                var newTabLine;
                if (displayName.includes('/')) {
                    newTabLine = displayName.split('/')[0] + '§b/' + totalSecretCount;
                } else {
                    newTabLine = displayName + '§b/' + totalSecretCount;
                }
                playerInfo.func_178859_a(new ChatComponentText(newTabLine));
            }
        })

        //mimic isnt even in tab yet
        if (!modifiedMimic) {
            let tabInfoList = ['§r Mimic Dead: §cNO'];
            this.addLinesToTabList(tabInfoList, 'Crypt');
        }
    }

    addLinesToTabList = (lines, startCriteria) => {
        const ChatComponentText = Java.type('net.minecraft.util.ChatComponentText');
        let startToInject = false;
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

    syncPlayersThruSocket() {
        World.getAllPlayers().forEach(player => {
            if (!this.playersNameToId[ChatLib.removeFormatting(player.getName()).trim()]) return
            let p = this.players[this.playersNameToId[ChatLib.removeFormatting(player.getName()).trim()]]
            if (!p) return

            p.setX(player.getX())
            p.setY(player.getZ())
            p.setRotate(player.getYaw() + 180)
            p.locallyUpdated = Date.now()
            this.nameToUuid[player.getName().toLowerCase()] = player.getUUID().toString()

            this.sendSocketData({
                type: "playerLocation",
                username: ChatLib.removeFormatting(player.getName()).trim(),
                x: player.getX(),
                y: player.getY(),
                z: player.getZ(),
                yaw: player.getYaw() + 180
            })
        })
    }

    /**
     * Update players within render distance
     */
    updatePlayersFast() {
        World.getAllPlayers().forEach(player => {
            let p = this.players[this.playersNameToId[ChatLib.removeFormatting(player.getName()).trim()]]
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
            if (i > this.players.length) {
                return
            }
            while (!this.players[i] || this.deadPlayers.has(this.players[i].username.toLowerCase())) {
                i++
                if (i > this.players.length) {
                    return
                }
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

        let bytes = mapData[f.colors.MapData]

        if (!this.dungeonTopLeft) { //load top left and room width
            let roomX = 0
            let roomY = 0
            let roomwidth = 0
            for (let x = 0; x < 128; x += 5) {
                for (let y = 0; y < 128; y += 5) {
                    if (bytes[x + y * 128] === 30
                        && bytes[x + 1 + y * 128] === 30
                        && bytes[x + 2 + y * 128] === 30
                        && bytes[x + 3 + y * 128] === 30
                        && bytes[x + 5 + y * 128] === 30
                        && bytes[x + 10 + y * 128] === 30) {
                        roomX = x
                        roomY = y
                        while (bytes[(roomX - 1) + roomY * 128] === 30) {
                            roomX--
                        }
                        while (bytes[(roomX) + (roomY - 1) * 128] === 30) {
                            roomY--
                        }

                        while (bytes[(roomX + roomwidth) + roomY * 128] === 30) {
                            roomwidth++
                        }
                        break;
                    }
                }
                if (roomX) break;
            }
            if (!roomX || !roomY || !roomwidth) return

            this.fullRoomScaleMap = Math.floor(roomwidth * 5 / 4)
            this.widthRoomImageMap = roomwidth

            roomX = roomX % this.fullRoomScaleMap
            roomY = roomY % this.fullRoomScaleMap

            if (this.floor[this.floor.length - 1] === "1" || this.floor === "E") {
                roomX += this.fullRoomScaleMap
            }
            this.dungeonTopLeft = [roomX, roomY]
        }
        if (!this.dungeonTopLeft || !this.dungeonTopLeft2 || this.dungeonTopLeft.join(" ") !== this.dungeonTopLeft2.join(" ")) {
            this.dungeonTopLeft2 = this.dungeonTopLeft
            this.dungeonTopLeft = undefined
            return
        }

        let r1x1s = {
            30: Room.SPAWN,
            66: Room.PUZZLE,
            82: Room.FAIRY,
            18: Room.BLOOD,
            62: Room.TRAP,
            74: Room.MINIBOSS,
            85: Room.UNKNOWN
        }
        let r1x1sM = new Set(Object.keys(r1x1s).map(a => parseInt(a)))

        let f1Thing = false
        if (this.floor[this.floor.length - 1] === "1" || this.floor === "E") {
            f1Thing = true
        }
        for (let y = 0; y < (f1Thing ? 5 : 6); y++) {//Scan top left of rooms looking for valid rooms
            for (let x = 0; x < (f1Thing ? 4 : 6); x++) {
                let mapX = this.dungeonTopLeft[0] + this.fullRoomScaleMap * x
                let mapY = this.dungeonTopLeft[1] + this.fullRoomScaleMap * y
                let pixelColor = bytes[(mapX) + (mapY) * 128]
                if (pixelColor === 0) continue
                if (r1x1sM.has(pixelColor)) {
                    // Special room at that location
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(x + "," + y)
                    if (!currRoom) {
                        let room = new Room(this, r1x1s[pixelColor], [position], undefined)
                        this.rooms.set(x + "," + y, room)
                        this.roomsArr.add(room)
                        room.checkmarkState = room.type === Room.UNKNOWN ? Room.ADJACENT : Room.OPENED
                        this.markChanged()
                    } else {
                        if (currRoom.type !== r1x1s[pixelColor] && !currRoom.roomId) {
                            currRoom.setType(r1x1s[pixelColor])
                            currRoom.checkmarkState = currRoom.type === Room.UNKNOWN ? Room.ADJACENT : Room.OPENED
                            this.markChanged();
                        }
                        if (currRoom.checkmarkState === Room.ADJACENT && currRoom.type !== Room.UNKNOWN && r1x1s[pixelColor] !== Room.UNKNOWN) {
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
                    let currRoomLeft = bytes[(mapX - 1) + (mapY) * 128] === 63 ? this.rooms.get((x - 1) + "," + y) : undefined
                    let currRoomTop = bytes[(mapX) + (mapY - 1) * 128] === 63 ? this.rooms.get(x + "," + (y - 1)) : undefined
                    let currRoomTopRight = bytes[(mapX + this.fullRoomScaleMap - 1) + (mapY) * 128] === 63 && bytes[(mapX + this.fullRoomScaleMap) + (mapY - 1) * 128] === 63 ? this.rooms.get((x + 1) + "," + (y - 1)) : undefined

                    if (!currRoom && !currRoomLeft && !currRoomTop && !currRoomTopRight) { //no room and no merge

                        let room = new Room(this, Room.NORMAL, [position], undefined)

                        this.rooms.set(x + "," + y, room)
                        this.roomsArr.add(room)

                        this.markChanged()
                    } else { //already a normal room either in same location, or needs to merge up or left

                        if (currRoom && currRoom.checkmarkState === Room.ADJACENT) {
                            currRoom.checkmarkState = Room.OPENED
                            this.markChanged();
                        }
                        if (currRoom && currRoom.type !== Room.NORMAL) { //anopther room in the same location
                            currRoom.setType(Room.NORMAL)
                            currRoom.checkmarkState = Room.OPENED
                            this.markChanged()
                        }

                        if (currRoomLeft && currRoom !== currRoomLeft && currRoomLeft.type === Room.NORMAL) {
                            if (!currRoomLeft.components.some(a => position.equals(a))) { //need to merge left
                                if (currRoom) this.roomsArr.delete(currRoom)
                                currRoomLeft.addComponents(position)
                                this.rooms.set(x + "," + y, currRoomLeft)
                                this.markChanged()
                            }
                        }

                        if (currRoomTop && currRoom !== currRoomTop && currRoomTop.type === Room.NORMAL) {
                            if (!currRoomTop.components.some(a => position.equals(a))) { //need to merge up
                                if (currRoom) this.roomsArr.delete(currRoom)

                                currRoomTop.addComponents(position)
                                this.rooms.set(x + "," + y, currRoomTop)
                                this.markChanged()
                            }
                        }

                        if (currRoomTopRight && currRoom !== currRoomTopRight && currRoomTopRight.type === Room.NORMAL) {
                            if (!currRoomTopRight.components.some(a => position.equals(a))) { //need to merge up
                                if (currRoom) this.roomsArr.delete(currRoom)

                                currRoomTopRight.addComponents(position)
                                this.rooms.set(x + "," + y, currRoomTopRight)
                                this.markChanged()
                            }
                        }
                    }
                }

                // Check for checkmark

                // White tick
                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 34) {
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.arrayX + "," + position.arrayY)
                    if (currRoom && currRoom.checkmarkState !== Room.CLEARED) {
                        currRoom.checkmarkState = Room.CLEARED
                        this.markChanged()
                    }
                }
                // Green tick
                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 30) {
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.arrayX + "," + position.arrayY)
                    if (currRoom.checkmarkState !== Room.COMPLETED) {
                        currRoom.checkmarkState = Room.COMPLETED
                        currRoom.currentSecrets = currRoom.maxSecrets
                        this.markChanged()
                    }
                }
                // Red X
                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 18) {
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.arrayX + "," + position.arrayY)
                    if (currRoom && currRoom.checkmarkState !== Room.FAILED && currRoom.type !== Room.BLOOD) {
                        currRoom.checkmarkState = Room.FAILED
                        this.markChanged()
                    }
                }

                // Check for doors

                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY - 1) * 128] !== 0 //door above room
                    && bytes[(mapX) + (mapY - 1) * 128] === 0) {

                    let color = bytes[(mapX + this.widthRoomImageMap / 2) + (mapY - 1) * 128]

                    let type = Room.NORMAL
                    if (r1x1sM.has(color)) {
                        type = r1x1s[color]
                    }
                    if (color === 119) {
                        type = Room.BLACK
                    }

                    let position = new Position(0, 0, this)
                    position.mapX = mapX + this.widthRoomImageMap / 2 - 1
                    position.mapY = mapY - 3

                    position.worldX = Math.round(position.worldX)
                    position.worldY = Math.round(position.worldY)

                    if (!this.doors.get(position.arrayX + "," + position.arrayY)) {
                        // Door not in map, add new door
                        let door = new Door(type, position, false)
                        this.doors.set(position.arrayX + "," + position.arrayY, door)
                        this.addDoorToAdjacentRooms(door);

                    } else {
                        // Door already there
                        if (this.doors.get(position.arrayX + "," + position.arrayY).type !== type) {
                            this.doors.get(position.arrayX + "," + position.arrayY).type = type
                            this.markChanged()
                        }
                    }
                }

                if (bytes[(mapX - 1) + (mapY + this.widthRoomImageMap / 2) * 128] !== 0 //door left of room
                    && bytes[(mapX - 1) + (mapY) * 128] === 0) {

                    let color = bytes[(mapX - 1) + (mapY + this.widthRoomImageMap / 2) * 128]

                    let type = Room.NORMAL
                    if (r1x1sM.has(color)) {
                        type = r1x1s[color]
                    }
                    if (color === 119) {
                        type = Room.BLACK
                    }

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

                    } else {
                        // Door already there
                        if (this.doors.get(position.arrayX + "," + position.arrayY).type !== type) {
                            this.doors.get(position.arrayX + "," + position.arrayY).type = type
                            this.markChanged()
                        }
                    }
                }
            }
        }
    }

    updatePuzzles() {
        let puzzleNamesList = [];
        let readingPuzzles = false
        if (!TabList) return;
        TabList?.getNames()?.forEach((line) => {
            line = ChatLib.removeFormatting(line).trim();
            if (line.includes('Puzzles:')) {
                readingPuzzles = true;
            } else if (readingPuzzles) {
                if (line.includes('[')) {
                    if (!line.includes('???'))
                        puzzleNamesList.push(line.split(':')[0])
                } else {
                    readingPuzzles = false;
                }
            }
        });
        let puzzleCount = 0
        this.roomsArr.forEach((room) => {
            if (room.type === Room.PUZZLE && room.checkmarkState !== Room.ADJACENT)
                puzzleCount++;
        })
        if (puzzleNamesList.length <= this.identifiedPuzzleCount) {
            return
        };
        if (puzzleNamesList.length != puzzleCount) {
            return;
        }
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
                } else if (room.type == Room.PUZZLE) {
                    puzzleNamesList.shift();
                }
            }
        }
        this.identifiedPuzzleCount = puzzleNamesList.length;
    }

    /**
     * @returns {{"skill": Number,"exploration": Number,"time": Number,"bonus": Number,"total": Number,"mimic": Boolean,"secretsFound": Number, "crypts": Numbers, "deathPenalty": Number, "totalSecrets": Number, "minSecrets": Number, "totalCrypts": Number}}
     */
    getScore() {
        if (Date.now() - this.cachedScore.time < 500) { //Update score calculations every 500ms
            return this.cachedScore.data
        }

        let exploration = 0;
        let time = 100; //TODO:  Figure out how to actually do this one
        let skill = 0;
        let bonus = 0;

        // If floor is enterance the floor integer entered should be 0
        let requiredSecrets = getRequiredSecrets(parseInt(this.floor[this.floor.length - 1]) || 0, this.floor[0] === "M");
        let roomCompletion = getScoreboardInfo();
        let [secrets, crypts, deaths, unfinshedPuzzles, completedRoomsTab, collectedSecrets] = getTabListInfo();
        let completedRooms = 0;
        for (let room of this.rooms.values()) {
            if (room.isCleared())
                completedRooms++;
        }

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
        if (this.floorNumber >= 6 && this.mimicKilled)
            bonus += 2;

        let paul = DataLoader.currentMayorPerks.has("EZPZ") || settings.settings.forcePaul

        if (paul) {
            bonus += 10
        }

        let totalCryptCount = this.roomsArr.reduce((prev, room) => prev + (room.data?.crypts || 0), 0);

        let totalSecrets = Math.round(collectedSecrets / (secrets / 100))

        let deathPenalty = deaths * 2 - this.firstDeathHadSpirit //firstDeathHadSpirit gets coerced to number (0 or 1)

        let minSecrets = Math.ceil(totalSecrets * requiredSecrets / 100 * ((40 - bonus + deathPenalty) / 40))

        this.cachedScore = {
            time: Date.now(),
            data: {
                "skill": skill,
                "exploration": exploration,
                "time": time,
                "bonus": bonus,
                "total": skill + exploration + time + bonus,
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
        if (this.firstDeath) return
        this.firstDeath = true

        if (!this.nameToUuid[username.toLowerCase()]) return
        let uuid = this.nameToUuid[username.toLowerCase()]?.replace(/-/g, "")

        let apiKey = undefined//TODO: this

        if (apiKey) {
            fetch(`https://api.hypixel.net/skyblock/profiles?key=${apiKey}&uuid=${uuid}`).json(data => {
                if (!data.success) return

                let latestProfile = [0, undefined]

                data.profiles.forEach(p => {
                    if (p.members[uuid].last_save > latestProfile[0]) {
                        latestProfile = [p.members[uuid].last_save, p.members[uuid].pets.some(pet => pet.type === "SPIRIT" && pet.tier === "LEGENDARY")]
                    }
                })

                if (latestProfile[1]) {
                    this.firstDeathHadSpirit = true
                    if (username === "You") {
                        ChatLib.chat(MESSAGE_PREFIX + username + " have a spirit pet!")
                    } else {
                        ChatLib.chat(MESSAGE_PREFIX + username + " has a spirit pet!")
                    }
                } else {
                    if (username === "You") {
                        ChatLib.chat(MESSAGE_PREFIX + username + " dont have a spirit pet!")
                    } else {
                        ChatLib.chat(MESSAGE_PREFIX + username + " does not have a spirit pet!")
                    }
                }
            })
        } else {
            fetch(`https://soopy.dev/api/v2/player_skyblock/${uuid}`).json(data => {
                if (!data.success) return

                if (data.data.profiles[data.data.stats.currentProfileId].members[uuid].pets.some(pet => pet.type === "SPIRIT" && pet.tier === "LEGENDARY")) {
                    this.firstDeathHadSpirit = true
                    if (username === "You") {
                        ChatLib.chat(MESSAGE_PREFIX + username + " have a spirit pet!")
                    } else {
                        ChatLib.chat(MESSAGE_PREFIX + username + " has a spirit pet!")
                    }
                } else {
                    if (username === "You") {
                        ChatLib.chat(MESSAGE_PREFIX + username + " dont have a spirit pet!")
                    } else {
                        ChatLib.chat(MESSAGE_PREFIX + username + " does not have a spirit pet!")
                    }
                }
            })
        }
    }

    secretCountActionBar(min, max) {
        if (!this.canUpdateRoom()) return
        let x = ~~((Player.getX() + dungeonOffsetX) / 32);
        let y = ~~((Player.getZ() + dungeonOffsetY) / 32);

        let currentRoom = this.rooms.get(x + ',' + y);

        if (!currentRoom || currentRoom.type === Room.UNKNOWN) return; //current room not loaded yet

        if (currentRoom.currentSecrets !== min && currentRoom.maxSecrets === max) {
            currentRoom.currentSecrets = min

            this.markChanged() //re-render map incase of a secret count specific texturing

            this.sendSocketData({
                type: 'roomSecrets',
                min: min,
                x: x,
                y: y
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

        if (!roomId) return; //room id not loaded or inbetween 2 rooms
        if (this.identifiedRoomIds.has(roomId)) return; //already loaded room

        let currentRoom = this.rooms.get(x + ',' + y);

        if (!currentRoom || currentRoom.roomId || currentRoom.type === Room.UNKNOWN) return; //current room not loaded yet, or already loaded id

        currentRoom.roomId = roomId;
        this.identifiedRoomIds.add(roomId);

        this.markChanged() //re-render map incase of a room-id specific texturing

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

        if (button === 1) { //right click -> store x, y and render even if chat not open
            this.dropdownXY = undefined
            if (this.cursorStoreXY) {
                this.cursorStoreXY = undefined
            } else {
                this.cursorStoreXY = [cursorX, cursorY]
            }
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


        if (!this.rooms.has(coordsX + ',' + coordsY)) { //no room at mouse
            return;
        }

        let room = this.rooms.get(coordsX + ',' + coordsY); //hovered room

        if (button !== 0) return //ignore buttons like middle mouse

        this.dropdownXY = [cursorX + 8, cursorY - 16, room]
        this.cursorStoreXY = undefined

    }

    drawRoomTooltip(context, cursorX, cursorY) {
        if (this.cursorStoreXY) {
            [cursorX, cursorY] = this.cursorStoreXY
        }

        let { x, y, size } = context.getMapDimensions();

        if (this.dropdownXY) {
            Renderer.retainTransforms(true)
            Renderer.translate(0, 0, 100)
            Renderer.drawRect(Renderer.color(0, 0, 0), this.dropdownXY[0], this.dropdownXY[1], 75, 25 * dungeonMapButtons.length)

            dungeonMapButtons.forEach(([name, callback], index) => {

                let bx = this.dropdownXY[0] + 1
                let by = this.dropdownXY[1] + 25 * index + 1
                let bw = 73
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

        if (!this.rooms.has(coordsX + ',' + coordsY)) { //no room at mouse
            return;
        }

        let room = this.rooms.get(coordsX + ',' + coordsY);

        let roomLore = room.getLore()

        renderLore(cursorX, cursorY, roomLore)

        return;
    }

    canUpdateRoom() {
        let currRoom = this.getRoomXYWorld().join(",")
        if (this.roomXY !== currRoom) {
            this.roomXY = currRoom
            this.lastChange = Date.now() //add delay between checking for rooms if switch room
        }
        return Date.now() - this.lastChange > 1000
    }

    //==============================
    // UPDATING FROM WORLD CODE
    //==============================
    updateFromWorld() {
        let roomid = this.getCurrentRoomId()
        if (!roomid) return //no roomid eg inbetween 2 rooms
        if (!this.getCurrentRoomData()) return

        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 9 //top left of current 1x1 that players in
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 9

        let playerMapX = ~~((Player.getX() + 200) / 32);
        let playerMapY = ~~((Player.getZ() + 200) / 32);
        let currentRoom = this.rooms.get(playerMapX + ',' + playerMapY);

        if (!currentRoom || !currentRoom.roomId || currentRoom.type === Room.UNKNOWN) { //current room not already identified
            if (roomid !== this.lastRoomId && this.canUpdateRoom()) { //room id changed, check current room
                this.lastRoomId = roomid

                let roomWorldData = this.getRoomWorldData()

                let rotation = roomWorldData.width > roomWorldData.height ? 0 : 1

                // L shape rooms only rooms that 'need' rotation all others can be 0 -> horizontal or 1-> verticle

                if (this.getCurrentRoomData().shape === "L") rotation = roomWorldData.rotation
                if (this.getCurrentRoomData().type === "spawn") {
                    roomWorldData.x = x + 1
                    roomWorldData.y = y + 1

                    this.setAirLocs.add((x - 1) + "," + (y - 1))
                    this.setAirLocs.add((x) + "," + (y - 1))
                    this.setAirLocs.add((x - 1) + "," + (y))

                    this.setAirLocs.add((x + 32) + "," + (y - 1))
                    this.setAirLocs.add((x + 32 - 1) + "," + (y - 1))
                    this.setAirLocs.add((x + 32) + "," + (y))

                    this.setAirLocs.add((x - 1) + "," + (y + 32))
                    this.setAirLocs.add((x - 1) + "," + (y - 1 + 32))
                    this.setAirLocs.add((x) + "," + (y + 32))

                    this.setAirLocs.add((x + 32) + "," + (y + 32))
                    this.setAirLocs.add((x + 32 - 1) + "," + (y + 32))
                    this.setAirLocs.add((x + 32) + "," + (y - 1 + 32))
                }

                this.setRoom(roomWorldData.x, roomWorldData.y, rotation, roomid, true)
                this.identifiedRoomIds.add(roomid);
            }
        }


        if (this.lastXY !== x + "," + y) {
            this.lastXY = x + "," + y

            // Checking for doors on all sides of room
            if (this.getBlockAt(x + 16, 73, y) !== 0) {
                this.setDoor(x + 16, y, 0, true)
            }
            if (this.getBlockAt(x, 73, y + 16) !== 0) {
                this.setDoor(x, y + 16, 1, true)
            }
            if (this.getBlockAt(x + 16, 73, y + 32) !== 0) {
                this.setDoor(x + 16, y + 32, 0, true)
            }
            if (this.getBlockAt(x + 32, 73, y + 16) !== 0) {
                this.setDoor(x + 32, y + 16, 1, true)
            }
        }
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
        switch (roomData.type) {
            case "mobs":
                type = Room.NORMAL
                break
            case "miniboss":
                type = Room.NORMAL
                break
            case "rare":
                type = Room.NORMAL
                break
            case "spawn":
                type = Room.SPAWN
                break
            case "puzzle":
                type = Room.PUZZLE
                break
            case "gold":
                type = Room.MINIBOSS
                break
            case "fairy":
                type = Room.FAIRY
                break
            case "blood":
                type = Room.BLOOD
                break
            case "trap":
                type = Room.TRAP
                break
        }

        let components = []

        switch (roomData.shape) { //add room components based on shape
            case "1x1":
                components.push(new Position(x, y))
                break
            case "1x2":
                components.push(new Position(x, y))
                if (rotation === 0) {
                    components.push(new Position(x + 32, y))
                } else {
                    components.push(new Position(x, y + 32))
                }
                break
            case "1x3":
                components.push(new Position(x, y))
                if (rotation === 0) {
                    components.push(new Position(x + 32, y))
                    components.push(new Position(x + 64, y))
                } else {
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
                } else {
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
                break
        }

        if (this.rooms.get(locstr)) { //already a room there
            let room = this.rooms.get(locstr)
            room.setType(type)
            room.components = components
            room.rotation = room.findRotation();
            room.roomId = roomId
            room.checkmarkState = 1
            room.components.forEach(c => {
                this.roomsArr.delete(this.rooms.get(c.arrayX + "," + c.arrayY))
                this.rooms.set(c.arrayX + "," + c.arrayY, room)
            })
            this.roomsArr.add(room)
            this.markChanged()
            return
        }

        let room = new Room(this, type, components, roomId)

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
        let rx = x - 4 //offset xy of room placed in world so it matches nicely with rendering
        let ry = y - 4
        let pos = new Position(rx, ry);
        if (this.doors.get(pos.arrayX + "," + pos.arrayY)) return //already door loaded there

        let id = World.getBlockStateAt(new BlockPos(x, 69, y)).getBlockId() //get type of door
        if (type === -1) {
            if (id === 0) type = Room.UNKNOWN
            else if (id === 97) type = Room.NORMAL
            else if (id === 173) type = Room.BLACK
            else if (id === 159) type = Room.BLOOD
            else return //return if door issnt made of those blocks (maby its not actually a door, eg back of green room)
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
        } else {
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
        this.markChanged()

        if (locallyFound) {
            this.sendSocketData({
                type: "doorLocation",
                x, y, ishorizontal, doorType: type
            })
        }
    }

    /**
     * NOTE: check for roomid is falsy before using
     * @returns {String} the current room id
     */
    getCurrentRoomId() {
        if (Scoreboard.getLines().length === 0) return undefined
        let id = Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1).getName().trim().split(" ").pop()

        if (!id.includes(",")) return undefined  //not id, eg id not on scoreboard

        return id
    }

    /**
     * @returns {[Number, Number]} the x and y location of the rooms 'location' (top left of all rooms, shifting down by 1 if needed to in L)
     */
    getRoomXYWorld() {
        let roomData = this.getRoomWorldData()
        if (roomData.rotation === 4) {
            return [roomData.x, roomData.y + 32]
        }

        return [roomData.x, roomData.y]
    }

    getCurrentRoomData() {
        let id = this.getCurrentRoomId()
        if (!id) return undefined//no room id
        return DungeonRoomData.getDataFromId(id)
    }

    getRotation(x, y, width, height, roofY) {
        let currRoomData = this.getCurrentRoomData()
        if (!currRoomData) return -1

        if (currRoomData.shape !== "L") {
            if (this.getTopBlockAt(x, y, roofY) === 11) return 0
            if (this.getTopBlockAt(x + width, y, roofY) === 11) return 1
            if (this.getTopBlockAt(x + width, y + height, roofY) === 11) return 2
            if (this.getTopBlockAt(x, y + height, roofY) === 11) return 3
        } else {
            let one = this.getTopBlockAt2(x + width / 2 + 1, y + height / 2, roofY)
            let two = this.getTopBlockAt2(x + width / 2 - 1, y + height / 2, roofY)
            let three = this.getTopBlockAt2(x + width / 2, y + height / 2 + 1, roofY)
            let four = this.getTopBlockAt2(x + width / 2, y + height / 2 - 1, roofY)

            if (one === 0 && three === 0) return 0
            if (two === 0 && three === 0) return 1
            if (one === 0 && four === 0) return 3
            if (two === 0 && four === 0) return 2//3 IS SO TOXIK HGOLY HEL I HATE L SHAPE ROOMS WHY DO THIS TO ME
        }

        return -1
    }

    getBlockIdAt(x, y, z) {
        if (this.setAirLocs?.has(x + "," + z)) {
            return 0
        }

        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }

    getRoomWorldData() {
        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 8
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 8
        let width = 30
        let height = 30

        let roofY = this.getRoofAt(x, y)

        while (this.getBlockIdAt(x - 1, roofY, y) !== 0) {
            x -= 32
            width += 32
        }
        while (this.getBlockIdAt(x, roofY, y - 1) !== 0) {
            y -= 32
            height += 32
        }
        while (this.getBlockIdAt(x - 1, roofY, y) !== 0) { //second iteration incase of L shape
            x -= 32
            width += 32
        }
        while (this.getBlockIdAt(x + width + 1, roofY, y) !== 0) {
            width += 32
        }
        while (this.getBlockIdAt(x, roofY, y + height + 1) !== 0) {
            height += 32
        }
        while (this.getBlockIdAt(x + width, roofY, y + height + 1) !== 0) { //second iteration incase of L shape
            height += 32
        }
        while (this.getBlockIdAt(x + width + 1, roofY, y + height) !== 0) { //second iteration incase of L shape
            width += 32
        }
        while (this.getBlockIdAt(x + width, roofY, y - 1) !== 0
            && this.getBlockIdAt(x + width, roofY, y - 1 + (height === 30 ? 0 : 32)) !== 0) {//second iteration incase of L shape
            y -= 32
            height += 32
        }
        while (this.getBlockIdAt(x - 1, roofY, y + height) !== 0
            && this.getBlockIdAt(x - 1 + (width === 30 ? 0 : 32), roofY, y + height) !== 0) { //third iteration incase of L shape
            x -= 32
            width += 32
        }

        let rotation = this.getRotation(x, y, width, height, roofY);
        return {
            x,
            y,
            width,
            height,
            cx: x + width / 2,
            cy: y + height / 2,
            rotation: rotation
        }
    }

    getRoofAt(x, z) {
        let y = 255
        while (y > 0 && World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId() === 0) y--

        return y
    }

    getTopBlockAt(x, z, y) {
        if (!y) y = this.getRoofAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getMetadata()
    }
    getBlockAt(x, y, z) {
        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }
    getTopBlockAt2(x, z, y) {
        if (!y) y = this.getRoofAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }
}

export default DungeonMap


let dungeonMapButtons = [
    ["Show RoomInfo In Chat", (dungeonMap, clickedRoom) => {
        clickedRoom.getLore().forEach(l => ChatLib.chat(l))
    }],
    ["Show RoomEvents In Chat", (dungeonMap, clickedRoom) => {
        for (let event of clickedRoom.roomEvents) {
            ChatLib.chat(toDisplayString(clickedRoom, event))
        }
    }],
    ["Navigate", (dungeonMap, clickedRoom) => { ChatLib.chat("NAVIGATION NOT ADDED YET D:") }]
]