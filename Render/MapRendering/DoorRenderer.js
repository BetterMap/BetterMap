import Door from "../../Components/Door"
import Room from "../../Components/Room"
import RenderContext from "../RenderContext"
const Color = Java.type('java.awt.Color');

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
        } else if (renderContext.mapStyle === 'custom') {
            switch (teniosDoorMap[type]) {
                case 'spawn': return new Color(Renderer.color(...renderContext.customRoomColorSpawn), true);
                case 'mobs': return new Color(Renderer.color(...renderContext.customRoomColorNormal), true);
                case 'miniboss': return new Color(Renderer.color(...renderContext.customRoomColorMini), true);
                case 'rare': return new Color(Renderer.color(...renderContext.customRoomColorRare), true);
                case 'puzzle': return new Color(Renderer.color(...renderContext.customRoomColorPuzzle), true);
                case 'gold': return new Color(Renderer.color(...renderContext.customRoomColorGold), true);
                case 'fairy': return new Color(Renderer.color(...renderContext.customRoomColorFairy), true);
                case 'blood': return new Color(Renderer.color(...renderContext.customRoomColorBlood), true);
                case 'trap': return new Color(Renderer.color(...renderContext.customRoomColorTrap), true);
                case 'wither': return new Color(Renderer.color(...renderContext.customRoomColorWitherDoor), true);
                default:
                case 'unknown': return new Color(Renderer.color(...renderContext.customRoomColorUnknown), true);
            }
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