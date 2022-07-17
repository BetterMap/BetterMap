import { f, m } from "../../mappings/mappings.js"
import Position from "../Utils/Position.js"
import MapPlayer from "./MapPlayer.js"
import Room from "./Room.js"

const BufferedImage = Java.type("java.awt.image.BufferedImage")

class DungeonMap {
    constructor(floor) {
        /**
         * @type {Map<String, Room>} The string is in form x,y eg 102,134 and will correspond to the top left corner of a room component
         */
        this.rooms = new Map()

        this.fullRoomScaleMap = 0 //how many pixels on the map is 32 blocks
        this.widthRoomImageMap = 0 //how wide the main boxes are on the map

        /**
         * @type {Set<Room>} So that its easy to loop over all rooms without duplicates
         */
        this.roomsArr = new Set()

        this.floor = floor

        this.lastChanged = Date.now()

        this.dungeonTopLeft = undefined

        /**
         * @type {Array<MapPlayer>}
         */
        this.players = []

        this.currentRenderContextId = 0

        this.lastRenderContext = 1 //starting at one so that if(renderContext) returns true always if it exists
        this.renderContexts = []
    }

    destroy() {
        for (let context of this.renderContexts) {
            context.lastImage.getTexture()[m.deleteGlTexture]()
            context.image.getTexture()[m.deleteGlTexture]()
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

        //TODO: render stuff overlayed on the image (heads, text on map, secrets info ect)
    }

    loadPlayersFromDecoration(deco) {
    }

    updateFromMap(mapData) {
        this.loadPlayersFromDecoration(mapData[f.mapDecorations])

        let bytes = mapData[f.colors.MapData]
        if (!this.dungeonTopLeft) { //load top left and room width
            let roomX = 0
            let roomY = 0
            let roomwidth = 0
            for (let x = 0; x < 128; x += 20) {
                for (let y = 0; y < 128; y += 20) {
                    if (bytes[x + y * 128] !== 0) {
                        roomX = x
                        roomY = y
                        while (bytes[(roomX - 1) + roomY * 128] !== 0) {
                            roomX--
                        }
                        while (bytes[(roomX) + (roomY - 1) * 128] !== 0) {
                            roomY--
                        }

                        while (bytes[(roomX + roomwidth) + roomY * 128] !== 0) {
                            roomwidth++
                        }
                        break;
                    }
                }
                if (roomX) break;
            }
            if (!roomX) return

            this.fullRoomScaleMap = roomwidth * 5 / 4
            this.widthRoomImageMap = roomwidth

            roomX = roomX % this.fullRoomScaleMap
            roomY = roomY % this.fullRoomScaleMap

            if (this.floor[this.floor.length - 1] === "1" || this.floor === "E") {
                roomX += this.roomScaleMap
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

        for (let x = 0; x < 6; x++) {//Scan top left of rooms looking for valid rooms
            for (let y = 0; y < 6; y++) {
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

                        this.markChanged()
                    } else {
                        if (currRoom.type !== r1x1s[bytes[(mapX) + (mapY) * 128]]) {
                            currRoom.setType(r1x1s[bytes[(mapX) + (mapY) * 128]])
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
                        let positions = [position]

                        let room = new Room(Room.NORMAL, positions, undefined)

                        room.components.forEach(c => {
                            this.rooms.set(c.worldX + "," + c.worldY, room)
                        })
                        this.roomsArr.add(room)

                        this.markChanged()
                    } else {
                        if (currRoom && currRoom.type !== Room.NORMAL) {
                            currRoom.setType(Room.NORMAL)
                            this.markChanged()
                        }
                        if (currRoom2) {
                            let position2 = new Position(position.worldX - 32, position.worldY, this)
                            if (!currRoom2.components.some(a => position2.equals(a))) {
                                currRoom2.components.push(position2)
                                this.rooms.set(position2.worldX + "," + position2.worldY, currRoom2)
                                this.markChanged()
                            }
                        }
                        if (currRoom3) {
                            let position3 = new Position(position.worldX, position.worldY - 32, this)
                            if (!currRoom3.components.some(a => position3.equals(a))) {
                                currRoom3.components.push(position3)
                                this.rooms.set(position3.worldX + "," + position3.worldY, currRoom3)
                                this.markChanged()
                            }
                        }
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

        //TODO: render doors

        //render rooms
        for (let room of this.roomsArr) {
            room.render(graphics)
        }

        //undo translation
        graphics.translate(-256 + 32, -256 + 32)

        return image
    }
}

export default DungeonMap