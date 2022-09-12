
import renderLibs from "../../../guimanager/renderLibs.js"
import Room from "../../Components/Room.js"
import RenderContext from "./../RenderContext.js"

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
        let rc = room.components // effort to type
        // Drawing the main room and its sections

        const roomSize = context.blockSize - context.roomGap // Width/Height of a single room component (a 1x1 room on the map)

        // Draws a rectangle on the map
        const draw = (x, y, w, h) => graphics.fillRect(x * context.blockSize + context.roomGap / 2, y * context.blockSize + context.roomGap / 2, w, h);

        // Main room components and connectors
        for (let component of rc) {
            let x = component.arrayX
            let y = component.arrayY
            draw(x, y, roomSize, roomSize);
            if (rc.some(a => a.arrayX == x+1 && a.arrayY == y)) draw(x+0.75, y, roomSize/3, roomSize) // Component to the right
            if (rc.some(a => a.arrayX == x && a.arrayY == y+1)) draw(x, y+0.75, roomSize, roomSize/3) // Component above

            // 2x2 Center
            if (rc.length == 4 && new Set(rc.map(a => a.arrayX)).size == 2 && x == Math.min(...rc.map(a => a.arrayX)) && y == Math.min(...rc.map(a => a.arrayY))) draw(x+0.75, y+0.75, roomSize/3, roomSize/3)
        }
    }

    /**
     * 
     * @param {RenderContext} context 
     * @param {*} graphics 
     * @param {Room} room 
     * @returns 
     */
    drawCheckmark(context, graphics, room) {
        if (room.type === Room.SPAWN) return // Dont render tick on spawn room

        if (context.tickStyle === 'secrets' || (context.puzzleNames !== "none" && room.type === Room.PUZZLE)) return // Needs to be rendered in renderoverlay, see drawExtras()

        const location = room.components[0]

        const getX = (w) => (context.roomGap + context.roomSize - w)/2 + context.blockSize * location.arrayX
        const getY = (h) => (context.roomGap + context.roomSize - h)/2 + context.blockSize * location.arrayY

        const drawCheckmark = (checkmark) => {
            const [w, h] = context.getIconSize(checkmark)
            graphics.drawImage(context.getImage(checkmark), getX(w), getY(h), w, h, null)
        }

        if (room.checkmarkState === -1) drawCheckmark("failedRoom")
        if (room.checkmarkState === 1) drawCheckmark("questionMark")
        if (room.checkmarkState === 3) drawCheckmark("whiteCheck")
        if (room.checkmarkState === 4) drawCheckmark("greenCheck")
        if (room.checkmarkState === 5) drawCheckmark("failedRoom")
    }

    /**
     * 
     * @param {RenderContext} context 
     * @param {Room} room 
     */
    drawExtras(context, room, dungeon) {
        if (context.tickStyle === 'secrets' && (context.puzzleNames === "none" || room.type !== Room.PUZZLE)) {

            if (room.type === Room.SPAWN || room.type === Room.FAIRY) return

            let location = room.components[0]

            let x = (context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
            let y = (context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

            x = context.posX + x * context.size + context.borderWidth
            y = context.posY + y * context.size + context.borderWidth

            let scale = context.size / 175 * context.iconScale / 8

            if (room.maxSecrets === 10) x += 12 * scale

            let text = (room.currentSecrets ?? "?") + "/" + (room.maxSecrets ?? "?")

            if (room.type === Room.BLOOD) text = "0/0"

            let textColored = ""
            switch (room.checkmarkState) {
                case Room.ADJACENT:
                    textColored = "&7" + text
                    break;
                case Room.CLEARED:
                    textColored = "&f" + text
                    break;
                case Room.COMPLETED:
                    textColored = "&a" + text
                    break;
                case Room.FAILED:
                    textColored = "&c" + text
                    break;
                case Room.OPENED:
                default:
                    textColored = "&8" + text
                    break;
            }
            text = "&0" + text

            Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(text, x + scale, y - 4.5 * scale, scale)
            Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(text, x - scale, y - 4.5 * scale, scale)
            Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(text, x, y + scale - 4.5 * scale, scale)
            Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(text, x, y - scale - 4.5 * scale, scale)
            Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(textColored, x, y - 4.5 * scale, scale)
        }

        if (context.puzzleNames !== "none" && room.type === Room.PUZZLE) {
            let location = room.components[0]

            let x = (context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
            let y = (context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

            x = context.posX + x * context.size + context.borderWidth
            y = context.posY + y * context.size + context.borderWidth

            let scale = context.size / 250 * context.iconScale / 8

            // TODO: show icon instead of text if thats the setting

            let text = room.data?.name?.split(" ") || ["???"]

            let textColor = ""
            switch (room.checkmarkState) {
                case Room.CLEARED:
                    textColor = "&f"
                    break;
                case Room.COMPLETED:
                    textColor = "&a"
                    break;
                case Room.FAILED:
                    textColor = "&c"
                    break;
                default:
                    textColor = "&7"
                    break;
            }

            let i = 0
            for (let line of text) {
                let ly = y + 9 * scale * (i - text.length / 2)

                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x + scale, ly, scale)
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x - scale, ly, scale)
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly + scale, scale)
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly - scale, scale)
                Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(textColor + line, x, ly, scale)

                i++
            }
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