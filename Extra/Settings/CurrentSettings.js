import RenderContext from "../../Render/RenderContext"

class CurrentSettings {

    #_settings;

    constructor() {
        /**@type {import("../../Render/RenderContext").ContextSettings} */
        this.#_settings = undefined
    }

    /**@returns {import("../../Render/RenderContext").ContextSettings} */
    get settings() {
        return this.#_settings || RenderContext.addMissing({})
    }

    set settings(sett) {
        this.#_settings = sett
    }
}

export default new CurrentSettings()