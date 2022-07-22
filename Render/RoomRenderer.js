
import Room from "../Components/Room.js"
import RenderContext from "./RenderContext.js"

class RoomRenderer {

    constructor() {
    }

    /**
     * 
     * @param {RenderContext} context 
     * @param {*} graphics 
     * @param {Room} room 
     */
    drawRoom(context, graphics, room) {
        graphics.setColor(this.getRenderColor(context, room.type))

        //Count number of unique X and Y's there are
        let xComponents = new Set()
        let yComponents = new Set()
        for (let component of room.components) {
            xComponents.add(component.arrayX)
            yComponents.add(component.arrayY)
        }

        let uniqueX = xComponents.size
        let uniqueY = yComponents.size

        if (room.components.length === 3 && uniqueX > 1 && uniqueY > 1) { // L shape
            let xCounts = new Map() //count number of each x and y
            let yCounts = new Map()

            for (let component of room.components) {
                xCounts.set(component.arrayX, (xCounts.get(component.arrayX) || 0) + 1)
                yCounts.set(component.arrayY, (yCounts.get(component.arrayY) || 0) + 1)
            }

            let minX = Math.min(...xComponents)
            let minY = Math.min(...yComponents)

            //render box where there is 2 next to each other
            for (let data of xCounts.entries()) {
                let [x, count] = data

                if (count === 2) {
                    graphics.fillRect(x * context.blockSize + context.roomGap / 2, minY * context.blockSize + context.roomGap / 2, context.blockSize - context.roomGap, context.blockSize * 2 - context.roomGap)
                }
            }
            for (let data of yCounts.entries()) {
                let [y, count] = data

                if (count === 2) {
                    graphics.fillRect(minX * context.blockSize + context.roomGap / 2, y * context.blockSize + context.roomGap / 2, context.blockSize * 2 - context.roomGap, context.blockSize - context.roomGap)
                }
            }
        } else { //every other case is easy af since its just a rect
            let x = Math.min(...xComponents)
            let y = Math.min(...yComponents)

            graphics.fillRect(x * context.blockSize + context.roomGap / 2, y * context.blockSize + context.roomGap / 2, context.blockSize * uniqueX - context.roomGap, uniqueY * context.blockSize - context.roomGap);
        }

        let location = room.components[0]
        if (room.checkmarkState === 1) {
            let [w, h] = context.getIconSize("questionMark")
            graphics.drawImage(context.getImage("questionMark"), context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 - w / 2, context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 - h / 2, w, h, null)
        }
        if (room.checkmarkState === 3) {
            let [w, h] = context.getIconSize("whiteCheck")
            graphics.drawImage(context.getImage("whiteCheck"), context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 - w / 2, context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 - h / 2, w, h, null)
        }
        if (room.checkmarkState === 4) {
            let [w, h] = context.getIconSize("greenCheck")
            graphics.drawImage(context.getImage("greenCheck"), context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 - w / 2, context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 - h / 2, w, h, null)
        }
        if (room.checkmarkState === 5) {
            let [w, h] = context.getIconSize("failedRoom")
            graphics.drawImage(context.getImage("failedRoom"), context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 - w / 2, context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 - h / 2, w, h, null)
        }
    }

    /**
     * 
     * @param {RenderContext} context 
     * @param {*} type 
     * @returns 
     */
    getRenderColor(context, type) {
        return context.colorMap.get(type)
    }

}

export default RoomRenderer