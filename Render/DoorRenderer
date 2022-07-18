import { roomColorMap } from "../Data/Colors"

class DoorRenderer {

    drawDoor(graphics, door) {
        graphics.setColor(this.getRenderColor(door.type))
        //TODO: This only works because the roomsize + gapsize is the same amount as blocks in a room. Find a way to fix this properly
        //do NOT ask me why 198, i got no clue either
        graphics.fillRect(door.position.worldX + 198 + (door.horisontal ? 1 : 0), door.position.worldY + 198 + (door.horisontal ? 0 : 1), door.horisontal ? 6 : 8, door.horisontal ? 8 : 6)
    }

    getRenderColor(type) {
        return roomColorMap.get(type)
    }
}

export default DoorRenderer