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

const checkmarkStateToName = new Map()
checkmarkStateToName.set(-1, "failedRoom")
checkmarkStateToName.set(1, "questionMark")
checkmarkStateToName.set(3, "whiteCheck")
checkmarkStateToName.set(4, "greenCheck")
checkmarkStateToName.set(5, "failedRoom")

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
        let color = this.getRenderColor(context, room)
        graphics.setColor(color)

        let rc = room.components // effort to type
        // Drawing the main room and its sections

        // Draws a rectangle on the map
        const draw = (x, y, w, h, xa = 0, ya = 0) => graphics.fillRect(x * context.blockSize + context.roomGap / 2 + xa, y * context.blockSize + context.roomGap / 2 + ya, w, h);

        // Main room components and connectors
        for (let component of rc) {
            let x = component.arrayX
            let y = component.arrayY

            draw(x, y, context.roomSize, context.roomSize);

            if (rc.some(a => a.arrayX == x + 1 && a.arrayY == y))
                draw(x, y, context.roomGap, context.roomSize, context.roomSize, 0) // Component to the right

            if (rc.some(a => a.arrayX == x && a.arrayY == y + 1))
                draw(x, y, context.roomSize, context.roomGap, 0, context.roomSize) // Component above

            // 2x2 Center
            if (rc.length == 4 && new Set(rc.map(a => a.arrayX)).size == 2 && x == Math.min(...rc.map(a => a.arrayX)) && y == Math.min(...rc.map(a => a.arrayY)))
                draw(x, y, context.roomGap, context.roomGap, context.roomSize, context.roomSize)
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
        } else {
            //dont show checkmarks if all rooms are rendered by name
            if (context.showSecretCount === 'always') {
                if (!context.checkmarkCompleteRooms) return;
                if (context.checkmarkCompleteRooms && room.checkmarkState !== Room.COMPLETED) return;
            }
            if (context.showSecretCount === 'hasSecrets' && room.maxSecrets > 0) {
                if (!context.checkmarkCompleteRooms) return;
                if (context.checkmarkCompleteRooms && room.checkmarkState !== Room.COMPLETED) return;
            }
        }
        //room names are rendered in drawExtras 
        if (context.tickStyle === 'roomnames') return;


        let location = [room.components[0].arrayX, room.components[0].arrayY];
        if (context.centerCheckmarks) {
            let minX = Math.min(...room.components.map(a => a.arrayX))
            let minZ = Math.min(...room.components.map(a => a.arrayY))
            let roomWidth = Math.max(...room.components.map(a => a.arrayX)) - minX
            let roomHeight = Math.max(...room.components.map(a => a.arrayY)) - minZ
            location = [
                minX + (roomWidth) / 2,
                minZ + (roomHeight) / 2
            ]
            // Move the checkmark up or down so that they don't spawn in the exact center like for 2x2 rooms
            if (room.shape == "L") {
                if (room.components.filter(a => a.arrayY == minZ).length == 2) location[1] -= roomHeight / 2
                else location[1] += roomHeight / 2
            }
        }

        //tenios checkmark is perm on the image
        if (context.tickStyle === 'tenios') {
            //this is considered an icon, not a font
            let fontSize = 24 * context.iconScale / 10 || 24;
            let teniosFont = new Font('Dialog', Font.BOLD, fontSize);
            graphics.setFont(teniosFont);
            if (room.checkmarkState >= Room.CLEARED) {
                if (room.checkmarkState >= Room.COMPLETED) {
                    graphics.setColor(green);
                } else {
                    graphics.setColor(gray);
                }
                graphics.drawString('✔', location[0] * context.blockSize + (context.roomSize - fontSize) / 2 + 4, location[1] * context.blockSize + context.roomSize - (context.roomSize - fontSize) / 2);
            } else if (room.checkmarkState === Room.ADJACENT) {
                graphics.setColor(black);
                graphics.drawString('?', location[0] * context.blockSize + context.roomSize / 3 * 2 - fontSize / 3 - 1, location[1] * context.blockSize + context.roomSize - (context.roomSize - fontSize) / 2);
            }
            //checkmark done
            if (room.checkmarkState !== Room.FAILED)
                return;
        }

        const getX = (w) => (context.roomGap + context.roomSize - w) / 2 + context.blockSize * location[0]
        const getY = (h) => (context.roomGap + context.roomSize - h) / 2 + context.blockSize * location[1]

        const drawCheckmark = (checkmark) => {
            const [w, h] = context.getIconSize(checkmark).map(a => a * 1.5)
            graphics.drawImage(context.getImage(checkmark), getX(w), getY(h), w, h, null)
        }

        if (checkmarkStateToName.has(room.checkmarkState)) {
            drawCheckmark(checkmarkStateToName.get(room.checkmarkState))
        }
    }

    drawPuzzle(context, room, dungeon) {
        if (room.type !== Room.PUZZLE) return;

        let location = room.components[0]

        let x = (context.roomGap / 2 + context.blockSize * location.arrayX + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
        let y = (context.roomGap / 2 + context.blockSize * location.arrayY + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

        x = context.posX + x * context.size + context.borderWidth
        y = context.posY + y * (context.size - context.borderWidth) + context.borderWidth

        let scale = context.size / 250 * context.iconScale / 8
        let textScale = context.size / 250 * context.textScale / 8
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
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                let ly = y + 9 * scale * (i - text.length / 2)
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x + scale, ly, scale)

                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x - scale, ly, scale)

                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly + scale, scale)

                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly - textScale, textScale)

                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(textColor + line, x, ly, textScale)

                i++
            }
        } else if (context.puzzleNames === "icon") {
            if (context.tickStyle === 'secrets') return;
            //dont draw icons if checkmark or fail
            if (room.checkmarkState === Room.FAILED || room.checkmarkState === Room.COMPLETED) return;
            let icon = puzzleItems[room.data?.name] || barrier_block_item

            if (context.settings.spinnyMap) {
                Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                Renderer.rotate(-(Player.getYaw() + 180))
                Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
            }

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

        drawSecretCount = (location) => {
            if (context.showSecretCount === 'never') return;
            if (context.checkmarkCompleteRooms && room.checkmarkState === Room.COMPLETED) return;
            if (context.showSecretCount === 'hasSecrets' && !room.maxSecrets > 0) return;

            let x = (context.roomGap / 2 + context.blockSize * location[0] + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
            let y = (context.roomGap / 2 + context.blockSize * location[1] + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

            x = context.posX + x * context.size + context.borderWidth
            y = context.posY + y * (context.size - context.borderWidth) + context.borderWidth

            let textScale = context.size / 175 * context.textScale / 8

            if (room.maxSecrets === 10 && !context.centerCheckmarks) x += 12 * textScale

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
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x + textScale, y - 4.5 * textScale, textScale)
                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x + textScale, y - 4.5 * textScale, textScale)
                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x + textScale, y - 4.5 * textScale, textScale)
                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(text, x, y - textScale - 4.5 * textScale, textScale)
            }
            
            if (context.settings.spinnyMap) {
                Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                Renderer.rotate(-(Player.getYaw() + 180))
                Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
            }
            if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
            renderLibs.drawStringCenteredShadow(textColored, x, y - 4.5 * textScale, textScale)
        }

        drawRoomName = (location) => {
            if (context.tickStyle !== 'roomnames') return;
            if (context.showSecretCount === 'always') {
                if (!context.checkmarkCompleteRooms) return;
                if (context.checkmarkCompleteRooms && room.checkmarkState !== Room.COMPLETED) return;
            }
            if (context.showSecretCount === 'hasSecrets') {
                if (room.maxSecrets > 0 && (!context.checkmarkCompleteRooms || room.checkmarkState !== Room.COMPLETED)) return;
            }

            let x = (context.roomGap / 2 + context.blockSize * location[0] + context.roomSize / 2 + context.borderWidth + context.paddingLeft) / context.getImageSize(dungeon.floor)
            let y = (context.roomGap / 2 + context.blockSize * location[1] + context.roomSize / 2 + context.borderWidth + context.paddingTop) / context.getImageSize(dungeon.floor)

            x = context.posX + x * context.size + context.borderWidth
            y = context.posY + y * (context.size - context.borderWidth) + context.borderWidth

            let scale = context.size / 250 * context.textScale / 8
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
                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x + scale, ly, scale)
                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x - scale, ly, scale)
                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly + scale, scale)
                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow("&0" + line, x, ly - scale, scale)

                
                if (context.settings.spinnyMap) {
                    Renderer.translate((context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                    Renderer.rotate(-(Player.getYaw() + 180))
                    Renderer.translate(-(context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2), -(context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2));
                }
                if (context.tickStyle_secrets_overHead) Renderer.translate(0, 0, 100)
                renderLibs.drawStringCenteredShadow(textColor + line, x, ly, scale)

                i++

            }
        }
        
        let location = [room.components[0].arrayX, room.components[0].arrayY];
        if (context.centerCheckmarks) {
            let minX = Math.min(...room.components.map(a => a.arrayX))
            let minZ = Math.min(...room.components.map(a => a.arrayY))
            let roomWidth = Math.max(...room.components.map(a => a.arrayX)) - minX
            let roomHeight = Math.max(...room.components.map(a => a.arrayY)) - minZ
            location = [
                minX + (roomWidth) / 2,
                minZ + (roomHeight) / 2
            ]
            // Move the checkmark up or down so that they don't spawn in the exact center like for 2x2 rooms
            if (room.shape == "L") {
                if (room.components.filter(a => a.arrayY == minZ).length == 2) location[1] -= roomHeight / 2
                else location[1] += roomHeight / 2
            }
        }

        drawSecretCount(location);
        drawRoomName(location);
        return;
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
        } else if (context.mapStyle === 'custom') {
            switch (room.data?.type || teniosRoomMap[room.type]) {
                case 'spawn': return new Color(Renderer.color(...context.customRoomColorSpawn), true);
                case 'mobs': return new Color(Renderer.color(...context.customRoomColorNormal), true);
                case 'miniboss': return new Color(Renderer.color(...context.customRoomColorMini), true);
                case 'rare': return new Color(Renderer.color(...context.customRoomColorRare), true);
                case 'puzzle': return new Color(Renderer.color(...context.customRoomColorPuzzle), true);
                case 'gold': return new Color(Renderer.color(...context.customRoomColorGold), true);
                case 'fairy': return new Color(Renderer.color(...context.customRoomColorFairy), true);
                case 'blood': return new Color(Renderer.color(...context.customRoomColorBlood), true);
                case 'trap': return new Color(Renderer.color(...context.customRoomColorTrap), true);
                case 'wither': return new Color(Renderer.color(...context.customRoomColorWitherDoor), true);
                default:
                case 'unknown': return new Color(Renderer.color(...context.customRoomColorUnknown), true);
            }
        }
        else {
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