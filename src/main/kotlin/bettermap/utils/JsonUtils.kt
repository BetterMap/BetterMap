package bettermap.utils

import com.google.gson.JsonArray
import com.google.gson.JsonElement
import com.google.gson.JsonObject
import com.google.gson.JsonPrimitive

fun JsonElement.asJsonArrayOrNull(): JsonArray? = this as? JsonArray

fun JsonElement.asJsonObjectOrNull(): JsonObject? = this as? JsonObject

fun JsonElement.asJsonPrimitiveOrNull(): JsonPrimitive? = this as? JsonPrimitive

fun JsonObject.getAsJsonArrayOrNull(member: String): JsonArray? = this.get(member)?.asJsonArrayOrNull()

fun JsonObject.getAsJsonObjectOrNull(member: String): JsonObject? = this.get(member)?.asJsonObjectOrNull()

fun JsonObject.getAsJsonPrimitiveOrNull(member: String): JsonPrimitive? = this.get(member)?.asJsonPrimitiveOrNull()
