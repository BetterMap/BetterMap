import { f, m } from "../../mappings/mappings.js"
import Position from "../Utils/Position.js"
import MapPlayer from "./MapPlayer.js"
import Room from "./Room.js"

import { getScoreboardInfo, getTabListInfo, getRequiredSecrets } from "../Utils/Score"
import Door from "./Door.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"
import { renderLore } from "../Utils/Utils.js"

const BufferedImage = Java.type("java.awt.image.BufferedImage")

let PlayerComparator = Java.type("net.minecraft.client.gui.GuiPlayerTabOverlay").PlayerComparator
let c = PlayerComparator.class.getDeclaredConstructor()
c.setAccessible(true);
let sorter = c.newInstance()

const dungeonOffsetX = 200;
const dungeonOffsetY = 200;

let debug = 0;

class DungeonMap {
    constructor(floor, deadPlayers) {
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

        this.deadPlayers = deadPlayers

        this.lastChanged = Date.now()

        this.dungeonTopLeft = undefined

        /**
         * @type {Array<MapPlayer>}
         */
        this.players = []
        this.playersNameToId = {}

        this.lastRenderContext = 1 //starting at one so that if(renderContext) returns true always if it exists
        this.renderContexts = []

        this.mimicKilled = false;


        //load from world datra

        this.lastRoomId = undefined
        this.lastChange = 0
        this.roomXY = this.getRoomXYWorld().join(",")
        this.lastXY = undefined

        //simulate changing bloccks to air to fix green room not having air border around it
        this.setAirLocs = new Set()

        //rooms that were already identified
        this.identifiedRoomIds = new Set();
    }

    destroy() {
        this.rooms.clear()
        this.roomsArr.clear()
    }

    /**
     * This will re-render all render images
     */
    markChanged() {
        this.lastChanged = Date.now()
    }

