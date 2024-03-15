import renderLibs from "../../../guimanager/renderLibs";
import { isBetween } from "../../Utils/Utils";

const { default: MapTab } = require("../MapTab");

class BossMapRenderer extends MapTab {
    constructor(mapRenderer) {
        super("Boss", mapRenderer)

        this.dungeonBossImages = {}
        new Thread(() => {
            let imageData = JSON.parse(FileLib.read("BetterMap", "Render/BossMapRendering/imageData.json"))
            Object.keys(imageData).forEach(v => {
                for (let i of imageData[v])
                    i.image = Image.fromAsset(i.image)
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

        let topLeftHudLocX = 0
        let topLeftHudLocZ = 0
        let sizeInWorld = 0
        let sizeInPixels = 0
        let textureScale = 0

        if (this.currentBossImage) {
            sizeInWorld = Math.min(this.currentBossImage.widthInWorld, this.currentBossImage.heightInWorld, this.currentBossImage.renderSize || Infinity)
            let pixelWidth = this.currentBossImage.image.getTextureWidth() / this.currentBossImage.widthInWorld * (this.currentBossImage.renderSize || this.currentBossImage.widthInWorld)
            let pixelHeight = this.currentBossImage.image.getTextureHeight() / this.currentBossImage.heightInWorld * (this.currentBossImage.renderSize || this.currentBossImage.heightInWorld)
            sizeInPixels = Math.min(pixelWidth, pixelHeight);

            textureScale = (size - 2 * renderContext.borderWidth) / sizeInPixels

            topLeftHudLocX = (Player.getX() - this.currentBossImage.topLeftLocation[0]) / (sizeInWorld) * (size - 2 * renderContext.borderWidth) - (size - 2 * renderContext.borderWidth) / 2
            topLeftHudLocZ = (Player.getZ() - this.currentBossImage.topLeftLocation[1]) / (sizeInWorld) * (size - 2 * renderContext.borderWidth) - (size - 2 * renderContext.borderWidth) / 2

            topLeftHudLocX = MathLib.clampFloat(topLeftHudLocX, 0, Math.max(0, this.currentBossImage.image.getTextureWidth() * textureScale - (size - 2 * renderContext.borderWidth)))
            topLeftHudLocZ = MathLib.clampFloat(topLeftHudLocZ, 0, Math.max(0, this.currentBossImage.image.getTextureHeight() * textureScale - (size - 2 * renderContext.borderWidth)))
        }

        renderLibs.scizzor(x + renderContext.borderWidth, y + renderContext.borderWidth, size - 2 * renderContext.borderWidth, size - renderContext.borderWidth)

        if (this.currentBossImage) {
            this.currentBossImage.image.draw(x + renderContext.borderWidth - topLeftHudLocX, y + renderContext.borderWidth - topLeftHudLocZ, this.currentBossImage.image.getTextureWidth() * textureScale, this.currentBossImage.image.getTextureHeight() * textureScale)
        }

        // Render heads
        for (let player of dungeonMap.players) {
            if (dungeonMap.deadPlayers.has(player.username.toLowerCase())) continue

            let renderX = null
            let renderY = null

            if (this.currentBossImage) {
                renderX = (player.location.worldX - this.currentBossImage.topLeftLocation[0]) / sizeInWorld * (size - 2 * renderContext.borderWidth) - topLeftHudLocX
                renderY = (player.location.worldY - this.currentBossImage.topLeftLocation[1]) / sizeInWorld * (size - 2 * renderContext.borderWidth) - topLeftHudLocZ
            } else {
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
            let coords = [0, 1, 2].map(v => c.map(b => b[v])) // Transpose the matrix
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