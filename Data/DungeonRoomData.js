/**
 * @typedef {Object} SecretDetails
 * @property {Number} wither - Total wither essences in the room
 * @property {Number} redstone_key - Total redstone keys in the room
 * @property {Number} bat - Total bats in the room
 * @property {Number} item - Total items in the room
 * @property {Number} chest - Total chests in the room
 */

/**
 * @typedef {Object} DungeonData
 * @property {Array<String>} id - Array of possible room ids
 * @property {String} name - Name of the room
 * @property {"spawn"|"mobs"|"miniboss"|"rare"|"gold"|"puzzle"|"trap"|"blood"|"fairy"} type - Name of the room
 * @property {"1x1"|"1x2"|"1x3"|"1x4"|"2x2"|"L"} shape - Shape of the room
 * @property {String} doors - Possible door shape?
 * @property {Number} secrets - Total secrets in the room
 * @property {Number} crypts - Total crypts in the room
 * @property {Number} revive_stones - Total revive stones in the room
 * @property {Number} journals - Total journals in the room
 * @property {Boolean} spiders - Wether the room has lonely spiders
 * @property {SecretDetails} secret_details - More details about room secrets
 * @property {Boolean} soul - Wether the room has a fairy soul
 * @property {Boolean} index - The index of the room in the rooms data array, can be used as id in DungeonRoomStaticData.getDataFromId
 */

class DungeonRoomStaticData {
    constructor() {
        this.fullRoomData = JSON.parse(FileLib.read("BetterMap", "Data/roomdata.json"))

        this.idMap = new Map()
        this.fullRoomData.forEach((d, i) => {
            d.id.forEach(id => {
                this.idMap.set(id, i)
            })
            this.idMap.set(d.index, i)
        })
    }

    /**
     * 
     * @param {String} id the room id
     * @returns {DungeonData}
     */
    getDataFromId(id) {
        return this.fullRoomData[this.idMap.get(id)]
    }
}

export default new DungeonRoomStaticData()