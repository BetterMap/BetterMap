package bettermap.components

import com.google.gson.annotations.SerializedName

enum class RoomShape {
    @SerializedName("1x1")
    S1x1,
    @SerializedName("1x2")
    S1x2,
    @SerializedName("1x3")
    S1x3,
    @SerializedName("1x4")
    S1x4,
    @SerializedName("2x2")
    S2x2,
    @SerializedName("L")
    SL
}