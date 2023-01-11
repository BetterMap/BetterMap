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
    draw(renderContext, dungeonMap, mouseX, mouseY) { } // This function should be overridden all the time, but adding it for tab completion

    /**
     * @param {RenderContext} renderContext 
     * @param {DungeonMap} dungeonMap 
     */
    shouldShowTab(renderContext, dungeonMap) {
        return true // Default to showing tab always unless overridden
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

                // Tab now avalible
                // Switch to this tab

                this.mapRenderer.selectedTabIndex = this.mapRenderer.tabs.findIndex(a => a === this)

            } else if (this.lastShouldShow && !newShow) {

                // Tab no longer avalible
                // Switch to tab index before first disabled tab

                this.mapRenderer.selectedTabIndex = Math.max(0, this.mapRenderer.tabs.findIndex(a => !a.shouldShowTab(renderContext, dungeonMap)) - 1)
            }

            this.lastShouldShow = newShow

            this.renderHeight.set(this.lastShouldShow ? 1 : 0, 500)

            this.lastUpdatedShouldShow = Date.now()
        }

        return this.renderHeight.get()
    }

    /**
     * @param {import("../Render/RenderContext").default} context
     * @param {import("../Components/DungeonMap").default} dungeonMap
     */
    translateRotateForSpinny(context, dungeonMap) {
        let centerX = (context.settings.posX + context.paddingLeft + context.borderWidth + context.settings.size / 2)
        let centerY = (context.settings.posY + context.paddingLeft + context.borderWidth + context.settings.size / 2)

        if (context.centeredMap && context.spinnyMap) {
            let [x, y] = dungeonMap.currentPlayer?.getRenderLocation(context, dungeonMap) || [centerX, centerY];
            Renderer.translate(x, y)
            Renderer.rotate(-(Player.getYaw() + 180))
            Renderer.translate(-centerX, - centerY);
            return
        }
        if (context.centeredMap) {
            let [x, y] = dungeonMap.currentPlayer?.getRenderLocation(context, dungeonMap) || [centerX, centerY];
            Renderer.translate(centerX - x, centerY - y)
        }
        if (context.spinnyMap) {
            Renderer.translate(centerX, centerY);
            Renderer.rotate(-(Player.getYaw() + 180))
            Renderer.translate(-centerX, -centerY);
        }
    }
}

export default MapTab