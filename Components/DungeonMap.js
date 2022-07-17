import { f, m } from "../../mappings/mappings.js"
import Position from "../Utils/Position.js"
import MapPlayer from "./MapPlayer.js"
import Room from "./Room.js"

import { getScoreboardInfo, getTabListInfo, getRequiredSecrets } from "../Utils/Score"
import Door from "./Door.js"
import DungeonRoomData from "../Data/DungeonRoomData.js"

const BufferedImage = Java.type("java.awt.image.BufferedImage")

let PlayerComparator = Java.type("net.minecraft.client.gui.GuiPlayerTabOverlay").PlayerComparator
let c = PlayerComparator.class.getDeclaredConstructor()
c.setAccessible(true);
let sorter = c.newInstance()

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

        this.currentRenderContextId = 0

        this.lastRenderContext = 1 //starting at one so that if(renderContext) returns true always if it exists
        this.renderContexts = []

        this.mimicKilled = false;


        //load from world datra

        this.lastRoomId = undefined
        this.lastChange = 0
        this.roomXY = this.getRoomXYWorld().join(",")
        this.lastXY = undefined
    }

    destroy() {
        for (let context of this.renderContexts) {
            if (!context) continue

            context.lastImage?.getTexture()?.[m.deleteGlTexture]()
            context.image?.getTexture()?.[m.deleteGlTexture]()
            context.lastImage = undefined
            context.image = undefined
        }

        this.renderContexts = []
        this.rooms.clear()
        this.roomsArr.clear()
    }

    markChanged() {
        this.lastChanged = Date.now()
    }

    createRenderContext({ x, y, size, headScale = 8 }) {
        let contextId = this.lastRenderContext++

        let contextData = {
            x,
            y,
            size,
            headScale,
            image: undefined,
            imageLastUpdate: 0,
            lastImage: undefined
        }

        this.renderContexts[contextId] = contextData

        return contextId
    }

    getRenderContextData(contextId) {
        return this.renderContexts[contextId]
    }

    getCurrentRenderContext() {
        return this.getRenderContextData(this.currentRenderContextId)
    }

    draw(contextId) {
        this.currentRenderContextId = contextId
        if (!this.getCurrentRenderContext()) return

        let { x, y, size } = this.getCurrentRenderContext()

        let useOldImg = false
        if (!this.getCurrentRenderContext().image
            || this.getCurrentRenderContext().imageLastUpdate < this.lastChanged) {
            //create image if not cached or cache outdated

            if (this.getCurrentRenderContext().lastImage) {
                this.getCurrentRenderContext().lastImage.getTexture()[m.deleteGlTexture]()
            }
            this.getCurrentRenderContext().lastImage = this.getCurrentRenderContext().image
            this.getCurrentRenderContext().image = new Image(this.renderImage(contextId))

            useOldImg = true
            this.getCurrentRenderContext().image.draw(0, 0, 0, 0)
            this.getCurrentRenderContext().imageLastUpdate = Date.now()
        }

        let img
        if (useOldImg && this.getCurrentRenderContext().lastImage) {
            img = this.getCurrentRenderContext().lastImage
        } else {
            img = this.getCurrentRenderContext().image
        }

        Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)//background

        img.draw(x, y, size, size)

        Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, 2) //border
        Renderer.drawRect(Renderer.color(0, 0, 0), x, y, 2, size)
        Renderer.drawRect(Renderer.color(0, 0, 0), x + size - 2, y, 2, size)
        Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - 2, size, 2)


        //render heads
        for (let player of this.players) {
            player.drawIcon()
        }

        //TODO: render stuff overlayed on the image (text on map, secrets info ect)
    }
    updatePlayers() {
        let pl = Player.getPlayer()[f.sendQueue.EntityPlayerSP][m.getPlayerInfoMap]().sort((a, b) => sorter.compare(a, b))
        let i = 0
        for (let p of pl) {
            if (!p[m.getDisplayName.NetworkPlayerInfo]()) continue
            let line = p[m.getDisplayName.NetworkPlayerInfo]()[m.getUnformattedText]().trim().replace("♲ ", "") //TODO: Remove bingo symbol and support yt/admin rank
            if (line.endsWith(")") && line.includes(" (") && line.split(" (").length === 2 && line.split(" (")[0].split(" ").length === 1 && line.split(" (")[1].length > 5) {
                let name = line.split(" ")[0]

                if (!this.players[i]) {
                    this.players[i] = new MapPlayer(p, this, name)
                    console.log(name)
                }
                this.playersNameToId[name] = i

                i++
            }
        }
    }

    updatePlayersFast() {
        World.getAllPlayers().forEach(player => {
            let p = this.players[this.playersNameToId[ChatLib.removeFormatting(player.getName()).trim()]]
            if (!p) return

            p.setX(player.getX())
            p.setY(player.getZ())
            p.setRotate(player.getYaw() + 180)
        })
    }

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
                if (bytes[(mapX) + (mapY) * 128] === 0) continue
                if (r1x1sM.has(bytes[(mapX) + (mapY) * 128])) {
                    //special room at that location
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.worldX + "," + position.worldY)
                    if (!currRoom) {
                        let room = new Room(r1x1s[bytes[(mapX) + (mapY) * 128]], [position], undefined)
                        this.rooms.set(position.worldX + "," + position.worldY, room)
                        this.roomsArr.add(room)
                        room.checkmarkState = room.type === Room.UNKNOWN ? Room.ADJACENT : Room.OPENED
                        this.markChanged()
                    } else {
                        if (currRoom.type !== r1x1s[bytes[(mapX) + (mapY) * 128]]) {
                            currRoom.setType(r1x1s[bytes[(mapX) + (mapY) * 128]])
                            currRoom.checkmarkState = Room.OPENED
                            this.markChanged()
                        }
                    }
                }
                if (bytes[(mapX) + (mapY) * 128] === 63) {
                    //normal room at that location
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.worldX + "," + position.worldY)
                    let currRoom2 = bytes[(mapX - 1) + (mapY) * 128] === 63 ? this.rooms.get((position.worldX - 32) + "," + position.worldY) : undefined
                    let currRoom3 = bytes[(mapX) + (mapY - 1) * 128] === 63 ? this.rooms.get(position.worldX + "," + (position.worldY - 32)) : undefined
                    if (!currRoom && !currRoom2 && !currRoom3) {

                        let room = new Room(Room.NORMAL, [position], undefined)

                        this.rooms.set(position.worldX + "," + position.worldY, room)
                        this.roomsArr.add(room)

                        this.markChanged()
                    } else { //already a normal room either in same location, or needs to merge up or left

                        if (currRoom && currRoom.type !== Room.NORMAL) { //anopther room in the same location
                            currRoom.setType(Room.NORMAL)
                            currRoom.checkmarkState = Room.OPENED
                            this.markChanged()
                        }
                        if (currRoom2 && currRoom !== currRoom2 && currRoom2.type === Room.NORMAL) {
                            if (!currRoom2.components.some(a => position.equals(a))) { //need to merge left
                                if (currRoom) this.roomsArr.delete(currRoom)

                                currRoom2.components.push(position)
                                this.rooms.set(position.worldX + "," + position.worldY, currRoom2)
                                this.markChanged()
                            }
                        }

                        if (currRoom3 && currRoom !== currRoom3 && currRoom3.type === Room.NORMAL) {
                            if (!currRoom3.components.some(a => position.equals(a))) { //need to merge up
                                if (currRoom) this.roomsArr.delete(currRoom)

                                currRoom3.components.push(position)
                                this.rooms.set(position.worldX + "," + position.worldY, currRoom3)
                                this.markChanged()
                            }
                        }
                    }
                }

                //check for checkmark

                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 34) {
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.worldX + "," + position.worldY)
                    currRoom.checkmarkState = Room.CLEARED
                    this.markChanged()
                }
                if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 30) {
                    let position = new Position(0, 0, this)
                    position.mapX = mapX
                    position.mapY = mapY
                    let currRoom = this.rooms.get(position.worldX + "," + position.worldY)
                    currRoom.checkmarkState = Room.COMPLETED
                    this.markChanged()
                }
                // if (bytes[(mapX + this.widthRoomImageMap / 2) + (mapY + this.widthRoomImageMap / 2) * 128] === 18) { //Apparanatly puzzles dont show crosses when failed anymore
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
                        this.doors.set(position.worldX + "," + position.worldY, new Door(type, position, false))
                    } else {
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
                        this.doors.set(position.worldX + "," + position.worldY, new Door(type, position, true))
                    } else {
                        this.doors.get(position.worldX + "," + position.worldY).type = type
                    }
                }
            }
        }
    }

    renderImage(contextId) {
        //create 256x256 image
        let image = new BufferedImage(256, 256, BufferedImage.TYPE_INT_ARGB)

        //create graphics rendering context
        let graphics = image.createGraphics()

        //translate dungeon into view
        graphics.translate(256 - 32, 256 - 32)

        //render doors
        for (let door of this.doors.values()) {
            door.render(graphics)
        }

        //render rooms
        for (let room of this.roomsArr) {
            room.render(graphics)
        }

        //undo translation
        graphics.translate(-256 + 32, -256 + 32)

        return image
    }

    getScore() {
        let exploration = 0;
        let time = 100; //TODO:  Figure out how to actually do this one
        let skill = 0;
        let bonus = 0;

        let requiredSecrets = getRequiredSecrets(7, false); //TODO: load required secrets from this.floor
        let roomCompletion = getScoreboardInfo();
        let [secrets, crypts, deaths, unfinshedPuzzles, completedRoomsTab] = getTabListInfo();
        let completedRooms = this.rooms?.filter(r => r.isCleared())?.length ?? rooms;

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

        return [exploration, time, skill, bonus]
    }

    //==============================
    // UPDATING FROM WORLD CODE
    //==============================
    updateFromWorld() {
        let roomid = this.getCurrentRoomId()
        if (!roomid.includes(",")) return
        if (this.roomXY !== this.getRoomXYWorld().join(",")) {
            this.roomXY = this.getRoomXYWorld().join(",")
            this.lastChange = Date.now()
        }

        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 9
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 9

        if (roomid !== this.lastRoomId && Date.now() - this.lastChange > 500) {
            this.lastRoomId = roomid

            let roomWorldData = this.getRoomWorldData()

            let rotation = roomWorldData.width > roomWorldData.height ? 0 : 1

            if (this.getCurrentRoomData().shape === "L") rotation = roomWorldData.rotation
            if (this.getCurrentRoomData().type === "spawn") {
                roomWorldData.x = x + 1
                roomWorldData.y = y + 1
            }

            this.setRoom(roomWorldData.x, roomWorldData.y, rotation, roomid)
        }


        if (this.lastXY !== x + "," + y) {
            this.lastXY = x + "," + y
            if (this.getBlockAt(x + 16, 73, y) !== 0) {
                this.setDoor(x + 16, y, -1, 0)
            }
            if (this.getBlockAt(x, 73, y + 16) !== 0) {
                this.setDoor(x, y + 16, -1, 1)
            }
            if (this.getBlockAt(x + 16, 73, y + 32) !== 0) {
                this.setDoor(x + 16, y + 32, -1, 0)
            }
            if (this.getBlockAt(x + 32, 73, y + 16) !== 0) {
                this.setDoor(x + 32, y + 16, -1, 1)
            }
        }
    }
    setRoom(x, y, rotation, roomId) {
        let locstr = x + "," + y

        if (this.rooms.get(locstr)) {
            return
        }

        let roomData = DungeonRoomData.getDataFromId(roomId)
        let type = Room.NORMAL
        switch (roomData.type) {
            case "mobs":
                type = Room.NORMAL
                break
            case "miniboss":
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

        switch (roomData.shape) {
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
                if (rotation !== 1) components.push(new Position(x, y))
                if (rotation !== 3) components.push(new Position(x + 32, y))
                if (rotation !== 2) components.push(new Position(x + 32, y + 32))
                if (rotation !== 0) components.push(new Position(x, y + 32))
                break
        }

        let room = new Room(type, components, roomId)

        this.roomsArr.add(room)
        room.components.forEach(c => {
            this.rooms.set(c.worldX + "," + c.worldY, room)
        })
        this.markChanged()
    }

    setDoor(x, y, type, ishorisontal) {
        let rx = x - 3
        let ry = y - 3
        if (this.doors.get(rx + "," + ry)) return
        if (type === -1) {
            let id = World.getBlockStateAt(new BlockPos(x, 69, y)).getBlockId()
            if (id === 0) type = Room.NORMAL
            else if (id === 97) type = Room.NORMAL
            else if (id === 173) type = Room.BLACK
            else if (id === 159) type = Room.BLOOD
            else return
        }

        let door = new Door(type, new Position(rx, ry), ishorisontal)
        this.doors.set(rx + "," + ry, door)
        this.markChanged()
    }

    getCurrentRoomId() {
        if (Scoreboard.getLines().length === 0) return undefined
        let id = Scoreboard.getLineByIndex(Scoreboard.getLines().length - 1).getName().trim().split(" ").pop()

        return id
    }

    getRoomXYWorld() {
        let roomData = this.getRoomWorldData()
        if (roomData.rotation === 4) {
            return [roomData.x, roomData.y + 32]
        }

        return [roomData.x, roomData.y]
    }

    getCurrentRoomData() {
        return DungeonRoomData.getDataFromId(this.getCurrentRoomId())
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

    getRoomWorldData() {
        let x = Math.floor((Player.getX() + 8) / 32) * 32 - 8
        let y = Math.floor((Player.getZ() + 8) / 32) * 32 - 8
        let width = 30
        let height = 30

        let roofY = this.getRoofAt(x, y)

        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y)).getBlockId() !== 0) {
            x -= 32
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x, roofY, y - 1)).getBlockId() !== 0) {
            y -= 32
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y)).getBlockId() !== 0) { //second iteration incase of L shape
            x -= 32
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width + 1, roofY, y)).getBlockId() !== 0) {
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x, roofY, y + height + 1)).getBlockId() !== 0) {
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width, roofY, y + height + 1)).getBlockId() !== 0) { //second iteration incase of L shape
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width + 1, roofY, y + height)).getBlockId() !== 0) { //second iteration incase of L shape
            width += 32
        }
        while (World.getBlockStateAt(new BlockPos(x + width, roofY, y - 1)).getBlockId() !== 0) {//second iteration incase of L shape
            y -= 32
            height += 32
        }
        while (World.getBlockStateAt(new BlockPos(x - 1, roofY, y + height)).getBlockId() !== 0) { //third iteration incase of L shape
            x -= 32
            width += 32
        }


        return {
            x,
            y,
            width,
            height,
            cx: x + width / 2,
            cy: y + height / 2,
            rotation: this.getRotation(x, y, width, height, roofY)
        }
    }

    getRoofAt(x, z) {
        let y = 255
        while (y > 0 && World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId() === 0) y--

        return y
    }

    getTopBlockAt(x, z, y) {
        if (!y) y = this.getHeightAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getMetadata()
    }
    getBlockAt(x, y, z) {
        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }
    getTopBlockAt2(x, z, y) {
        if (!y) y = this.getHeightAt(x, z)

        return World.getBlockStateAt(new BlockPos(x, y, z)).getBlockId()
    }
}

export default DungeonMap