let roomHash = {
    SPAWN: 0,
    NORMAL: 1,
    PUZZLE: 2,
    MINIBOSS: 3,
    FAIRY: 4,
    BLOOD: 5,
    TRAP: 7,
    UNKNOWN: 6
}

export let roomColorMap = new Map()
roomColorMap.set(roomHash.SPAWN, new Color(Renderer.color(0, 124, 0, 255)))
roomColorMap.set(roomHash.NORMAL, new Color(Renderer.color(114, 67, 27, 255)))
roomColorMap.set(roomHash.PUZZLE, new Color(Renderer.color(178, 76, 216, 255)))
roomColorMap.set(roomHash.MINIBOSS, new Color(Renderer.color(229, 229, 51, 255)))
roomColorMap.set(roomHash.FAIRY, new Color(Renderer.color(242, 127, 165, 255)))
roomColorMap.set(roomHash.BLOOD, new Color(Renderer.color(255, 0, 0, 255)))
roomColorMap.set(roomHash.TRAP, new Color(Renderer.color(216, 127, 51, 255)))
roomColorMap.set(roomHash.UNKNOWN, new Color(Renderer.color(65, 65, 65, 255)))