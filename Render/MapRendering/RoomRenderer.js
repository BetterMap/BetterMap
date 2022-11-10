import renderLibs from "../../../guimanager/renderLibs.js"
import Room from "../../Components/Room.js"
import RenderContext from "./../RenderContext.js"

const barrier_block_item = new Item("minecraft:barrier")
const puzzleItems = {
    "Water Board": new Item("minecraft:water_bucket"),
    "Higher Or Lower": new Item("minecraft:blaze_powder"),
    "Quiz": new Item("minecraft:book"),
    "Three Weirdos": new Item("minecraft:chest"),
    "Tic Tac Toe": new Item("minecraft:shears"),
    "Teleport Maze": new Item("minecraft:end_portal_frame"),
    "Ice Fill": new Item("minecraft:ice"),
    "Creeper Beams": new Item("minecraft:sea_lantern"),
    "Bomb Defuse": new Item("minecraft:tnt"),
    "Boulder": new Item("minecraft:planks"),
    "Ice Path": new Item("minecraft:mob_spawner")
}

const Color = Java.type('java.awt.Color');
const Font = Java.type('java.awt.Font');

const black = new Color(0, 0, 0);
const gray = new Color(220 / 255, 255 / 255, 220 / 255);
const green = new Color(0, 123 / 255, 0);

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
        graphics.setColor(this.getRenderColor(context, room))
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
            if (rc.some(a => a.arrayX == x + 1 && a.arrayY == y)) draw(x + 0.75, y, roomSize / 3, roomSize) // Component to the right
            if (rc.some(a => a.arrayX == x && a.arrayY == y + 1)) draw(x, y + 0.75, roomSize, roomSize / 3) // Component above

            // 2x2 Center
            if (rc.length == 4 && new Set(rc.map(a => a.arrayX)).size == 2 && x == Math.min(...rc.map(a => a.arrayX)) && y == Math.min(...rc.map(a => a.arrayY))) draw(x + 0.75, y + 0.75, roomSize / 3, roomSize / 3)
        }
        if (context.tickStyle === 'tenios') {
            //tenios map style only draws checkmarks if room isnt identified
            if (context.mapStyle === 'teniosmap' && room.maxSecrets && room.type !== Room.PUZZLE) return;
            //ignore rooms that dont get checkmarked
            if ([Room.SPAWN].includes(room.type)) return;
            if (room.type === Room.PUZZLE && context.puzzleNames === 'text') return;
            if (room.type === Room.PUZZLE && context.mapStyle === 'teniosmap' && room.checkmarkState <= Room.CLEARED && context.puzzleNames === 'none') return;
            if (room.type === Room.PUZZLE && room.checkmarkState <= Room.CLEARED) return;

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
        //spawn room wont get checkmarked
        if (room.type === Room.SPAWN) return;
        //puzzle checkmarks are drawn in drawPuzzle
        if (room.type === Room.PUZZLE) {
            if (context.puzzleNames === 'text') return;
            if (context.puzzleNames === 'icon' && !(room.checkmarkState === Room.COMPLETED || room.checkmarkState === Room.FAILED)) return;
        }
        //dont show checkmarks if all rooms are rendered by name
        if (context.showSecretCount === 'always') {
            if (!context.checkmarkCompleteRooms) return;
            if (context.checkmarkCompleteRooms && room.checkmarkState !== Room.COMPLETED) return;
        }
        if (context.showSecretCount === 'hasSecrets' && room.maxSecrets > 0) {
            if (!context.checkmarkCompleteRooms) return;
            if (context.checkmarkCompleteRooms && room.checkmarkState !== Room.COMPLETED) return;
        }
        //room names are rendered in drawExtras 
        if (context.tickStyle === 'roomnames') return;

        //tenios checkmark is perm on the image
        if (context.tickStyle === 'tenios') {
            let fontSize = 24 * context.iconScale / 10;
            let teniosFont = new Font('Dialog', Font.BOLD, fontSize);
            graphics.setFont(teniosFont);
            let x = Math.min(...room.components.map(r => r.arrayX))
            let y = Math.min(...room.components.map(r => r.arrayY))
            //top left might not be inside the room for l rooms
            if (!(room.components.some(c => c.arrayX === x && c.arrayY === y)))
                y++;
            if (room.checkmarkState >= Room.CLEARED) {
                if (room.checkmarkState >= Room.COMPLETED) {
                    graphics.setColor(green);
                } else {
                    graphics.setColor(gray);
                }
                graphics.drawString('✔', x * context.blockSize + (context.roomSize - fontSize) / 2 + 4, y * context.blockSize + context.roomSize - (context.roomSize - fontSize) / 2);
            } else if (room.checkmarkState === Room.ADJACENT) {
                graphics.setColor(black);
                graphics.drawString('?', x * context.blockSize + context.roomSize / 3 * 2 - fontSize / 3 - 1, y * context.blockSize + context.roomSize - (context.roomSize - fontSize) / 2);
            }
            //checkmark done
            if (room.checkmarkState !== Room.FAILED)
                return;
        }
        const location = room.components[0]

        const getX = (w) => (context.roomGap + context.roomSize - w) / 2 + context.blockSize * location.arrayX
        const getY = (h) => (context.roomGap + context.roomSize - h) / 2 + context.blockSize * location.arrayY

        const drawCheckmark = (checkmark) => {
            const [w, h] = context.getIconSize(checkmark)
            graphics.drawImage(context.getImage(checkmark), getX(w), getY(h), w, h, null)
        }

        if (room.checkmarkState === -1) drawCheckmark("failedRoom")
        if (room.checkmarkState === 1) drawCheckmark("questionMark")
        if (room.checkmarkState === 3) drawCheckmark("whiteCheck")
        if (room.checkmarkState === 4) drawCheckmark("greenCheck")
        if (room.checkmarkState === 5) drawCheckmark("failedRoom")


        return;
        if (context.tickStyle === 'tenios' && (room.type !== Room.PUZZLE || room.checkmarkState !== Room.FAILED)) return; //tenios map checkmaps are permanent 
        if (context.mapStyle === 'teniosmap' && (room.type !== Room.PUZZLE || context.puzzleNames === 'text')) return;

        if (context.tickStyle === 'secrets' || context.tickStyle === "secrets_underhead") return // Needs to be rendered in renderoverlay, see drawExtras()
        if (room.type === Room.PUZZLE && context.puzzleNames === "text") return
        if (room.type === Room.PUZZLE && (room.checkmarkState === Room.UNOPENED || room.checkmarkState === Room.OPENED)) return

    }

    drawPuzzle(context, room, dungeon) {
        if (room.type !== Room.PUZZLE) return;

        let location = room.components[0]

        let x = (context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
        let y = (context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

        x = context.posX + x * context.size + context.borderWidth
        y = context.posY + y * (context.size - context.borderWidth) + context.borderWidth

        let scale = context.size / 250 * context.iconScale / 8
        if (context.puzzleNames === "text" || (context.puzzleNames === 'icon' && context.tickStyle === 'roomnames' && (room.checkmarkState === Room.COMPLETED || room.checkmarkState === Room.FAILED)) || context.puzzleNames === 'none' && context.tickStyle === 'roomnames') {
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
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x + scale, ly, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x - scale, ly, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly + scale, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly - scale, scale)

                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(textColor + line, x, ly, scale)

                i++
            }
        } else if (context.puzzleNames === "icon") {
            if (['secrets', 'secrets_underhead'].includes(context.tickStyle)) return;
            //dont draw icons if checkmark or fail
            if (room.checkmarkState === Room.FAILED || room.checkmarkState === Room.COMPLETED) return;
            let icon = puzzleItems[room.data?.name] || barrier_block_item

            let iconScale = scale * 1.75
            icon.draw(x - 8 * iconScale, y - 8 * iconScale, iconScale)
        }
    }

    /**
     * 
     * @param {RenderContext} context 
     * @param {Room} room 
     */
    drawExtras(context, room, dungeon) {
        if (room.type === Room.PUZZLE) return;
        if (room.type === Room.SPAWN) return;

        drawSecretCount = () => {
            if (context.showSecretCount === 'never') return;
            if (context.checkmarkCompleteRooms && room.checkmarkState === Room.COMPLETED) return;
            if (context.showSecretCount === 'hasSecrets' && !room.maxSecrets > 0) return;

            let location = room.components[0]

            let x = (context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
            let y = (context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

            x = context.posX + x * context.size + context.borderWidth
            y = context.posY + y * (context.size - context.borderWidth) + context.borderWidth

            let scale = context.size / 175 * context.iconScale / 8

            if (room.maxSecrets === 10) x += 12 * scale

            let text = (room.currentSecrets ?? "?") + "/" + (room.maxSecrets ?? "?");

            if (room.type === Room.BLOOD) text = "0/0"

            let textColored = ""
            switch (room.checkmarkState) {
                case Room.ADJACENT:
                    textColored = (context.mapStyle === 'teniosmap' ? "&0" : "&7") + text
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
                    textColored = (context.mapStyle === 'teniosmap' ? "&0" : "&8") + text
                    break;
            }

            text = "&0" + text

            if (context.mapStyle !== 'teniosmap') {
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x + scale, y - 4.5 * scale, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x - scale, y - 4.5 * scale, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x, y + scale - 4.5 * scale, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x, y - scale - 4.5 * scale, scale)
            }
            if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(textColored, x, y - 4.5 * scale, scale)
        }

        drawRoomName = () => {
            if (context.tickStyle !== 'roomnames') return;
            if (context.showSecretCount === 'always') {
                if (!context.checkmarkCompleteRooms) return;
                if (context.checkmarkCompleteRooms && room.checkmarkState !== Room.COMPLETED) return;
            }
            if (context.showSecretCount === 'hasSecrets') {
                if (room.maxSecrets > 0 && (!context.checkmarkCompleteRooms || room.checkmarkState !== Room.COMPLETED)) return;
            }
            let location = room.components[0]

            let x = (context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
            let y = (context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

            x = context.posX + x * context.size + context.borderWidth
            y = context.posY + y * (context.size - context.borderWidth) + context.borderWidth

            let scale = context.size / 250 * context.iconScale / 8
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
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x + scale, ly, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x - scale, ly, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly + scale, scale)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly - scale, scale)

                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(textColor + line, x, ly, scale)

                i++

            }
        }

        drawSecretCount();
        drawRoomName();
        return;
        if (room.type === Room.SPAWN || room.type === Room.FAIRY) return

        if (context.mapStyle === 'teniosmap' && (room.type !== Room.PUZZLE || (context.tickStyle === 'secrets' && context.puzzleNames === 'icon'))) {
            let text = null;
            if (room.maxSecrets) {
                text = room.currentSecrets + '/' + room.maxSecrets
            } else if (context.tickStyle === 'secrets')
                text = (room.currentSecrets ?? "?") + "/" + (room.maxSecrets ?? "?");
            if (!text) return;
            let color = ''
            if (room.checkmarkState >= Room.COMPLETED)
                color = '&a'
            else if (room.checkmarkState >= Room.CLEARED)
                color = '&f'
            else if (room.checkmarkState === Room.FAILED)
                color = "&c"
            else
                color = '&0'
            text = color + text;

            let scale = context.size / 175 * context.iconScale / 8
            let x = Math.min(...room.components.map(r => r.arrayX))
            let y = Math.min(...room.components.map(r => r.arrayY))
            //top left might not be inside the room for l rooms
            if (!(room.components.some(c => c.arrayX === x && c.arrayY === y)))
                y++;
            x = (context.roomGap / 2 + context.blockSize * x + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
            y = (context.blockSize * y + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

            x = context.posX + x * context.size + context.borderWidth
            y = context.posY + y * (context.size - context.borderWidth) + context.borderWidth


            if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(text, x, y, scale)
        } else if (context.tickStyle === 'secrets' && (room.type !== Room.PUZZLE || (context.mapStyle !== 'teniosmap' && context.puzzleNames !== 'text'))) {


        }
    }

    /**
     * 
     * @param {RenderContext} context 
     * @param {*} type 
     * @returns 
     */
    getRenderColor(context, room) {
        if (context.mapStyle === 'teniosmap') {
            return context.colorMap.get(room.data?.type || teniosRoomMap[room.type])
        } else {
            return context.colorMap.get(room.type)
        }
    }

}

export default RoomRenderer

const teniosRoomMap = {
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