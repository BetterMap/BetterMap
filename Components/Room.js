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

    setType(type) {
        this.type = type
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