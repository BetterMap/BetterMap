
import Room from "../Components/Room.js"
import RenderContext from "./RenderContext.js"

const greenCheck = new Image("greenCheckVanilla.png", "https://i.imgur.com/h2WM1LO.png").image
const whiteCheck = new Image("whiteCheckVanilla.png", "https://i.imgur.com/hwEAcnI.png").image
const failedRoom = new Image("failedRoomVanilla.png", "https://i.imgur.com/WqW69z3.png").image
const questionMark = new Image("questionMarkVanilla.png", "https://i.imgur.com/1jyxH9I.png").image

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
                    graphics.fillRect(x * context.blockSize, minY * context.blockSize, 32 - context.roomGap, 64 - context.roomGap)
                }
            }
            for (let data of yCounts.entries()) {
                let [y, count] = data

                if (count === 2) {
                    graphics.fillRect(minX * context.blockSize, y * context.blockSize, 64 - context.roomGap, 32 - context.roomGap)
                }
            }
        } else { //every other case is easy af since its just a rect
            let x = Math.min(...xComponents)
            let y = Math.min(...yComponents)

            graphics.fillRect(x * context.blockSize, y * context.blockSize, context.blockSize * uniqueX - context.roomGap, uniqueY * context.blockSize - context.roomGap);
        }

        let location = room.components[0]
        if (room.checkmarkState === 1) {
            graphics.drawImage(questionMark, context.blockSize * location.arrayX + 8, context.blockSize * location.arrayY + 6, 10, 16, null)
        }
        if (room.checkmarkState === 3) {
            graphics.drawImage(whiteCheck, context.blockSize * location.arrayX + 8, context.blockSize * location.arrayY + 8, 10, 10, null)
        }
        if (room.checkmarkState === 4) {
            graphics.drawImage(greenCheck, context.blockSize * location.arrayX + 8, context.blockSize * location.arrayY + 8, 10, 10, null)
        }
        if (room.checkmarkState === 5) {
            graphics.drawImage(failedRoom, context.blockSize * location.arrayX + 8, context.blockSize * location.arrayY + 9, 14, 14, null)
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