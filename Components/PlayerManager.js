import MapPlayer from "./MapPlayer.js"

export default class PlayerManager {

    constructor() {
        /**
         * @type {Array<MapPlayer>}
         */
        this.players = [];
        this.playersNameToId = {};
    }
}