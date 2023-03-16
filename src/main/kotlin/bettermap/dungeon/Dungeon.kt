package bettermap.dungeon

/**
 * Holds all global variables used. Specific functions should be delegated into their own classes inside the dungeon package.
 */
object Dungeon {
    /**
     * Size of a room and door in blocks
     */
    const val roomSize: Int = 32

    /**
     * Top left corner of dungeon
     */
    const val startX: Int = -200
    const val startY: Int = -200
}
