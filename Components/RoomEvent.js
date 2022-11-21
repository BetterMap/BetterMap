import { timeNumber } from "../Utils/Utils"

/**
 * @readonly
 * @enum {Number}
 */
export let RoomEvents = {
    CHECKMARK_STATE_CHANGE: 0,
    PLAYER_ENTER: 1,
    PLAYER_EXIT: 2,
    SECRET_COUNT_CHANGE: 3
}

let eventData = [
    (room, timestamp, fromState, toState) => {// CHECKMARK_STATE_CHANGE
        return timeNumber(Date.now() - timestamp) + " CHECKMARK CHANGE: " + room.checkmarkStateToName(fromState) + " -> " + room.checkmarkStateToName(toState)
    },
    (room, timestamp, player) => {// PLAYER_ENTER
        return timeNumber(Date.now() - timestamp) + " ENTER: " + player.username
    },
    (room, timestamp, player) => {// PLAYER_EXIT
        return timeNumber(Date.now() - timestamp) + " EXIT: " + player.username
    },
    (room, timestamp, from, to) => {// SECRET_COUNT_CHANGE
        return timeNumber(Date.now() - timestamp) + " SECRET CHANGE: " + from + " -> " + to
    }
]

export function createEvent(event, ...args) {
    return [event, Date.now(), ...args]
}

export function toDisplayString(room, event) {
    let [eventId, ...args] = event

    return eventData[eventId](room, ...args)
}