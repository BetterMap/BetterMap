package bettermap.utils

import bettermap.BetterMap.Companion.mc
import bettermap.utils.Utils.removeFormatting
import net.minecraft.scoreboard.ScorePlayerTeam

object Scoreboard {
    /**
     * Removes special characters and formatting.
     */
    fun cleanLine(scoreboard: String): String = scoreboard.removeFormatting().filter { it.code in 32..126 }

    /**
     * Gets the side scoreboard lines, or an empty list if there is none.
     */
    fun getLines(): List<String> {
        return mc.theWorld?.scoreboard?.run {
            getSortedScores(getObjectiveInDisplaySlot(1) ?: return emptyList())
                .filter { it?.playerName?.startsWith("#") == false }
                .let { if (it.size > 15) it.drop(15) else it }
                .map { ScorePlayerTeam.formatPlayerName(getPlayersTeam(it.playerName), it.playerName) }
        } ?: emptyList()
    }
}
