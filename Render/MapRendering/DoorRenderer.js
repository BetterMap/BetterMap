import Door from "../../Components/Door"
import Room from "../../Components/Room"
import RenderContext from "../RenderContext"

class DoorRenderer {

    /**
     * 
     * @param {RenderContext} renderContext 
     * @param {*} graphics 
     * @param {Door} door 
     */
    drawDoor(renderContext, graphics, door) {
        graphics.setColor(this.getRenderColor(renderContext, door.type))

        let doorWidth = renderContext.doorWidth
        let roomGap = renderContext.roomGap

        graphics.fillRect(door.position.arrayX * renderContext.blockSize - (door.horizontal ? roomGap : doorWidth) / 2, door.position.arrayY * renderContext.blockSize - (door.horizontal ? doorWidth : roomGap) / 2, door.horizontal ? roomGap : doorWidth, door.horizontal ? doorWidth : roomGap)
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {*} type 
     * @returns 
     */
    getRenderColor(renderContext, type) {
        if (type === Room.NORMAL) {
            type = 9 //NORMAL_CONNECTION
        }
        if (renderContext.mapStyle === 'teniosmap') {
            type = teniosDoorMap[type];
        }
        return renderContext.colorMap.get(type)
    }
}

export default DoorRenderer

const teniosDoorMap = {
    0: 'spawn',
    1: 'mobs',
    2: 'puzzle',
    3: 'gold',
    4: 'fairy',
    5: 'blood',
    6: 'unknown',
    7: 'trap',
    8: 'wither',
    9: 'mobs'
}