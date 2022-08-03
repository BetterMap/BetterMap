class EventManager {

    EVENT_SECRETCOLLECT = 1
    // EVENT_ITEMPICKUP = 1

    constructor() {
        this.handlers = new Map()
    }

    triggerEvent(type, ...data) {
        for (let event of this.handlers.get(type)) {
            event(...data)
        }
    }

    /**
     * @callback secretCallback
     * @param {"wither"|"redstone_key"|"bat"|"item"|"chest"} secretType The type of secret collected
     * @param {Number} x The x location of the secret
     * @param {Number} y The y location of the secret
     * @param {Number} z The z location of the secret
     */

    /**
     * @param {secretCallback} callback 
     */
    onSecretCollect(callback) {
        this.handlers.set(EventManager.EVENT_SECRETCOLLECT, callback)
    }
}

if (!global.bettermapeventhandler) {
    /**@type {EventManager} */
    global.bettermapeventhandler = new EventManager()
}

/**@type {EventManager} */
let eventManager = global.bettermapeventhandler
export default eventManager