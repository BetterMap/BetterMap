package bettermap.components.roomdata

import bettermap.BetterMap
import bettermap.BetterMap.Companion.mc
import bettermap.utils.APIUtils
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.File

object DungeonRoomData {
    private const val API_URL = "https://soopy.dev/api/bettermap/roomdata"
    private val cacheFile: File = File(mc.mcDataDir, "/config/bettermap/roomdata.json")
    private val fullRoomData: MutableList<RoomData> = mutableListOf()

    init {
        BetterMap.scope.launch(Dispatchers.IO) {
            try {
                // Read data from API
                val apiData = APIUtils.fetch(API_URL)
                loadFromString(apiData)

                // Save data locally if parsed without exception
                cacheFile.parentFile.mkdirs()
                cacheFile.createNewFile()
                cacheFile.bufferedWriter().use {
                    it.write(apiData)
                }
            } catch (e: Exception) {
                println("[BM] Error loading room data from API!")
                e.printStackTrace()
                try {
                    // Error fetching API data, use local cache
                    if (fullRoomData.isEmpty()) {
                        loadFromFile()
                    }
                } catch (e: Exception) {
                    println("[BM] Error reading room data from file!")
                    e.printStackTrace()
                }
            }
        }
    }

    fun loadFromFile() {
        loadFromString(cacheFile.bufferedReader().use { it.readText() })
    }

    fun loadFromAPI() {
        BetterMap.scope.launch(Dispatchers.IO) {
            loadFromString(APIUtils.fetch(API_URL))
        }
    }

    private fun loadFromString(data: String) {
        if (data.isNotEmpty()) {
            fullRoomData.clear()
            fullRoomData.addAll(BetterMap.gson.fromJson(data, object : TypeToken<List<RoomData>>() {}.type))
        }
    }

    fun getDataFromID(id: String): RoomData? {
        return fullRoomData.find { it.roomIDs.contains(id) }
    }

    fun getIDFromName(name: String): List<String>? {
        return fullRoomData.find { it.name == name }?.roomIDs
    }
}