    /**
     * Update players from tab list
     */
    updatePlayers() {
        let pl = Player.getPlayer()[f.sendQueue.EntityPlayerSP][m.getPlayerInfoMap]().sort((a, b) => sorter.compare(a, b)) //tab player list
        let i = 0

        let thePlayer = undefined
        for (let p of pl) {
            if (!p[m.getDisplayName.NetworkPlayerInfo]()) continue
            let line = p[m.getDisplayName.NetworkPlayerInfo]()[m.getUnformattedText]().trim().replace("♲ ", "") //TODO: Remove bingo symbol and support yt/admin rank
            if (line.endsWith(")") && line.includes(" (") && line.split(" (").length === 2 && line.split(" (")[0].split(" ").length === 1 && line.split(" (")[1].length > 5) {
                //this is a tab list line for a player
                let name = line.split(" ")[0]

                if (name === Player.getName()) { //move the current player to end of list
                    thePlayer = [p, name]
                    continue
                }

                if (!this.players[i]) {
                    this.players[i] = new MapPlayer(p, this, name)
                }
                this.playersNameToId[name] = i

                i++
            }
        }

        if (thePlayer) { //move current player to end of list
            if (!this.players[i]) {
                this.players[i] = new MapPlayer(thePlayer[0], this, thePlayer[1])
            }
            this.playersNameToId[thePlayer[1]] = i
        }
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
            while (!this.players[i] || this.deadPlayers.has(this.players[i].username)) {
                i++
                if (i > this.players.length) {
                    return
                }
            }

            let iconX = MathLib.map(vec4b.func_176112_b() - this.dungeonTopLeft[0] * 2, 0, 256, 0, 138)
            let iconY = MathLib.map(vec4b.func_176113_c() - this.dungeonTopLeft[1] * 2, 0, 256, 0, 138)
            let x = iconX / (128 / 6) * 32 - 96
            let y = iconY / (128 / 6) * 32 - 96
            let rot = vec4b.func_176111_d()
            rot = rot * 360 / 16 + 180

            this.players[i].setRotateAnimate(rot)
            this.players[i].setXAnimate(x)
            this.players[i].setYAnimate(y)

            i++
        });
    }

    /**
     * Update dungeon from map data
     * @param {Object} mapData 
     * @returns 
     */
    updateFromMap(mapData) {
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
                        && bytes[x + 3 + y * 128] === 30) {
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
                    //special room at that location
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(x + "," + y)
                    if (!currRoom) {
                        let room = new Room(r1x1s[pixelColor], [position], undefined)
                        this.rooms.set(x + "," + y, room)
                        this.roomsArr.add(room)
                        room.checkmarkState = room.type === Room.UNKNOWN ? Room.ADJACENT : Room.OPENED
                        this.markChanged()
                    } else {
                        if (currRoom.type !== r1x1s[pixelColor]) { //TODO: account for incorrect room being here due to early map scanning
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
                    //normal room at that location
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(x + "," + y)

                    //current rooms to the left and above, incase a merge needs to happen
                    //will be undefined if no merge needs to happen
                    let currRoomLeft = bytes[(mapX - 1) + (mapY) * 128] === 63 ? this.rooms.get((x - 1) + "," + y) : undefined
                    let currRoomTop = bytes[(mapX) + (mapY - 1) * 128] === 63 ? this.rooms.get(x + "," + (y - 1)) : undefined

                    if (!currRoom && !currRoomLeft && !currRoomTop) { //no room and no merge

                        let room = new Room(Room.NORMAL, [position], undefined)

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

                                currRoomLeft.components.push(position)
                                this.rooms.set(x + "," + y, currRoomLeft)
                                this.markChanged()
                            }
                        }

                        if (currRoomTop && currRoom !== currRoomTop && currRoomTop.type === Room.NORMAL) {
                            if (!currRoomTop.components.some(a => position.equals(a))) { //need to merge up
                                if (currRoom) this.roomsArr.delete(currRoom)

                                currRoomTop.components.push(position)
                                this.rooms.set(x + "," + y, currRoomTop)
                                this.markChanged()
                            }
                        }
                    }
                }

                //check for checkmark

                //White tick
                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 34) {
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.arrayX + "," + position.arrayY)
                    if (currRoom && currRoom.checkmarkState < Room.CLEARED) {
                        currRoom.checkmarkState = Room.CLEARED
                        this.markChanged()
                    }
                }
                //Green tick
                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 30) {
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.arrayX + "," + position.arrayY)
                    if (currRoom.checkmarkState < Room.COMPLETED) {
                        currRoom.checkmarkState = Room.COMPLETED
                        this.markChanged()
                    }
                }
                //red X
                //Apparanatly puzzles dont show crosses when failed anymore
                // if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 18) { 
                //     let position = new Position(0, 0, this)
                //     position.mapX = mapX
                //     position.mapY = mapY
                //     let currRoom = this.rooms.get(position.worldX + "," + position.worldY)
                //     currRoom.checkmarkState = Room.FAILED
                //     this.markChanged()
                // }

                //Check for doors

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

                    if (!this.doors.get(position.worldX + "," + position.worldY)) {
                        //door not in map, add new door
                        this.doors.set(position.worldX + "," + position.worldY, new Door(type, position, false))

                    } else {
                        //door already there
                        this.doors.get(position.worldX + "," + position.worldY).type = type

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

                    if (!this.doors.get(position.worldX + "," + position.worldY)) {
                        //door not in map, add new door
                        this.doors.set(position.worldX + "," + position.worldY, new Door(type, position, true))

                    } else {
                        //door already there
                        this.doors.get(position.worldX + "," + position.worldY).type = type
                    }
                }
            }
        }
    }

    getScore() {
        let exploration = 0;
        let time = 100; //TODO:  Figure out how to actually do this one
        let skill = 0;
        let bonus = 0;

        let requiredSecrets = getRequiredSecrets(7, false); //TODO: load floor and master mode from this.floor
        let roomCompletion = getScoreboardInfo();
        let [secrets, crypts, deaths, unfinshedPuzzles, completedRoomsTab] = getTabListInfo();
        let completedRooms = 0;
        for (let room of this.rooms.values()) {
            if (room.isCleared())
                completedRooms++;
        }

        //if map data is incomplete, it's worth using the higher number
        completedRooms = Math.max(completedRooms, completedRoomsTab);

        //estimate total room count based of the cleared percentage and the tab info. If nothing is cleared, assume 36 rooms
        totalRoomEstimate = roomCompletion ? Math.round(completedRoomsTab / roomCompletion * 100) : 36;

        //exploration
        exploration += Math.min(40, ~~(secrets / requiredSecrets * 40));
        exploration += Math.min(60, ~~(completedRooms / totalRoomEstimate * 60));

        //time
        //NOPE

        //skill
        //TODO: Check for spirit pet through API
        skill += ~~(completedRooms / totalRoomEstimate * 80) - unfinshedPuzzles * 10;
        skill -= deaths * 2;
        //cant physically drop below 20 score, no matter what
        skill = Math.max(0, skill);
        skill += 20;

        //bonus
        bonus += Math.min(5, crypts);
        if (this.floor >= 6 && this.mimicKilled)
            bonus += 2;
        //TODO: Check for Paul through API
        //TODO: Add toggle to check add +10 score anyway, cause of jerry mayor

        return {
            "skill": skill,
            "exploration": exploration,
            "time": time,
            "bonus": bonus
        }
    }

    secretCountActionBar(min, max) {
        if (!this.canUpdateRoom()) return
        let x = ~~((Player.getX() + dungeonOffsetX) / 32);
        let y = ~~((Player.getZ() + dungeonOffsetY) / 32);

        let currentRoom = this.rooms.get(x + ',' + y);

        if (!currentRoom || currentRoom.type === Room.UNKNOWN) return; //current room not loaded yet

        if (currentRoom.currentSecrets !== min || currentRoom.maxSecrets !== max) {
            currentRoom.maxSecrets = max
            currentRoom.currentSecrets = min

            this.markChanged() //re-render map incase of a secret count specific texturing
        }
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
    }

    drawRoomTooltip(context, cursorX, cursorY) {
        let { x, y, size } = context.getMapDimensions();
        const borderPixels = 27 / 256 * size;
        if (cursorX < x + borderPixels || cursorY < y + borderPixels || cursorX > x + size - borderPixels || cursorY > y + size - borderPixels) return;

        //Mouse somewhere on map

        let mapRoomSize = 26 / 256 * size;
        let mapGapSize = 6 / 256 * size;

        xCoord = ~~((cursorX - x - borderPixels) / (mapRoomSize + mapGapSize));
        yCoord = ~~((cursorY - y - borderPixels) / (mapRoomSize + mapGapSize));

        if (!this.rooms.has(xCoord + ',' + yCoord)) { //no room at mouse
            return;
        }

        let room = this.rooms.get(xCoord + ',' + yCoord);

        let roomLore = []
        if (room.roomId) { //TODO: COLOR CODES!
            roomLore.push(room.data?.name || '???')
            roomLore.push("&8" + (room.roomId || ""))
            roomLore.push("Secrets: " + room.currentSecrets + ' / ' + room.maxSecrets)
            roomLore.push("Spiders: " + (room.data?.spiders ? "Yes" : "No"))
        } else {
            roomLore.push('Unknown room!')
        }

        renderLore(cursorX, cursorY, roomLore)

        return;
        if (xCoord < 0 || xCoord >= dungeon.width || yCoord < 0 || yCoord >= dungeon.height) return;
        if (!(xCoord in dungeon.roomLookupMap) || !(yCoord in dungeon.roomLookupMap[xCoord])) return;
        if (!room) return;
        renderTooltip(x, y, room.getInfoTooltip(), room.identified);

    }

    canUpdateRoom() {
        if (this.roomXY !== this.getRoomXYWorld().join(",")) {
            this.roomXY = this.getRoomXYWorld().join(",")
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

                //L shape rooms only rooms that 'need' rotation all others can be 0 -> horisontal or 1-> verticle

                if (this.getCurrentRoomData().shape === "L") rotation = roomWorldData.rotation
                if (this.getCurrentRoomData().type === "spawn") {
                    roomWorldData.x = x + 1
                    roomWorldData.y = y + 1

                    this.setAirLocs.add((x - 1) + "," + (y - 1))
                    this.setAirLocs.add((x - 1 + 1) + "," + (y - 1))
                    this.setAirLocs.add((x - 1) + "," + (y - 1 + 1))

                    this.setAirLocs.add((x - 1 + 32) + "," + (y - 1))
                    this.setAirLocs.add((x - 1 + 32 - 1) + "," + (y - 1 + 32))
                    this.setAirLocs.add((x - 1 + 32) + "," + (y - 1 - 1))

                    this.setAirLocs.add((x - 1) + "," + (y - 1 + 32))
                    this.setAirLocs.add((x - 1 - 1 + 1) + "," + (y - 1 + 32))
                    this.setAirLocs.add((x) + "," + (y - 1 + 1 + 32))

                    this.setAirLocs.add((x - 1 + 32) + "," + (y - 1 + 32))
                    this.setAirLocs.add((x - 1 + 32 + 1) + "," + (y - 1 + 32))
                    this.setAirLocs.add((x - 1 + 32) + "," + (y - 1 + 1 + 32))
                }

                this.setRoom(roomWorldData.x, roomWorldData.y, rotation, roomid)
                this.identifiedRoomIds.add(roomid);
            }
        }


        if (this.lastXY !== x + "," + y) {
            this.lastXY = x + "," + y

            //checking for doors on all sides of room
            if (this.getBlockAt(x + 16, 73, y) !== 0) {
                this.setDoor(x + 16, y, 0)
            }
            if (this.getBlockAt(x, 73, y + 16) !== 0) {
                this.setDoor(x, y + 16, 1)
            }
            if (this.getBlockAt(x + 16, 73, y + 32) !== 0) {
                this.setDoor(x + 16, y + 32, 0)
            }
            if (this.getBlockAt(x + 32, 73, y + 16) !== 0) {
                this.setDoor(x + 32, y + 16, 1)
            }
        }
    }
    setRoom(x, y, rotation, roomId) {
        let locstr = x + "," + y

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
            room.roomId = roomId
            room.checkmarkState = 1
            this.roomsArr.add(room)
            room.components.forEach(c => {
                this.rooms.set(c.arrayX + "," + c.arrayY, room)
            })
            this.markChanged()
            return
        }

        let room = new Room(type, components, roomId)

        room.checkmarkState = 1

        this.roomsArr.add(room)
        room.components.forEach(c => {
            this.rooms.set(c.arrayX + "," + c.arrayY, room)
        })
        this.markChanged()
    }

    setDoor(x, y, ishorisontal) {
        let rx = x - 4 //offset xy of room placed in world so it matches nicely with rendering
        let ry = y - 4
        if (this.doors.get(rx + "," + ry)) return //already door loaded there

        let id = World.getBlockStateAt(new BlockPos(x, 69, y)).getBlockId() //get type of door
        if (id === 0) type = Room.UNKNOWN
        else if (id === 97) type = Room.NORMAL
        else if (id === 173) type = Room.BLACK
        else if (id === 159) type = Room.BLOOD
        else return //return if door issnt made of those blocks (maby its not actually a door, eg back of green room)

        if (ishorisontal) {
            {
                //add Room.UNKNOWN to the right if needed

                let x2 = Math.floor((x + 15 + 8) / 32) * 32 - 8
                let y2 = Math.floor((y + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1 // 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
            {
                //add Room.UNKNOWN to the left if needed

                let x2 = Math.floor((x - 15 + 8) / 32) * 32 - 8
                let y2 = Math.floor((y + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1// 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
        } else {
            {
                //add Room.UNKNOWN to the top if needed

                let x2 = Math.floor((x + 8) / 32) * 32 - 8
                let y2 = Math.floor((y + 15 + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1// 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
            {
                //add Room.UNKNOWN to the bottom if needed

                let x2 = Math.floor((x + 8) / 32) * 32 - 8
                let y2 = Math.floor((y - 15 + 8) / 32) * 32 - 8

                let mapCoordX = ~~((x2 + dungeonOffsetX) / 32);
                let mapCoordY = ~~((y2 + dungeonOffsetY) / 32);

                if (!this.rooms.get(mapCoordX + "," + mapCoordY)) {
                    let room = new Room(Room.UNKNOWN, [new Position(x2, y2)], undefined)
                    room.checkmarkState = 1// 1 -> adjacent/not opened
                    this.rooms.set(mapCoordX + "," + mapCoordY, room)
                    this.roomsArr.add(room)
                }
            }
        }


        let door = new Door(type, new Position(rx, ry), ishorisontal)
        this.doors.set(rx + "," + ry, door)
        this.markChanged()
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
        if (this.setAirLocs?.has(x + "," + z)) return 0

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
            && this.getBlockIdAt(x + width, roofY, y - 1 + 32) !== 0) {//second iteration incase of L shape
            y -= 32
            height += 32
        }
        while (this.getBlockIdAt(x - 1, roofY, y + height) !== 0
            && this.getBlockIdAt(x - 1 + 32, roofY, y + height) !== 0) { //third iteration incase of L shape
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