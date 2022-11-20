import WebsiteCommunicator from "./../soopyApis/websiteCommunicator"
import socketData from "../soopyApis/socketData"

class BetterMapServer extends WebsiteCommunicator {
    constructor() {
        super(socketData.serverNameToId.bettermap)

        this.datacallback = undefined
        this.peopleUsingBMapCallback = new Map()

        register("step", () => {
            for (let key of this.peopleUsingBMapCallback.keys()) {
                if (Date.now() - this.peopleUsingBMapCallback.get(key)[0] < 5000) return

                this.peopleUsingBMapCallback.get(key)[1](this.peopleUsingBMapCallback.get(key)[2])
                this.peopleUsingBMapCallback.delete(key)
            }
        }).setDelay(5)
    }

    onData(data) {
        if (data.type === "queryUsingBMap") {
            if (!this.peopleUsingBMapCallback.get(data.id)) return
            this.peopleUsingBMapCallback.get(data.id)[1](data.data)
            this.peopleUsingBMapCallback.delete(data.id)
            return
        }
        if (this.datacallback) this.datacallback(data)
    }
    sendDungeonData(data) {
        this.sendData(data)
    }
    isUsingBMap(people, callback) {
        let id = Math.floor(Math.random() * 1000000)

        this.sendData({
            queryUsingBMap: people,
            id
        })

        this.peopleUsingBMapCallback.set(id, [Date.now(), callback, new Array(people.length).fill(false)])
    }

    onConnect() {

    }
}

if (!global.betterMapServer) {
    global.betterMapServer = new BetterMapServer()

    register("gameUnload", () => {
        global.betterMapServer = undefined
    })
}

export default global.betterMapServer