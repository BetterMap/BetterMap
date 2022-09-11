import renderLibs from "../../../guimanager/renderLibs";

const { default: MapTab } = require("../MapTab");

class BossMapRenderer extends MapTab {
    constructor(mapRenderer) {
        super("Boss", mapRenderer)

        this.dungeonBossImages = {
            "F1": [
                {
                    image: new Image(javax.imageio.ImageIO.read(new java.io.File("./config/ChatTriggers/modules/BetterMap/Render/BossMapRendering/images/f1.png"))),
                    bounds: [[-65, 70, -3], [-19, 90, 45]],
                    widthInWorld: 46,
                    heightInWorld: 48,
                    topLeftLocation: [-64, -2]
                }
            ]
        }

        this.currentBossImage = undefined
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

        //render heads
        renderLibs.scizzor(x + renderContext.borderWidth, y + renderContext.borderWidth, size - 2 * renderContext.borderWidth, size - renderContext.borderWidth)
        for (let player of dungeonMap.players) {
            if (dungeonMap.deadPlayers.has(player.username.toLowerCase())) continue

            let renderX
            let renderY

            if (this.currentBossImage) {
                renderX = (player.location.worldX - this.currentBossImage.topLeftLocation[0]) / this.currentBossImage.widthInWorld * size
                renderY = (player.location.worldY - this.currentBossImage.topLeftLocation[1]) / this.currentBossImage.heightInWorld * size
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
        if (this.dungeonBossImages[dungeonMap.floor]) this.dungeonBossImages[dungeonMap.floor].forEach(data => {
            if (data.bounds[0][0] <= Player.getX() && data.bounds[0][1] <= Player.getY() && data.bounds[0][2] <= Player.getZ() && data.bounds[1][0] >= Player.getX() && data.bounds[1][1] >= Player.getY() && data.bounds[1][2] >= Player.getZ()) {
                this.currentBossImage = data
            }
        })
        this.lastUpdatedBossImage = Date.now()
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    shouldShowTab(renderContext, dungeonMap) {
        if (Date.now() - this.lastUpdatedBossImage > 2000) this.updateBossImage(renderContext, dungeonMap)

        return this.currentBossImage || Player.getX() > 0 || Player.getZ() > 0
    }
}

export default BossMapRenderer