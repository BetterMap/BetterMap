export let RoomEvents = {
    CHECKMARK_STATE_CHANGE: 0,
    PLAYER_ENTER: 1,
    PLAYER_EXIT: 2,
    SECRET_COUNT_CHANGE: 3
}

let eventData = [
    (room, timestamp, fromState, toState) => {//CHECKMARK_STATE_CHANGE
        return "CHECKMARK CHANGE: " + room.checkmarkStateToName(fromState) + " -> " + room.checkmarkStateToName(toState)
    },
    (room, timestamp, player) => {//PLAYER_ENTER
        return "ENTER: " + player
    },
    (room, timestamp, player) => {//PLAYER_EXIT
        return "EXIT: " + player
    },
    (room, timestamp, from, to) => {//SECRET_COUNT_CHANGE
        return "SECRET CHANGE: " + from + " -> " + to
    }
]

export function createEvent(event, ...args) {
    return [event, Date.now(), ...args]
}

export function toDisplayString(room, event) {
    let [eventId, ...args] = event

    return eventData[eventId](room, ...args)
}