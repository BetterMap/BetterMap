import WebsiteCommunicator from "./../soopyApis/websiteCommunicator"
import socketData from "../soopyApis/socketData"

class BetterMapServer extends WebsiteCommunicator {
    constructor() {
        super(socketData.serverNameToId.bettermap)

        this.datacallback = undefined
    }

    onData(data) {
        if (this.datacallback) this.datacallback(data)
    }
    sendDungeonData(data) {
        this.sendData(data)
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