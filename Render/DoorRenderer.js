import Door from "../Components/Door"
import Room from "../Components/Room"
import RenderContext from "./RenderContext"

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

        graphics.fillRect(door.position.arrayX * renderContext.blockSize - (door.horisontal ? roomGap : doorWidth) / 2, door.position.arrayY * renderContext.blockSize - (door.horisontal ? doorWidth : roomGap) / 2, door.horisontal ? roomGap : doorWidth, door.horisontal ? doorWidth : roomGap)
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

        return renderContext.colorMap.get(type)
    }
}

export default DoorRenderer