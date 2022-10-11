import renderLibs from "../../../guimanager/renderLibs";

const { default: MapTab } = require("../MapTab");

class BossMapRenderer extends MapTab {
    constructor(mapRenderer) {
        super("Boss", mapRenderer)

        const getBossImage = (imageName) => new Image("imgur_" + imageName, "https://i.imgur.com/" + imageName + ".png")

        this.dungeonBossImages = {}
        new Thread(() => {
            let newImageData = {
                "1": [
                    {
                        image: getBossImage("1IwaBgM"),
                        bounds: [[-65, 70, -3], [-19, 90, 45]],
                        widthInWorld: 46,
                        heightInWorld: 48,
                        topLeftLocation: [-65, -3]
                    }
                ],
                "2": [
                    {
                        image: getBossImage("Hn1xSu3"),
                        bounds: [[-34, 54, -35], [18, 100, 15]],
                        widthInWorld: 52,
                        heightInWorld: 50,
                        topLeftLocation: [-34, -35]
                    }

                ],
                "3": [
                    {
                        image: getBossImage("h52JPEI"),
                        bounds: [[-33, 64, -34], [35, 118, 37]],
                        widthInWorld: 68,
                        heightInWorld: 73,
                        topLeftLocation: [-33, -34]
                    }

                ],
                "4": [
                    {
                        image: getBossImage("m0uqjFN"),
                        bounds: [[-37, 53, -37], [47, 114, 47]],
                        widthInWorld: 84,
                        heightInWorld: 84,
                        topLeftLocation: [-33, -34]
                    }

                ],
                "5": [
                    {
                        image: getBossImage("dCcouUx"),
                        bounds: [[-35, 53, -5], [45, 112, 82]],
                        widthInWorld: 80,
                        heightInWorld: 80,
                        topLeftLocation: [-35, 2]
                    }

                ],
                "6": [
                    {
                        image: getBossImage("C0iMHhB"),
                        bounds: [[-31, 51, -5], [13, 110, 94]],
                        widthInWorld: 44,
                        heightInWorld: 99,
                        topLeftLocation: [-31, -5]
                    }
                ],
                "7": [
                    {
                        image: getBossImage("dbRNrEM"),
                        bounds: [[14, 161, 115], [42, 189, 153]],
                        widthInWorld: 28,
                        heightInWorld: 38,
                        topLeftLocation: [14, 115]
                    },
                    {
                        image: getBossImage("HO1CxQU"),
                        bounds: [[33, 213, 11], [113, 255, 86]],
                        widthInWorld: 100,
                        heightInWorld: 75,
                        topLeftLocation: [33, 11]
                    },
                    {
                        image: getBossImage("kMLGla2"),
                        bounds: [[19, 160, -1], [127, 212, 107]],
                        widthInWorld: 108,
                        heightInWorld: 108,
                        topLeftLocation: [19, -1]
                    },
                    {
                        image: getBossImage("9OjMNwt"),
                        bounds: [[-3, 103, 29], [111, 159, 143]],
                        widthInWorld: 114,
                        heightInWorld: 114,
                        topLeftLocation: [-3, 29]
                    },
                    {
                        image: getBossImage("lCBf5Ix"),
                        bounds: [[-3, 54, 19], [111, 102, 133]],
                        widthInWorld: 114,
                        heightInWorld: 94,
                        topLeftLocation: [-3, 19]
                    },
                    {
                        image: getBossImage("TqOs3ki"),
                        bounds: [[-5, 0, -5], [131, 53, 142]],
                        widthInWorld: 136,
                        heightInWorld: 147,
                        topLeftLocation: [-5, -5]
                    }
                ]
            }

            this.dungeonBossImages = newImageData
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
        this.currentBossImage = null
        if (this.dungeonBossImages[dungeonMap.floorNumber.toString()]) this.dungeonBossImages[dungeonMap.floorNumber.toString()].forEach(data => {
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
        return this.currentBossImage;
    }
}

export default BossMapRenderer