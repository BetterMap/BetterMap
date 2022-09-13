import renderLibs from "../../guimanager/renderLibs"
import DungeonMap from "../Components/DungeonMap"
import { renderLore } from "../Utils/Utils"
import BossMapRenderer from "./BossMapRendering/BossMapRenderer"
import DungeonRenderer from "./MapRendering/DungeonRenderer"
import MapTab from "./MapTab"
import ScoreMapRenderer from "./ScoreRendering/ScoreMapRenderer"

class MapRenderer {
    constructor() {
        /**@type {Array<MapTab>} */
        this.tabs = [new DungeonRenderer(this), new BossMapRenderer(this), new ScoreMapRenderer(this)]
        this.selectedTabIndex = 0
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     * @param {Number} mouseX
     * @param {Number} mouseY
     */
    draw(renderContext, dungeonMap, mouseX, mouseY) {
        if (!renderContext) return

        if (renderContext.hideInBoss && (Player.getX() > 0 || Player.getZ() > 0)) return;

        let { x, y, size } = renderContext.getMapDimensions()

        this.drawTabs(renderContext, dungeonMap, mouseX, mouseY)

        Renderer.drawRect(Renderer.color(0, 0, 0, 100), x, y, size, size)//background

        this.tabs[this.selectedTabIndex].draw(renderContext, dungeonMap, mouseX, mouseY)

        Renderer.drawRect(Renderer.color(0, 0, 0), x, y, size, renderContext.borderWidth) //border
        Renderer.drawRect(Renderer.color(0, 0, 0), x, y, renderContext.borderWidth, size)
        Renderer.drawRect(Renderer.color(0, 0, 0), x + size - renderContext.borderWidth, y, renderContext.borderWidth, size)

        // Dont render bottom line if scoreinfo rendering
        // Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - this.borderWidth, size, this.borderWidth)

        // Score info under map
        if (renderContext.scoreInfoUnderMap === "legalmap") {
            let scoreInfoHeight = 10 * size / 100
            Renderer.drawRect(Renderer.color(0, 0, 0, 150), x, y + size, size, scoreInfoHeight)

            let scoreInfo = dungeonMap.getScore()
            renderLibs.drawStringCenteredFull("&f" + scoreInfo.total, x + size / 4, y + size + scoreInfoHeight / 2, size / 100)

            renderLibs.drawStringCenteredFull("&7Mimic " + (scoreInfo.mimic ? "&a✔" : "&c✕"), x + size / 4 * 3, y + size + scoreInfoHeight / 2, size / 100)


            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size, renderContext.borderWidth, scoreInfoHeight) //border of score info
            Renderer.drawRect(Renderer.color(0, 0, 0), x + size - renderContext.borderWidth, y + size, renderContext.borderWidth, scoreInfoHeight)
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size + scoreInfoHeight, size, renderContext.borderWidth)
        } else {
            Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size, size, renderContext.borderWidth)
        }

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

    /**
     * Draws the tabs on the map
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     * @param {Number} mouseX
     * @param {Number} mouseY
     */
    drawTabs(renderContext, dungeonMap, mouseX, mouseY) {
        let { x, y, size } = renderContext.getMapDimensions()

        let tabXOff = 0
        let tabI = 0
        for (let tab of this.tabs) {
            let tabW = Renderer.getStringWidth(tab.tabName) / 2 * size / 100 * 1.5
            let tabH = tab.getRenderHeight(renderContext, dungeonMap) * 5 * size / 100 * 1.5
            let maxTabH = 5 * size / 100 * 1.5

            renderLibs.scizzorFast(x + tabXOff, y - tabH, tabW, tabH)

            Renderer.drawRect(Renderer.color(0, 0, 0, 100), x + tabXOff, y - maxTabH, tabW, maxTabH) //background
            Renderer.drawRect(Renderer.color(0, 0, 0, 255), x + tabXOff, y - tabH, tabW, renderContext.borderWidth) //background
            Renderer.drawRect(Renderer.color(0, 0, 0, 255), x + tabXOff, y - maxTabH, renderContext.borderWidth, maxTabH) //background
            Renderer.drawRect(Renderer.color(0, 0, 0, 255), x + tabXOff + tabW - renderContext.borderWidth, y - maxTabH, renderContext.borderWidth, maxTabH) //background

            let hovered = (mouseX >= x + tabXOff && mouseX <= x + tabXOff + tabW
                && mouseY >= y - maxTabH && mouseY <= y)

            let textScale = size / 250 * 1.5
            renderLibs.drawStringCentered("&0" + tab.tabName, x + tabXOff + tabW / 2 + textScale, y - maxTabH + size / 100 * 1.5, textScale)
            renderLibs.drawStringCentered("&0" + tab.tabName, x + tabXOff + tabW / 2 - textScale, y - maxTabH + size / 100 * 1.5, textScale)
            renderLibs.drawStringCentered("&0" + tab.tabName, x + tabXOff + tabW / 2, y - maxTabH + size / 100 * 2 + textScale, textScale)
            renderLibs.drawStringCentered("&0" + tab.tabName, x + tabXOff + tabW / 2, y - maxTabH + size / 100 * 2 - textScale, textScale)
            renderLibs.drawStringCentered((hovered || tabI === this.selectedTabIndex ? "&f" : "&7") + tab.tabName, x + tabXOff + tabW / 2, y - maxTabH + size / 100 * 1.5, textScale)

            renderLibs.stopScizzor()
            tabXOff += tabW + size / 100 * 1.5
            tabI++
        }
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     * @param {Number} mouseX
     * @param {Number} mouseY
     * @param {Number} button The mouse button clicked
     * @param {Boolean} isPress Wether its a press or a release
     */
    clicked(renderContext, dungeonMap, mouseX, mouseY, button, isPress) {
        dungeonMap.roomGuiClicked(renderContext, mouseX, mouseY, button, isPress);

        if (!isPress) return

        let { x, y, size } = renderContext.getMapDimensions()

        let tabXOff = 0
        let tabI = 0
        for (let tab of this.tabs) {
            let tabW = Renderer.getStringWidth(tab.tabName) / 2 * size / 100 * 1.5
            let maxTabH = 5 * size / 100 * 1.5

            if (mouseX >= x + tabXOff && mouseX <= x + tabXOff + tabW
                && mouseY >= y - maxTabH && mouseY <= y
                && tab.shouldShowTab(renderContext, dungeonMap)) {
                this.selectedTabIndex = tabI
            }

            tabXOff += tabW + size / 100 * 1.5
            tabI++
        }
    }
}

export default MapRenderer