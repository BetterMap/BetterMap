package bettermap.components

/**
 * Adapted from /Components/Room.js
 */
enum class RoomType(color: Char) {
     SPAWN('a'),
     NORMAL('7'),
     PUZZLE('d'),
     MINIBOSS('e'),
     FAIRY('d'),
     BLOOD('c'),
     UNKNOWN('f'),
     TRAP('6'),
     BLACK('0') // For wither door only
}