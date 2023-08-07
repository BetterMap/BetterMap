package bettermap.utils

import com.google.gson.JsonParser
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

object APIUtils {
    val apiKey = "temp"

    suspend fun fetch(url: String): String = withContext(Dispatchers.IO) { URL(url).readText() }

    /**
     * -1 invalid api response
     * 0 couldn't parse
     */
    suspend fun getSecrets(uuid: String): Int {
        val response = fetch("https://api.hypixel.net/player?key=${apiKey}&uuid=${uuid}")
        val jsonObject = JsonParser().parse(response).asJsonObjectOrNull() ?: return -1
        if (jsonObject.getAsJsonPrimitiveOrNull("success")?.asBoolean == true) {
            return jsonObject.getAsJsonObjectOrNull("player")?.getAsJsonObjectOrNull("achievements")
                ?.getAsJsonPrimitiveOrNull("skyblock_treasure_hunter")?.asInt ?: return 0
        }
        return 0
    }
}
