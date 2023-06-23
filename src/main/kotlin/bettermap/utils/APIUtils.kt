package bettermap.utils

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.URL

object APIUtils {
    suspend fun fetch(url: String): String = withContext(Dispatchers.IO) { URL(url).readText() }
}
