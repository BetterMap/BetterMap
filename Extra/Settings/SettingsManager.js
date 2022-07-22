import RenderContext from "../../Render/RenderContext";
import RenderContextManager from "../../Render/RenderContextManager";

class SettingsManager {

    /**
     * @param {RenderContextManager} renderContextManager 
     */
    constructor(renderContextManager) {
        this.renderContextManager = renderContextManager

        this.currentSettings = {}
    }

    /**
     * Creates a render context from the users currrent settings
     * Also adds the render context to a local list to get the settings modified if a setting is changed in the settings menu
     * @returns {RenderContext}
     */
    createRenderContext(settingOverrides) {
        let context = this.renderContextManager.createRenderContext({ ...this.currentSettings, ...settingOverrides })

        //TODO: add to internal list

        return context
    }
}

export default SettingsManager