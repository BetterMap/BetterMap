package bettermap.components.roomdata

import com.google.gson.annotations.SerializedName

/**
 * Data class for information from API. All serialized names are included for easier maintenance.
 */
data class RoomData(
    @SerializedName("id")
    val roomIDs: List<String>,
    @SerializedName("name")
    val name: String,
    @SerializedName("type")
    val type: String,
    @SerializedName("shape")
    val shape: String,
    @SerializedName("doors")
    val doors: String,
    @SerializedName("secrets")
    val secrets: Int,
    @SerializedName("crypts")
    val crypts: Int,
    @SerializedName("revive_stones")
    val reviveStones: String,
    @SerializedName("journals")
    val journals: Int,
    @SerializedName("spiders")
    val spiders: Boolean,
    @SerializedName("secret_details")
    val secretData: SecretData,
    @SerializedName("soul")
    val fairySoul: Boolean,
    @SerializedName("index")
    val index: Int
)
