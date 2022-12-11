import RenderContext from "../../Render/RenderContext";
import Notification from "../../../guimanager/Notification"

class SettingsObj {
    constructor() {
        let settingsFile = JSON.parse(FileLib.read("soopyAddonsData", "bettermapsettings.json"))

        this.defaultSettings = {
            showMap: true,
            mapStyle: "legalmap",
            posX: 0,
            posY: 0,
            size: 100,
            showHeads: 'heads',
            headScale: 8,
            iconScale: 10,
            tickStyle: "default",
            tickStyle_secrets_overHead: true,
            showSecretCount: "never",
            checkmarkCompleteRooms: false,
            puzzleNames: "none",
            headBorder: "none",
            headBorderWidth: 3,
            playerNames: "leap",
            currentRoomInfo: "none",
            scoreInfoUnderMap: "simplified",
            scoreInfoUnderMap_simplified_showMimicText: true,
            showScoreMessage: 'never',
            custom270scoreMessage: '270 Score reached!',
            custom300scoreMessage: '300 Score reached!',
            tabSecretCount: false,
            tabCryptCount: false,
            tabMimic: false,
            fixScore: true,
            hideInBoss: false,
            showTabs: true,
            showSecrets: false,
            spiritLeapOverlay: false,
            forcePaul: false,
            clearedRoomInfo: true,
            devInfo: false,
            boxDoors: true,
            mapBorderColor: [0, 0, 0, 255],
            mapBackgroundColor: [0, 0, 0, 100],
            extraInfoBackroundColor: [0, 0, 0, 100],
            healerColor: [240, 70, 240, 255],
            mageColor: [70, 210, 210, 255],
            bersColor: [255, 0, 0, 255],
            archColor: [30, 170, 50, 255],
            tankColor: [150, 150, 150, 255],
            singleBorderColor: [0, 0, 0, 255],
            singleBorderColorSelf: [0, 0, 0, 255],
            customRoomColorNormal: [114, 67, 27, 255],
            customRoomColorMini: [114, 67, 27, 255],
            customRoomColorRare: [114, 67, 27, 255],
            customRoomColorFairy: [239, 126, 163, 255],
            customRoomColorBlood: [255, 0, 0, 255],
            customRoomColorTrap: [213, 126, 50, 255],
            customRoomColorSpawn: [0, 123, 0, 255],
            customRoomColorGold: [226, 226, 50, 255],
            customRoomColorPuzzle: [176, 75, 213, 255],
            customRoomColorUnknown: [64, 64, 64, 255],
            customRoomColorWitherDoor: [0, 0, 0, 255],
            customRoomGapSize: 9,
            customDoorSize: 15,
            spinnyMap: false
        }

        if (typeof settingsFile.activeProfile === 'undefined') {
            let fixedSettingsFile = {}

            fixedSettingsFile.apiKey = settingsFile.apiKey ?? ""
            delete settingsFile.apiKey

            fixedSettingsFile.activeProfile = "Profile 1"

            fixedSettingsFile.profiles = {}
            fixedSettingsFile.profiles["Profile 1"] = settingsFile

            FileLib.write("soopyAddonsData", "bettermapsettings.json", JSON.stringify(fixedSettingsFile))
            settingsFile = fixedSettingsFile
        }
        this.apiKey = settingsFile.apiKey ?? ""
        this.activeProfile = settingsFile.activeProfile
        this.profiles = settingsFile.profiles

        Object.entries(this.profiles[this.activeProfile]).forEach(([key, value]) => {
            //ChatLib.chat(key + ": " + value)
            this[key] = value
        })

        this.addMissing()
    }

    get settings() {
        let settings = this.profiles[this.activeProfile]
        return settings
    }

    getProfiles() {
        let profiles = {}
        Object.entries(this.profiles).forEach(([key, value]) => {
            profiles[key] = key
        })

        return profiles
    }

    change(key, val) {
        if (key == "activeProfile") {
            this.changeProfile(val)
        } else if (key == "profileName") {
            if (val.replace(" ", "") == "" || val == this.activeProfile) {
                return
            } else {
                for (let stuff of Object.entries(this.profiles)) {
                    let [key, value] = stuff
                    if (val == key) {
                        return
                    }
                }
                if (val.replace(" ", "") == "") {
                    val = " "
                }
                this.profiles[val] = this.profiles[this.activeProfile]
                delete this.profiles[this.activeProfile]
                this.activeProfile = val
            }
        } else {
            this.profiles[this.activeProfile][key] = val
            this[key] = val
        }
    }

    changeArr(key, index, val) {
        this.profiles[this.activeProfile][key][index] = val
        this[key][index] = val
    }

    save() {
        FileLib.write("soopyAddonsData", "bettermapsettings.json", JSON.stringify(
            {
                "apiKey": this.apiKey,
                "activeProfile": this.activeProfile,
                "profiles": this.profiles
            }))
    }

    changeProfile(name) {
        this.activeProfile = name
        Object.entries(this.profiles[this.activeProfile]).forEach(([key, value]) => {
            this[key] = value
        })

        this.addMissing()
    }

    createProfile(importedData) {
        let i = 0
        let newName = `Profile ${i}`
        outer: while (true) {
            i++
            newName = `Profile ${i}`
            for (let stuff of Object.entries(this.profiles)) {
                let [key, value] = stuff
                if (newName == key) {
                    continue outer
                }
            }
            break
        }

        this.profiles[newName] = { ...this.defaultSettings, ...importedData}
        this.save()
        return newName
    }

    deleteProfile() {
        if (Object.keys(this.profiles).length < 2) {
            return false
        }
        delete this.profiles[this.activeProfile]
        this.changeProfile(Object.keys(this.profiles)[0])
        return true
    }

    importProfile(data) {
        // TODO check for similar names
        let newProfileName = Object.keys(data)[0]
        this.profiles[newProfileName] = data[newProfileName]
        return newProfileName
    }

    addMissing() {
        Object.entries(this.defaultSettings).forEach(([key, value]) => {
            if (typeof this.profiles[this.activeProfile][key] === 'undefined') {
                this.profiles[this.activeProfile][key] = value
                this[key] = value
            }
        })

        return this
    }
}

export default SettingsObj