import { m } from "../../mappings/mappings.js"
import { roomColorMap } from "../Data/Colors.js"

class Room {

    static SPAWN = 0
    static NORMAL = 1
    static PUZZLE = 2
    static MINIBOSS = 3
    static FAIRY = 4
    static BLOOD = 5
    static TRAP = 7
    static UNKNOWN = 6

    static UNOPENED = 0;
    static ADJACENT = 1;
    static OPENED = 2;
    static CLEARED = 3;
    static COMPLETED = 4;

    /**
     * Creates a room based on a type, components, and a room id
     * @param {Number} type 
     * @param {Array<Position>} components 
     * @param {String} roomId 
     */
    constructor(type, components, roomId) {
        this.type = type
        this.components = components
        this.roomId = roomId

        /**
         * 0 -> not opened / not on the map yet
         * 1 -> adjacent, not opened, but visible on the map
         * 2 -> opened
         * 3 -> white tick
         * 4 -> green tick
         */
        this.checkmarkState = 0

        /**
         * @type {Array<Door>}
         */
        this.adjecentDoors = []
    }

    /**
     * returns true if a room was cleared (at least white checkmark)
     */
    isCleared() {
        //always assume blood is cleared
        if (this.type === Room.BLOOD) return true;

        return this.checkmarkState >= Room.CLEARED;
    }

    getRenderColor() {
        return roomColorMap.get(this.type)
    }

    render(graphics) {
        //Count number of unique X and Y's there are
        let xComponents = new Set()
        let yComponents = new Set()
        for (let component of this.components) {
            xComponents.add(component.worldX)
            yComponents.add(component.worldY)
        }

        let uniqueX = xComponents.size
        let uniqueY = yComponents.size

        graphics.setColor(this.getRenderColor())

        // Long, tall rooms and 1x1's
        if (uniqueX === 1) {
            let x = xComponents.values().next().value
            let y = Math.min(...yComponents)

            graphics.fillRect(x + 3, y + 3, 32 - 6, 32 * uniqueY - 6)
        } else if (uniqueY === 1) { // Long, flat rooms
            let y = xComponents.values().next().value
            let x = Math.min(...xComponents)

            graphics.fillRect(x + 3, y + 3, 32 * uniqueX - 6, 32 - 6)
        } else if (uniqueX === 2 && uniqueY === 2) {
            if (this.components.length === 4) {//2x2
                let x = Math.min(...xComponents)
                let y = Math.min(...yComponents)

                graphics.fillRect(x + 3, y + 3, 64 - 6, 64 - 6)
            } else if (this.components.length === 3) { // L shape
                let xCounts = new Map() //count number of each x and y
                let yCounts = new Map()

                for (let component of this.components) {
                    xCounts.set(component.worldX, (xCounts.get(component.worldX) || 0) + 1)
                    yCounts.set(component.worldY, (yCounts.get(component.worldY) || 0) + 1)
                }

                let minX = Math.min(...xComponents)
                let minY = Math.min(...yComponents)

                //render box where there is 2 next to each other
                for (let data of xCounts.entries()) {
                    let [x, count] = data

                    if (count === 2) {
                        graphics.fillRect(x + 3, minY + 3, 32 - 6, 64 - 6)
                    }
                }
                for (let data of yCounts.entries()) {
                    let [y, count] = data

                    if (count === 2) {
                        graphics.fillRect(minX + 3, y + 3, 64 - 6, 32 - 6)
                    }
                }
            }
        }
    }
}

export default Room

function makeMap() {
    // let start = new Date().getTime()
    this.clearMap()
    for (let room of this.rooms) {
        let components = room.components
        let [x, z] = components[0]
        let width = 3
        let height = 3
        let xComponents = components.map(a => a[0])
        let zComponents = components.map(a => a[1])
        let uniqueX = new Set(xComponents).size // How many unique x-coords there are
        let uniqueZ = new Set(zComponents).size // Unique z-coords

        const draw = () => this.setPixels(x * 2, z * 2, width, height, room.getColor())

        // Long, tall rooms and 1x1's
        if (uniqueX == 1) {
            x = Math.max(...xComponents)
            height = xComponents.length * 3 + (xComponents.length - 1)
            draw()
            continue
        }
        // Long, flat rooms
        if (uniqueZ == 1) {
            z = Math.max(...zComponents)
            width = zComponents.length * 3 + (zComponents.length - 1)
            draw()
            continue
        }
        // 2x2's and L-Shaped rooms
        if (uniqueX == 2 && uniqueZ == 2) {
            if (components.length == 4) {
                width = 7
                height = 7
                draw()
                continue
            }
            if (components.length == 3) {
                for (let i of components) {
                    let [xx, yy] = i
                    this.setPixels(xx * 2, yy * 2, 3, 3, room.getColor())
                    if (xx == Math.min(...xComponents) && yy == Math.min(...zComponents)) {
                        if (components.filter(a => a[1] == yy && a[0] == xx + 2).length == 1) this.setPixels(xx * 2 + 3, yy * 2, 1, 3, room.getColor())
                        if (components.filter(a => a[1] == yy + 2 && a[0] == xx).length == 1) this.setPixels(xx * 2, yy * 2 + 3, 3, 1, room.getColor())
                    }
                    if (xx == Math.max(...xComponents) && yy == Math.max(...zComponents)) {
                        if (components.filter(a => a[1] == yy && a[0] == xx - 2).length == 1) this.setPixels(xx * 2 - 1, yy * 2, 1, 3, room.getColor())
                        if (components.filter(a => a[1] == yy - 2 && a[0] == xx).length == 1) this.setPixels(xx * 2, yy * 2 - 1, 3, 1, room.getColor())
                    }
                }
            }
        }
    }
    for (let door of this.doors) {
        this.setPixels(door.gX * 2 + 1, door.gZ * 2 + 1, 1, 1, door.getColor())
    }
    this.mapIsEmpty = false
    this.map.getTexture()[m.deleteGlTexture]()
    this.map = new Image(this.mapBuffered)
    // ChatLib.chat(`Map creation took ${new Date().getTime() - start}ms`)
}