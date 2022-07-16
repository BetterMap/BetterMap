/// <reference types="../../CTAutocomplete" />
/// <reference lib="es2015" />

/**
 * A number
 * has some helper functions for smoothing ect
 * @class
 */
class SoopyNumber {
    /**
     * Creates a {@link SoopyNumber}
     * @constructor
     * @arg {Number} number The number
     */
    constructor(number) {
        /**
         * The number
         * @type {Number}
         */
        this.number = number

        this.lastNumber = number
        this.lastNumberUpdate = Date.now()
        this.currAnimTime = 0

        this.animMode = "sin"
    }

    /**
     * Allows setting the animation easing mode
     * @param {String} mode The animation mode
     */
    setAnimMode(mode) {
        this.animMode = mode
        return this
    }
    /**
     * Sets the Number
     * @arg {Number} number The new number
     * @returns {SoopyNumber} for method chaining
     */
    set(number, animationTime = 0) {
        if (this.number === number) return;

        this.lastNumber = this.get()
        this.lastNumberUpdate = Date.now()
        this.currAnimTime = animationTime

        this.number = number
        return this
    }

    /**
     * Returns the number
     * @returns {Number} The number
     */
    get() {
        if (this.currAnimTime === 0) return this.number
        if (this.lastNumberUpdate + this.currAnimTime < Date.now()) {
            this.currAnimTime = 0
            return this.number
        }

        switch (this.animMode) {
            case "sin": return this.lastNumber + ((1 - ((Math.cos(Math.PI * (Date.now() - this.lastNumberUpdate) / this.currAnimTime) + 1) / 2)) * (this.number - this.lastNumber))
            case "sin_out": return this.lastNumber + ((((Math.sin(0.5 * Math.PI * (Date.now() - this.lastNumberUpdate) / this.currAnimTime)))) * (this.number - this.lastNumber))
        }
    }

    isAnimating() {
        return !(this.currAnimTime === 0 || this.lastNumberUpdate + this.currAnimTime < Date.now())
    }
}

export default SoopyNumber