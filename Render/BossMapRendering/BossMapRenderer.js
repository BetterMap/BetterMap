import renderLibs from "../../../guimanager/renderLibs";
import { isBetween } from "../../Utils/Utils";

const { default: MapTab } = require("../MapTab");

class BossMapRenderer extends MapTab {
    constructor(mapRenderer) {
        super("Boss", mapRenderer)

        const getBossImage = (imageName) => new Image("imgur_" + imageName, "https:// I.imgur.com/" + imageName + ".png")

        this.dungeonBossImages = {}
        new Thread(() => {
            let imageData = JSON.parse(FileLib.read("BetterMap", "Render/BossMapRendering/imageData.json"))
            Object.keys(imageData).forEach(v => {
                for (let i of imageData[v]) i.image = getBossImage(i.image)
            })
            this.dungeonBossImages = imageData
        }).start()

        this.currentBossImage = null
        this.lastUpdatedBossImage = 0
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     * @param {Number} mouseX
     * @param {Number} mouseY
     */
    draw(renderContext, dungeonMap, mouseX, mouseY) {
        if (Date.now() - this.lastUpdatedBossImage > 2000) this.updateBossImage(renderContext, dungeonMap)
        let { x, y, size } = renderContext.getMapDimensions()
        if (this.currentBossImage) {
            this.currentBossImage.image.draw(x + renderContext.borderWidth, y + renderContext.borderWidth, size - renderContext.borderWidth * 2, size - renderContext.borderWidth)
        }

        // Render heads
        renderLibs.scizzor(x + renderContext.borderWidth, y + renderContext.borderWidth, size - 2 * renderContext.borderWidth, size - renderContext.borderWidth)
        for (let player of dungeonMap.players) {
            if (dungeonMap.deadPlayers.has(player.username.toLowerCase())) continue

            let renderX = null
            let renderY = null

            if (this.currentBossImage) {
                renderX = (player.location.worldX - this.currentBossImage.topLeftLocation[0]) / this.currentBossImage.widthInWorld * size
                renderY = (player.location.worldY - this.currentBossImage.topLeftLocation[1]) / this.currentBossImage.heightInWorld * size
            }
            else {
                renderX = (player.location.worldX - Player.getX() + 64) / 128 * size
                renderY = (player.location.worldY - Player.getZ() + 64) / 128 * size
            }

            player.drawIcon(renderContext, dungeonMap, renderX + x, renderY + y)
        }
        renderLibs.stopScizzor()
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    updateBossImage(renderContext, dungeonMap) {
        this.currentBossImage = null
        this.lastUpdatedBossImage = Date.now()
        let playerPos = [Player.getX(), Player.getY(), Player.getZ()]
        if (!this.dungeonBossImages[dungeonMap.floorNumber.toString()]) return
        this.dungeonBossImages[dungeonMap.floorNumber.toString()].forEach(data => {
            // Creates an array of player coords, corner1, corner2 and transposes it to make it easier to use the inBetween function.
            let c = [
                playerPos,
                data.bounds[0],
                data.bounds[1]
            ]
            let coords = [0,1,2].map(v => c.map(b => b[v])) // Transpose the matrix
            if (!coords.every(v => isBetween(...v))) return
            this.currentBossImage = data
        })
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    shouldShowTab(renderContext, dungeonMap) {
        if (Date.now() - this.lastUpdatedBossImage > 2000) this.updateBossImage(renderContext, dungeonMap)
        return this.currentBossImage;
    }
}

export default BossMapRenderer