package bettermap.components.roomdata

import com.google.gson.annotations.SerializedName

data class SecretData(
    @SerializedName("wither")
    val witherEssences: Int,
    @SerializedName("redstone_key")
    val redstoneKeys: Int,
    @SerializedName("bat")
    val bats: Int,
    @SerializedName("item")
    val items: Int,
    @SerializedName("chest")
    val chests: Int
)
