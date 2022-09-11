import SoopyNumber from "../../guimanager/Classes/SoopyNumber"

class MapTab {
    /**
     * @param {String} tabName The name of the tab to show
     */
    constructor(tabName, mapRenderer) {
        this.mapRenderer = mapRenderer
        this.tabName = tabName

        this.renderHeight = new SoopyNumber(0)

        this.lastUpdatedShouldShow = 0
        this.lastShouldShow = false
    }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     * @param {Number} mouseX
     * @param {Number} mouseY
     */
    draw(renderContext, dungeonMap, mouseX, mouseY) { }

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    shouldShowTab(renderContext, dungeonMap) {
        return true
    }

    /**
     * Returns the height to render the tab's button (animations!!!)
     * (between 0-1)
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    getRenderHeight(renderContext, dungeonMap) {
        if (Date.now() - this.lastUpdatedShouldShow > 1000) {
            let newShow = this.shouldShowTab(renderContext, dungeonMap)

            if (!this.lastShouldShow && newShow) {
                this.mapRenderer.selectedTabIndex = this.mapRenderer.tabs.findIndex(a => a === this)
            }

            this.lastShouldShow = newShow

            this.renderHeight.set(this.lastShouldShow ? 1 : 0, 500)
            this.lastUpdatedShouldShow = Date.now()
        }

        return this.renderHeight.get()
    }
}

export default MapTab