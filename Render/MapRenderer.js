const BufferedImage = Java.type("java.awt.image.BufferedImage")

import { m } from "../../mappings/mappings"

import RoomRenderer from "./RoomRenderer"
import DoorRenderer from "./DoorRenderer"
import renderLibs from "../../guimanager/renderLibs"
import DungeonMap from "../Components/DungeonMap"
import RenderContext from "./RenderContext"
import { renderLore } from "../Utils/Utils"

class MapRenderer {
    constructor() {
        this.roomRenderer = new RoomRenderer();
        this.doorRenderer = new DoorRenderer();
    }

    /**
     * 
     * @param {DungeonMap} dungeon 
     * @param {RenderContext} renderContext 
     * @returns 
     */
    createMapImage(dungeon, renderContext) {
        let image = new BufferedImage(renderContext.getImageSize(dungeon.floor), renderContext.getImageSize(dungeon.floor), BufferedImage.TYPE_INT_ARGB);

        let graphics = image.createGraphics();

        //shift border + padding so less math involved
        graphics.translate(renderContext.paddingLeft + renderContext.borderWidth, renderContext.paddingTop + renderContext.borderWidth);

        //render all doors
        //rendering before rooms that way rooms cover it as there is 1 specific situation where early dungeon will put a room in the middle of an L shape
        for (let door of dungeon.doors.values()) {
            this.doorRenderer.drawDoor(renderContext, graphics, door);
        }
        //render all rooms
        for (let room of dungeon.roomsArr) {
            this.roomRenderer.drawRoom(renderContext, graphics, room);
        }

        graphics.dispose();
        return image;
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    draw(renderContext, dungeonMap) {
        if (!renderContext) return

        if (renderContext.image) {
            let { x, y, size } = renderContext.getMapDimensions()

            Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)//background

            renderContext.image.draw(x + renderContext.borderWidth, y + renderContext.borderWidth, size, size)

            for (let room of dungeonMap.roomsArr) {
                this.roomRenderer.drawExtras(renderContext, room, dungeonMap)
            }

            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, renderContext.borderWidth) //border
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y, renderContext.borderWidth, size)
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - renderContext.borderWidth, y, renderContext.borderWidth, size)

            //dont render bottom line if scoreinfo rendering
            //Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - this.borderWidth, size, this.borderWidth)

            //render heads
            renderLibs.scizzor(x + renderContext.borderWidth, y + renderContext.borderWidth, size - 2 * renderContext.borderWidth, size - renderContext.borderWidth)
            for (let player of dungeonMap.players) {
                player.drawIcon(renderContext, dungeonMap)
            }
            renderLibs.stopScizzor()

            //score info under map
            //TODO: add toggle

            let scoreInfoHeight = 10 * size / 100
            Renderer.drawRect(Renderer.color(0, 0, 0, 150), x, y + size, size, scoreInfoHeight)

            let scoreInfo = dungeonMap.getScore() //TODO: better display text
            renderLibs.drawStringCenteredFull(scoreInfo.total, x + size / 4, y + size + scoreInfoHeight / 2, size / 100)

            renderLibs.drawStringCenteredFull(scoreInfo.mimic.toString(), x + size / 4 * 3, y + size + scoreInfoHeight / 2, size / 100)


            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size, renderContext.borderWidth, scoreInfoHeight) //border of score info
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - renderContext.borderWidth, y + size, renderContext.borderWidth, scoreInfoHeight)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size + scoreInfoHeight, size, renderContext.borderWidth)

            if (renderContext.currentRoomInfo !== "none") {
                let roomInfo = dungeonMap.getPlayerRoom()?.getLore()

                if (roomInfo) {
                    let rx
                    let maxLoreWidth = roomInfo.reduce((cum, c) => Math.max(cum, Renderer.getStringWidth(ChatLib.removeFormatting(c))), 0)

                    if (renderContext.currentRoomInfo === "left") {
                        rx = x - maxLoreWidth - 8
                    } else {
                        rx = x + size
                    }

                    renderLore(rx - 12 + 4, y + 12 + 4, roomInfo)
                }
            }
        }

        if (!renderContext.image
            || (renderContext.imageLastUpdate < dungeonMap.lastChanged)) {
            //create image if not cached or cache outdated
            if (renderContext.image) {
                try {
                    renderContext.image.destroy()
                } catch (_) { }//if u dont have modified ct version
            }
            renderContext.image = new Image(this.createMapImage(dungeonMap, renderContext));

            renderContext.imageLastUpdate = Date.now()
        }
    }

}

export default MapRenderer