class EventManager {

    EVENT_SECRETCOLLECT = 1
    EVENT_SECRETSTEP = 2
    EVENT_ETHERWARP = 3
    EVENT_SUPERBOOM = 4
    EVENT_STONK = 5

    constructor() {
        this.handlers = new Map()
    }

    triggerEvent(type, ...data) {
        try {
            for (let event of (this.handlers.get(type) || [])) {
                event(...data)
            }
        } catch (e) {
            console.error(JSON.stringify(e, undefined, true))
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
     * Event for whenever the player collects a secret
     * This will not trigger if soneone else in the party collects one
     * 
     * @param {secretCallback} callback 
     */
    onSecretCollect(callback) {
        this.addHandler(this.EVENT_SECRETCOLLECT, callback)
    }

    /**
     * @callback secretStepCallback
     * @param {"lever"} stepType The type of secret step done
     * @param {Number} x The x location of the action
     * @param {Number} y The y location of the action
     * @param {Number} z The z location of the action
     */

    /**
     * Event for whenever the player does a step in getting a secret
     * EG flicking a lever
     * This will not trigger if soneone else in the party does it
     * 
     * @param {secretStepCallback} callback 
     */
    onSecretStep(callback) {
        this.addHandler(this.EVENT_SECRETSTEP, callback)
    }

    /**
     * @callback etherwarpCallback
     * @param {Number} x The x location of the action
     * @param {Number} y The y location of the action
     * @param {Number} z The z location of the action
     */

    /**
     * Event for whenever the player etherwarps
     * This will not trigger if soneone else in the party does it
     * 
     * @param {etherwarpCallback} callback 
     */
    onEtherwarp(callback) {
        this.addHandler(this.EVENT_ETHERWARP, callback)
    }

    /**
     * @callback superboomCallback
     * @param {Number} x The x location of the action
     * @param {Number} y The y location of the action
     * @param {Number} z The z location of the action
     */

    /**
     * Event for when the player uses any kind of explosive (breaking superboom walls)
     * NOTE: THIS MIGHT ALSO BE SPIRIT SCEPTER
     * This will not trigger if soneone else in the party does it
     * 
     * @param {superboomCallback} callback 
     */
    onSuperboom(callback) {
        this.addHandler(this.EVENT_SUPERBOOM, callback)
    }

    /**
     * @callback stonkCallback
     * @param {Number} x The x location of the action
     * @param {Number} y The y location of the action
     * @param {Number} z The z location of the action
     */

    /**
     * Event for when the player stonks a block
     * This will not trigger if soneone else in the party does it
     * 
     * @param {stonkCallback} callback 
     */
    onStonk(callback) {
        this.addHandler(this.EVENT_STONK, callback)
    }

    addHandler(type, callback) {
        if (!this.handlers.get(type)) {
            this.handlers.set(type, [callback])
            return
        }

        this.handlers.get(type).push(callback)
    }
}

if (!global.bettermapeventhandler) {
    /**@type {EventManager} */
    global.bettermapeventhandler = new EventManager()
}

/**@type {EventManager} */
let eventManager = global.bettermapeventhandler
export default eventManager