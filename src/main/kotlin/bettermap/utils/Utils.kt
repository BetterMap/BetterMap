package bettermap.utils

object Utils {
    fun Any?.equalsOneOf(vararg other: Any): Boolean = other.any { this == it }
}
