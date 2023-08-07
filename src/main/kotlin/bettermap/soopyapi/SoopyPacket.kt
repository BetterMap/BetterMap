package bettermap.soopyapi

import com.google.gson.JsonElement

data class SoopyPacket(val type: Int, val server: Int, val data: JsonElement) {
    constructor(
        type: SoopyPacketType,
        server: SoopyPacketServer,
        data: JsonElement
    ) : this(type.ordinal, server.ordinal, data)
}

enum class SoopyPacketType {
    SUCCESS, DATA, JOIN_SERVER, PING, SERVER_REBOOT
}

enum class SoopyPacketServer(name: String, displayName: String, module: String) {
    API("soopyapis", "SoopyApi", "soopyApis"),
    TEST_CHAT("soopytestchatthing", "SoopyTestChatThing", "SoopyTestChatThing"),
    MINE_WAYPOINT("minewaypoints", "Mine Way Points", "minewaypoints"),
    SOOPYV2("soopyv2", "SoopyV2", "SoopyV2"),
    SBGBOT("sbgbot", "SbgBot", "sbgbot"),
    SOCKET_UTILS("socketutils", "SocketUtils", "socketUtils"),
    LEGALMAP("legalmap", "LegalMap", "LegalMap"),
    BETTERMAP("bettermap", "BetterMap", "BetterMap")
}
