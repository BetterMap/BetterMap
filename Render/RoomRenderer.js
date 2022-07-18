
import { roomColorMap } from "../Data/Colors.js"

const greenCheck = new Image("greenCheckVanilla.png", "https://i.imgur.com/h2WM1LO.png").image
const whiteCheck = new Image("whiteCheckVanilla.png", "https://i.imgur.com/hwEAcnI.png").image
const failedRoom = new Image("failedRoomVanilla.png", "https://i.imgur.com/WqW69z3.png").image
const questionMark = new Image("questionMarkVanilla.png", "https://i.imgur.com/1jyxH9I.png").image

class RoomRenderer {

    constructor(roomSize, roomGap) {
        this.roomSize = roomSize;
        this.roomGap = roomGap;
        this.blockSize = this.roomSize + this.roomGap;
    }

    drawRoom(graphics, room) {
        graphics.setColor(this.getRenderColor(room.type))

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
                    graphics.fillRect(x * this.blockSize, minY * this.blockSize, 32 - this.roomGap, 64 - this.roomGap)
                }
            }
            for (let data of yCounts.entries()) {
                let [y, count] = data

                if (count === 2) {
                    graphics.fillRect(minX * this.blockSize, y * this.blockSize, 64 - this.roomGap, 32 - this.roomGap)
                }
            }
        } else { //every other case is easy af since its just a rect
            let x = Math.min(...xComponents)
            let y = Math.min(...yComponents)

            graphics.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize * uniqueX - this.roomGap, uniqueY * this.blockSize - this.roomGap);
        }

        let location = room.components[0]
        if (room.checkmarkState === 1) {
            graphics.drawImage(questionMark, this.blockSize * location.arrayX + 8, this.blockSize * location.arrayY + 6, 10, 16, null)
        }
        if (room.checkmarkState === 3) {
            graphics.drawImage(whiteCheck, this.blockSize * location.arrayX + 8, this.blockSize * location.arrayY + 8, 10, 10, null)
        }
        if (room.checkmarkState === 4) {
            graphics.drawImage(greenCheck, this.blockSize * location.arrayX + 8, this.blockSize * location.arrayY + 8, 10, 10, null)
        }
        if (room.checkmarkState === 5) {
            graphics.drawImage(failedRoom, this.blockSize * location.arrayX + 8, this.blockSize * location.arrayY + 9, 14, 14, null)
        }
    }

    getRenderColor(type) {
        return roomColorMap.get(type)
    }

}

export default RoomRenderer