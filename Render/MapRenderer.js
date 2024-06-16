import renderLibs from "../../guimanager/renderLibs"
import DungeonMap from "../Components/DungeonMap"
import { renderLore } from "../Utils/Utils"
import BossMapRenderer from "./BossMapRendering/BossMapRenderer"
import DungeonRenderer from "./MapRendering/DungeonRenderer"
import MapTab from "./MapTab"
import RenderContext from "./RenderContext"
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
        if (!renderContext.showMap) return;
        if (renderContext.hideInBoss && this.tabs[1].shouldShowTab(renderContext, dungeonMap)) return;

        let { x, y, size } = renderContext.getMapDimensions()

        if (renderContext.showTabs) {
            this.drawTabs(renderContext, dungeonMap, mouseX, mouseY)
        } else {
            for (let tab of this.tabs) {
                tab.getRenderHeight(renderContext, dungeonMap) // Update wether to show the tab or not (bad coding sideeffects moment D:)
            }
        }

        // BACKROUND COLOR
        Renderer.drawRect(Renderer.color(renderContext.settings.mapBackgroundColor[0] ?? 0, renderContext.settings.mapBackgroundColor[1] ?? 0, renderContext.settings.mapBackgroundColor[2] ?? 0, renderContext.settings.mapBackgroundColor[3] ?? 150), x, y, size, size)// Background

        this.tabs[this.selectedTabIndex].draw(renderContext, dungeonMap, mouseX, mouseY)

        // THIS IS THE LEFT TOP AND RIGHT BORDER IN THAT ORDER
        Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y, size, renderContext.borderWidth) // Border
        Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y, renderContext.borderWidth, size)
        Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x + size - renderContext.borderWidth, y, renderContext.borderWidth, size)

        // Dont render bottom line if scoreinfo rendering
        // Renderer.drawRect(Renderer.color(0, 0, 0), x, y + size - this.borderWidth, size, this.borderWidth)

        // Score info under map
        let scoreInfo = dungeonMap.getScore()
        let scoreInfoLore = []

        scoreInfoLore.push(`&fTotal score: &b${scoreInfo.total}`)
        scoreInfoLore.push(`&fSkill score: &a${scoreInfo.skill}`)
        scoreInfoLore.push(`&fExploration score: &a${scoreInfo.exploration}`)
        scoreInfoLore.push(`&fBonus score: &a${scoreInfo.bonus}`)
        scoreInfoLore.push(`&f`)
        scoreInfoLore.push(`&fSecrets Found: &b${scoreInfo.secretsFound}`)
        scoreInfoLore.push(`&fSecrets Left: &e${scoreInfo.secretsFound ? scoreInfo.totalSecrets - scoreInfo.secretsFound : "?"}`)
        scoreInfoLore.push(`&fTotal Secrets: &c${scoreInfo.secretsFound ? scoreInfo.totalSecrets : "?"}`)
        scoreInfoLore.push(`&f`)
        scoreInfoLore.push(`&fCrypts: &a${scoreInfo.crypts}/${scoreInfo.totalCrypts}+`)
        if ([6, 7].includes(dungeonMap.floorNumber)) scoreInfoLore.push(`&fMimic: &a${scoreInfo.mimic ? "&a✔" : "&c✘"}`)
        scoreInfoLore.push(`&f`)
        scoreInfoLore.push(`&fMin Secrets (s+): &a${scoreInfo.secretsFound ? scoreInfo.minSecrets : "?"}`)
        scoreInfoLore.push(`&fDeath penalty: &c${scoreInfo.deathPenalty}`)

        if (renderContext.scoreInfoUnderMap === "simplified") {
            let scoreInfoHeight = 10 * size / 100
            Renderer.drawRect(Renderer.color(renderContext.settings.extraInfoBackroundColor[0] ?? 0, renderContext.settings.extraInfoBackroundColor[1] ?? 0, renderContext.settings.extraInfoBackroundColor[2] ?? 0, renderContext.settings.extraInfoBackroundColor[3]), x, y + size, size, scoreInfoHeight)

            let colorScoreThingo = "c"
            if (scoreInfo.total >= 270) colorScoreThingo = "e"
            if (scoreInfo.total >= 300) colorScoreThingo = "a"

            renderLibs.drawStringCenteredFull("&" + colorScoreThingo + scoreInfo.total, x + size * (dungeonMap.floorNumber >= 6 ? 1 / 5 : 1 / 4), y + size + scoreInfoHeight / 2, size / 100)
            renderLibs.drawStringCenteredFull((scoreInfo.crypts >= 5 ? `&a${scoreInfo.crypts}` : scoreInfo.crypts > 0 ? `&e${scoreInfo.crypts}` : `&c0`) + 'c', x + size * (dungeonMap.floorNumber >= 6 ? 10 / 23 : 3 / 4), y + size + scoreInfoHeight / 2, size / 100)
            if (dungeonMap.floorNumber >= 6)
                renderLibs.drawStringCenteredFull((renderContext.settings.scoreInfoUnderMap_simplified_showMimicText ? "&7Mimic " : "") + (scoreInfo.mimic ? "&a✔" : "&c✕"), x + size / 4 * 3, y + size + scoreInfoHeight / 2, size / 100)


            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y + size, renderContext.borderWidth, scoreInfoHeight) // Border of score info
            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x + size - renderContext.borderWidth, y + size, renderContext.borderWidth, scoreInfoHeight)
            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y + size + scoreInfoHeight, size, renderContext.borderWidth)

            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y + size, renderContext.borderWidth, scoreInfoHeight) // Border of score info

            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x + size - renderContext.borderWidth, y + size, renderContext.borderWidth, scoreInfoHeight)
            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y + size + scoreInfoHeight, size, renderContext.borderWidth)
                ?? 0
            if (mouseX >= x && mouseX <= x + size
                && mouseY >= y + size && mouseY <= y + size + scoreInfoHeight) {

                renderLore(mouseX, mouseY, scoreInfoLore)
            }
        } else if (renderContext.scoreInfoUnderMap === "legalmap") {
            let scoreInfoHeight = 20 * size / 200
            Renderer.drawRect(Renderer.color(renderContext.settings.extraInfoBackroundColor[0] ?? 0, renderContext.settings.extraInfoBackroundColor[1] ?? 0, renderContext.settings.extraInfoBackroundColor[2] ?? 0, renderContext.settings.extraInfoBackroundColor[3]), x, y + size, size, scoreInfoHeight)

            let dSecrets = "&7Secrets: " + (!scoreInfo.secretsFound ? "&b?" : `&b${scoreInfo.secretsFound}&8-&e${scoreInfo.totalSecrets - scoreInfo.secretsFound}&8-&c${scoreInfo.totalSecrets}`)
            let dCrypts = "&7Crypts: " + (scoreInfo.crypts >= 5 ? `&a${scoreInfo.crypts}` : scoreInfo.crypts > 0 ? `&e${scoreInfo.crypts}` : `&c0`)
            let dMimic = [6, 7].includes(dungeonMap.floorNumber) ? ("&7Mimic: " + (scoreInfo.mimic ? "&a✔" : "&c✘")) : ""

            let minSecrets = "&7Min Secrets: " + (!scoreInfo.secretsFound ? "&b?" : scoreInfo.minSecrets > scoreInfo.secretsFound ? `&e${scoreInfo.minSecrets}` : `&a${scoreInfo.minSecrets}`)
            let dDeaths = "&7Deaths: " + (scoreInfo.deathPenalty > 0 ? `&c-${scoreInfo.deathPenalty}` : "&a0")
            let dScore = "&7Score: " + (scoreInfo.total >= 300 ? `&a` : scoreInfo.total >= 270 ? `&e` : `&c`) + scoreInfo.total

            let mapLine1 = `${dSecrets}    ${dCrypts}    ${dMimic}`.trim()
            let mapLine2 = `${minSecrets}    ${dDeaths}    ${dScore}`.trim()

            renderLibs.drawStringCenteredShadow(mapLine1, x + size / 2, y + size - 1, size / 220)
            renderLibs.drawStringCenteredShadow(mapLine2, x + size / 2, y + size - 1 + 10 * size / 200, size / 220)

            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y + size, renderContext.borderWidth, scoreInfoHeight) // Border of score info
            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x + size - renderContext.borderWidth, y + size, renderContext.borderWidth, scoreInfoHeight)
            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y + size + scoreInfoHeight, size, renderContext.borderWidth)

            if (mouseX >= x && mouseX <= x + size
                && mouseY >= y + size && mouseY <= y + size + scoreInfoHeight) {

                renderLore(mouseX, mouseY, scoreInfoLore)
            }
        } else {
            // BOTTOM BORDER IF DISABLED
            Renderer.drawRect(Renderer.color(renderContext.settings.mapBorderColor[0] ?? 0, renderContext.settings.mapBorderColor[1] ?? 0, renderContext.settings.mapBorderColor[2] ?? 0, renderContext.settings.mapBorderColor[3]), x, y + size, size, renderContext.borderWidth)
        }

        if (renderContext.currentRoomInfo !== "none") {
            let roomInfo = dungeonMap.getCurrentRoom()?.getLore()

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

            let bgc = renderContext.settings.mapBackgroundColor
            let bc = renderContext.settings.mapBorderColor
            Renderer.drawRect(Renderer.color(bgc[0] ?? 0, bgc[1] ?? 0, bgc[2] ?? 0, bgc[3] ?? 150), x + tabXOff, y - maxTabH, tabW, maxTabH) // Background
            Renderer.drawRect(Renderer.color(bc[0] ?? 0, bc[1] ?? 0, bc[2] ?? 0, bc[3]), x + tabXOff, y - tabH, tabW, renderContext.borderWidth) // Background
            Renderer.drawRect(Renderer.color(bc[0] ?? 0, bc[1] ?? 0, bc[2] ?? 0, bc[3]), x + tabXOff, y - maxTabH, renderContext.borderWidth, maxTabH) // Background
            Renderer.drawRect(Renderer.color(bc[0] ?? 0, bc[1] ?? 0, bc[2] ?? 0, bc[3]), x + tabXOff + tabW - renderContext.borderWidth, y - maxTabH, renderContext.borderWidth, maxTabH) // Background

            let hovered = (mouseX >= x + tabXOff && mouseX <= x + tabXOff + tabW && mouseY >= y - maxTabH && mouseY <= y)

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
        if (!renderContext.showTabs) return

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