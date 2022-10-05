import renderLibs from "../../../guimanager/renderLibs";

const { default: MapTab } = require("../MapTab");

class BossMapRenderer extends MapTab {
    constructor(mapRenderer) {
        super("Boss", mapRenderer)

        const getBossImage = (imageName) => new Image(javax.imageio.ImageIO.read(new java.io.File(`./config/ChatTriggers/modules/BetterMap/Render/BossMapRendering/images/${imageName}`)))
        
        this.dungeonBossImages = {
            "F1": [
                {
                    image: getBossImage("floor1boss.png"),
                    bounds: [[-65, 70, -3], [-19, 90, 45]],
                    widthInWorld: 46,
                    heightInWorld: 48,
                    topLeftLocation: [-65, -3]
                }
            ],
            "F2": [
                {
                    image: getBossImage("floor2boss.png"),
                    bounds: [[-34, 100, -35], [18, 54, 15]],
                    widthInWorld: 52,
                    heightInWorld: 50,
                    topLeftLocation: [-34, -35]
                }
                
            ],
            "F3": [
                {
                    image: getBossImage("floor3boss.png"),
                    bounds: [[-33, 118, -34], [35, 64, 37]],
                    widthInWorld: 68,
                    heightInWorld: 73,
                    topLeftLocation: [-33, -34]
                }
                
            ],
            "F4": [
                {
                    image: getBossImage("floor4boss.png"),
                    bounds: [[-37, 114, -37], [47, 53, 47]],
                    widthInWorld: 84,
                    heightInWorld: 84,
                    topLeftLocation: [-33, -34]
                }
                
            ],
            "F5": [
                {
                    image: getBossImage("floor5boss.png"),
                    bounds: [[-35, 53, 2], [45, 112, 82]],
                    widthInWorld: 80,
                    heightInWorld: 80,
                    topLeftLocation: [-35, 2]
                }

            ],
            "F6": [
                {
                    image: getBossImage("floor6boss.png"),
                    bounds: [[-31, 51, -5], [13, 110, 94]],
                    widthInWorld: 44,
                    heightInWorld: 99,
                    topLeftLocation: [-31, -5]
                }
            ],
            "F7": [
                {
                    image: getBossImage("F7bossFinished.png"),
                    bounds: [[14, 161, 115], [42, 189, 153]],
                    widthInWorld: 28,
                    heightInWorld: 38,
                    topLeftLocation: [14, 115]
                },
                {
                    image: getBossImage("F7bossP1.png"),
                    bounds: [[33, 255, 11], [113, 213, 86]],
                    widthInWorld: 100,
                    heightInWorld: 75,
                    topLeftLocation: [33, 11]
                },
                {
                    image: getBossImage("F7bossP2.png"),
                    bounds: [[19, 212, -1], [127, 160, 107]],
                    widthInWorld: 108,
                    heightInWorld: 108,
                    topLeftLocation: [19, -1]
                },
                {
                    image: getBossImage("F7bossP3.png"),
                    bounds: [[-3, 159, 29], [111, 103, 143]],
                    widthInWorld: 114,
                    heightInWorld: 114,
                    topLeftLocation: [-3, 29]
                },
                {
                    image: getBossImage("F7bossP4.png"),
                    bounds: [[-3, 102, 19], [111, 54, 133]],
                    widthInWorld: 114,
                    heightInWorld: 94,
                    topLeftLocation: [-3, 19]
                },
                {
                    image: getBossImage("F7bossP5.png"),
                    bounds: [[-5, 53, -5], [131, 0, 142]],
                    widthInWorld: 136,
                    heightInWorld: 147,
                    topLeftLocation: [-5, -5]
                }
            ]
        }

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