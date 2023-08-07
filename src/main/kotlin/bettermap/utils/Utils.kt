package bettermap.utils

import net.minecraft.item.ItemStack
import net.minecraft.util.StringUtils

object Utils {
    fun Any?.equalsOneOf(vararg other: Any): Boolean = other.any { this == it }

    fun String.removeFormatting(): String = StringUtils.stripControlCodes(this)

    val ItemStack.itemID: String
        get() = this.getSubCompound("ExtraAttributes", false)?.getString("id") ?: ""
}
