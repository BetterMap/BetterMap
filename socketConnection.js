import WebsiteCommunicator from "./../soopyApis/websiteCommunicator"
import socketData from "../soopyApis/socketData"

class BetterMapServer extends WebsiteCommunicator {
    constructor() {
        super(socketData.serverNameToId.bettermap)

        this.datacallback = undefined
    }

    onData(data) {
        if (data.type === "dungeonSecretsData") {
            if (this.datachangecallback) this.datachangecallback(data.data)
        }
    }

    onConnect() {

    }
}

if (!global.betterMapServer) {
    global.betterMapServer = new LegalMapServer()

    register("gameUnload", () => {
        global.betterMapServer = undefined
    })
}

export default global.betterMapServer