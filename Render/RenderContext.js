/**
 * @typedef {Object} ContextSettings
 * @property {Boolean} showMap - Should the map be rendered
 * @property {"legalmap"|"hypixelmap"|"teniosmap"|"custom"} mapStyle - Style of the map rendering
 * @property {Number} posX - X Position of the map on screen
 * @property {Number} posY - y Position of the map on screen
 * @property {Number} size - Width/height of the map when rendered
 * @property {"off"|"icons"|"self-icon"|"heads"} showHeads - show player heads on the map
 * @property {Number} headScale - Width/height of heads (scales with size, will be same if size is 100)
 * @property {Number} iconScale - Width/height of icons (scales with size, will be same if size is 100)
 * @property {Number} textScale - Width/height of text
 * @property {"hypixel-old"|"hypixel-new"|"default"|"tenios"|"roomnames"} tickStyle - Style of the ticks
 * @property {"never"|"hasSecrets"|"always"} showSecretCount - When to show secrets instead of checkmarks
 * @property {Boolean} checkmarkCompleteRooms - Turn completed rooms into checkmarks
 * @property {Boolean} tickStyle_secrets_overHead - Wether to render the secrets / room name tick style over player heads
 * @property {Boolean} centerCheckmarks - Centers checkmarks in rooms
 * @property {"none"|"text"|"icon"} puzzleNames - Render style of puzzle names
 * @property {"none"|"single"|"class-color"} headBorder - Wether to put a black border around heads on the map
 * @property {Number} headBorderWidth - Width of the head border
 * @property {"never"|"leap"|"always"} playerNames - When to show player names on map
 * @property {"none"|"left"|"right"} currentRoomInfo - Render current room hover info on side of map
 * @property {"none"|"legalmap"|"simplified"} scoreInfoUnderMap - Render score info under the map
 * @property {Boolean} scoreInfoUnderMap_simplified_showMimicText - Wether to show 'mimic' before the tick/cross
 * @property {Boolean} tabSecretCount - Show the estimated secret count in tab
 * @property {Boolean} tabCryptCount - Show the current total crypt count for discovered rooms in tab 
 * @property {Boolean} tabMimic - Show the mimic status in tab
 * @property {Boolean} fixScore - Replaces the sidebar scoreboard score with the correct score
 * @property {"never"|"at270"|"at300"|"automatic"|"always"} showScoreMessage - Broadcast a score message after reaching a specific score
 * @property {String} custom270scoreMessage - Allows the player to set a custom message for 270 score
 * @property {String} custom300scoreMessage - Allows the player to set a custom message for 300 score
 * @property {"never"|"at270"|"at300"|"automatic"|"always"} showScoreTitle - Show a score title after reaching a specific score
 * @property {String} custom270scoreTitle - Allows the player to set a custom title for 270 score
 * @property {String} custom300scoreTitle - Allows the player to set a custom title for 300 score
 * @property {Boolean} customSound - Toggles the custom sound for 270 && 300 score
 * @property {"none"|"game.player.hurt.fall.big"|"game.neutral.hurt.fall.big"|"game.hostile.hurt.fall.big"|"game.player.hurt.fall.small"|"game.neutral.hurt.fall.small"|"game.hostile.hurt.fall.small"|"game.player.hurt"|"game.neutral.hurt"|"game.hostile.hurt"|"game.player.die"|"game.neutral.die"|"game.hostile.die"|"dig.cloth"|"dig.glass"|"game.potion.smash"|"dig.grass"|"dig.gravel"|"dig.sand"|"dig.snow"|"dig.stone"|"dig.wood"|"fire.fire"|"fire.ignite"|"item.fireCharge.use"|"fireworks.blast"|"fireworks.blast_far"|"fireworks.largeBlast"|"fireworks.largeBlast_far"|"fireworks.launch"|"fireworks.twinkle"|"fireworks.twinkle_far"|"game.player.swim.splash"|"game.neutral.swim.splash"|"game.hostile.swim.splash"|"game.player.swim"|"game.neutral.swim"|"game.hostile.swim"|"liquid.lava"|"liquid.lavapop"|"liquid.water"|"minecart.base"|"minecart.inside"|"note.bass"|"note.bassattack"|"note.bd"|"note.harp"|"note.hat"|"note.pling"|"note.snare"|"portal.portal"|"portal.travel"|"portal.trigger"|"random.anvil_break"|"random.anvil_land"|"random.anvil_use"|"random.bow"|"random.bowhit"|"random.break"|"random.burp"|"random.chestclosed"|"random.chestopen"|"gui.button.press"|"random.click"|"random.door_open"|"random.door_close"|"random.drink"|"random.eat"|"random.explode"|"random.fizz"|"game.tnt.primed"|"creeper.primed"|"random.levelup"|"random.orb"|"random.pop"|"random.splash"|"random.successful_hit"|"random.wood_click"|"step.cloth"|"step.grass"|"step.gravel"|"step.ladder"|"step.sand"|"step.snow"|"step.stone"|"step.wood"|"tile.piston.in"|"tile.piston.out"|"mob.bat.death"|"mob.bat.hurt"|"mob.bat.idle"|"mob.bat.loop"|"mob.bat.takeoff"|"mob.blaze.breathe"|"mob.blaze.death"|"mob.blaze.hit"|"mob.cat.hiss"|"mob.cat.hitt"|"mob.cat.meow"|"mob.cat.purr"|"mob.cat.purreow"|"mob.chicken.hurt"|"mob.chicken.plop"|"mob.chicken.say"|"mob.chicken.step"|"mob.cow.hurt"|"mob.cow.say"|"mob.cow.step"|"mob.creeper.death"|"mob.creeper.say"|"mob.enderdragon.end"|"mob.enderdragon.growl"|"mob.enderdragon.hit"|"mob.enderdragon.wings"|"mob.endermen.death"|"mob.endermen.hit"|"mob.endermen.idle"|"mob.endermen.portal"|"mob.endermen.scream"|"mob.endermen.stare"|"mob.ghast.affectionate_scream"|"mob.ghast.charge"|"mob.ghast.death"|"mob.ghast.fireball"|"mob.ghast.moan"|"mob.ghast.scream"|"mob.guardian.hit"|"mob.guardian.idle"|"mob.guardian.death"|"mob.guardian.elder.hit"|"mob.guardian.elder.idle"|"mob.guardian.elder.death"|"mob.guardian.land.hit"|"mob.guardian.land.idle"|"mob.guardian.land.death"|"mob.guardian.curse"|"mob.guardian.attack"|"mob.guardian.flop"|"mob.horse.angry"|"mob.horse.armor"|"mob.horse.breathe"|"mob.horse.death"|"mob.horse.donkey.angry"|"mob.horse.donkey.death"|"mob.horse.donkey.hit"|"mob.horse.donkey.idle"|"mob.horse.gallop"|"mob.horse.hit"|"mob.horse.idle"|"mob.horse.jump"|"mob.horse.land"|"mob.horse.leather"|"mob.horse.skeleton.death"|"mob.horse.skeleton.hit"|"mob.horse.skeleton.idle"|"mob.horse.soft"|"mob.horse.wood"|"mob.horse.zombie.death"|"mob.horse.zombie.hit"|"mob.horse.zombie.idle"|"mob.irongolem.death"|"mob.irongolem.hit"|"mob.irongolem.throw"|"mob.irongolem.walk"|"mob.magmacube.big"|"mob.magmacube.jump"|"mob.magmacube.small"|"mob.pig.death"|"mob.pig.say"|"mob.pig.step"|"mob.rabbit.hurt"|"mob.rabbit.idle"|"mob.rabbit.hop"|"mob.rabbit.death"|"mob.sheep.say"|"mob.sheep.shear"|"mob.sheep.step"|"mob.silverfish.hit"|"mob.silverfish.kill"|"mob.silverfish.say"|"mob.silverfish.step"|"mob.skeleton.death"|"mob.skeleton.hurt"|"mob.skeleton.say"|"mob.skeleton.step"|"mob.slime.attack"|"mob.slime.big"|"mob.slime.small"|"mob.spider.death"|"mob.spider.say"|"mob.spider.step"|"mob.villager.death"|"mob.villager.haggle"|"mob.villager.hit"|"mob.villager.idle"|"mob.villager.no"|"mob.villager.yes"|"mob.wither.death"|"mob.wither.hurt"|"mob.wither.idle"|"mob.wither.shoot"|"mob.wither.spawn"|"mob.wolf.bark"|"mob.wolf.death"|"mob.wolf.growl"|"mob.wolf.howl"|"mob.wolf.hurt"|"mob.wolf.panting"|"mob.wolf.shake"|"mob.wolf.step"|"mob.wolf.whine"|"mob.zombie.death"|"mob.zombie.hurt"|"mob.zombie.infect"|"mob.zombie.metal"|"mob.zombie.remedy"|"mob.zombie.say"|"mob.zombie.step"|"mob.zombie.unfect"|"mob.zombie.wood"|"mob.zombie.woodbreak"|"mob.zombiepig.zpig"|"mob.zombiepig.zpigangry"|"mob.zombiepig.zpigdeath"|"mob.zombiepig.zpighurt"} custom270scoreSound - Allows the player to set a custom sound for 270 score
 * @property {"none"|"game.player.hurt.fall.big"|"game.neutral.hurt.fall.big"|"game.hostile.hurt.fall.big"|"game.player.hurt.fall.small"|"game.neutral.hurt.fall.small"|"game.hostile.hurt.fall.small"|"game.player.hurt"|"game.neutral.hurt"|"game.hostile.hurt"|"game.player.die"|"game.neutral.die"|"game.hostile.die"|"dig.cloth"|"dig.glass"|"game.potion.smash"|"dig.grass"|"dig.gravel"|"dig.sand"|"dig.snow"|"dig.stone"|"dig.wood"|"fire.fire"|"fire.ignite"|"item.fireCharge.use"|"fireworks.blast"|"fireworks.blast_far"|"fireworks.largeBlast"|"fireworks.largeBlast_far"|"fireworks.launch"|"fireworks.twinkle"|"fireworks.twinkle_far"|"game.player.swim.splash"|"game.neutral.swim.splash"|"game.hostile.swim.splash"|"game.player.swim"|"game.neutral.swim"|"game.hostile.swim"|"liquid.lava"|"liquid.lavapop"|"liquid.water"|"minecart.base"|"minecart.inside"|"note.bass"|"note.bassattack"|"note.bd"|"note.harp"|"note.hat"|"note.pling"|"note.snare"|"portal.portal"|"portal.travel"|"portal.trigger"|"random.anvil_break"|"random.anvil_land"|"random.anvil_use"|"random.bow"|"random.bowhit"|"random.break"|"random.burp"|"random.chestclosed"|"random.chestopen"|"gui.button.press"|"random.click"|"random.door_open"|"random.door_close"|"random.drink"|"random.eat"|"random.explode"|"random.fizz"|"game.tnt.primed"|"creeper.primed"|"random.levelup"|"random.orb"|"random.pop"|"random.splash"|"random.successful_hit"|"random.wood_click"|"step.cloth"|"step.grass"|"step.gravel"|"step.ladder"|"step.sand"|"step.snow"|"step.stone"|"step.wood"|"tile.piston.in"|"tile.piston.out"|"mob.bat.death"|"mob.bat.hurt"|"mob.bat.idle"|"mob.bat.loop"|"mob.bat.takeoff"|"mob.blaze.breathe"|"mob.blaze.death"|"mob.blaze.hit"|"mob.cat.hiss"|"mob.cat.hitt"|"mob.cat.meow"|"mob.cat.purr"|"mob.cat.purreow"|"mob.chicken.hurt"|"mob.chicken.plop"|"mob.chicken.say"|"mob.chicken.step"|"mob.cow.hurt"|"mob.cow.say"|"mob.cow.step"|"mob.creeper.death"|"mob.creeper.say"|"mob.enderdragon.end"|"mob.enderdragon.growl"|"mob.enderdragon.hit"|"mob.enderdragon.wings"|"mob.endermen.death"|"mob.endermen.hit"|"mob.endermen.idle"|"mob.endermen.portal"|"mob.endermen.scream"|"mob.endermen.stare"|"mob.ghast.affectionate_scream"|"mob.ghast.charge"|"mob.ghast.death"|"mob.ghast.fireball"|"mob.ghast.moan"|"mob.ghast.scream"|"mob.guardian.hit"|"mob.guardian.idle"|"mob.guardian.death"|"mob.guardian.elder.hit"|"mob.guardian.elder.idle"|"mob.guardian.elder.death"|"mob.guardian.land.hit"|"mob.guardian.land.idle"|"mob.guardian.land.death"|"mob.guardian.curse"|"mob.guardian.attack"|"mob.guardian.flop"|"mob.horse.angry"|"mob.horse.armor"|"mob.horse.breathe"|"mob.horse.death"|"mob.horse.donkey.angry"|"mob.horse.donkey.death"|"mob.horse.donkey.hit"|"mob.horse.donkey.idle"|"mob.horse.gallop"|"mob.horse.hit"|"mob.horse.idle"|"mob.horse.jump"|"mob.horse.land"|"mob.horse.leather"|"mob.horse.skeleton.death"|"mob.horse.skeleton.hit"|"mob.horse.skeleton.idle"|"mob.horse.soft"|"mob.horse.wood"|"mob.horse.zombie.death"|"mob.horse.zombie.hit"|"mob.horse.zombie.idle"|"mob.irongolem.death"|"mob.irongolem.hit"|"mob.irongolem.throw"|"mob.irongolem.walk"|"mob.magmacube.big"|"mob.magmacube.jump"|"mob.magmacube.small"|"mob.pig.death"|"mob.pig.say"|"mob.pig.step"|"mob.rabbit.hurt"|"mob.rabbit.idle"|"mob.rabbit.hop"|"mob.rabbit.death"|"mob.sheep.say"|"mob.sheep.shear"|"mob.sheep.step"|"mob.silverfish.hit"|"mob.silverfish.kill"|"mob.silverfish.say"|"mob.silverfish.step"|"mob.skeleton.death"|"mob.skeleton.hurt"|"mob.skeleton.say"|"mob.skeleton.step"|"mob.slime.attack"|"mob.slime.big"|"mob.slime.small"|"mob.spider.death"|"mob.spider.say"|"mob.spider.step"|"mob.villager.death"|"mob.villager.haggle"|"mob.villager.hit"|"mob.villager.idle"|"mob.villager.no"|"mob.villager.yes"|"mob.wither.death"|"mob.wither.hurt"|"mob.wither.idle"|"mob.wither.shoot"|"mob.wither.spawn"|"mob.wolf.bark"|"mob.wolf.death"|"mob.wolf.growl"|"mob.wolf.howl"|"mob.wolf.hurt"|"mob.wolf.panting"|"mob.wolf.shake"|"mob.wolf.step"|"mob.wolf.whine"|"mob.zombie.death"|"mob.zombie.hurt"|"mob.zombie.infect"|"mob.zombie.metal"|"mob.zombie.remedy"|"mob.zombie.say"|"mob.zombie.step"|"mob.zombie.unfect"|"mob.zombie.wood"|"mob.zombie.woodbreak"|"mob.zombiepig.zpig"|"mob.zombiepig.zpigangry"|"mob.zombiepig.zpigdeath"|"mob.zombiepig.zpighurt"} custom300scoreSound - Allows the player to set a custom sound for 300 score
 * @property {Boolean} staticSecretsLeft - Disable the modification of min Secrets with bonus/ death score increase
 * @property {Boolean} hideInBoss - Hide the map in boss entirely 
 * @property {Boolean} showTabs - Show tabs at the top of the map 
 * @property {Boolean} showSecrets - Show waypoints for secrets in the dungeon
 * @property {Boolean} boxDoors - Put a box around wither doors
 * @property {Boolean} spiritLeapOverlay - Show an overlay on the spirit leap gui
 * @property {Boolean} movingClosesChests - Close Containers in Dungeon with moveing
 * @property {Boolean} forcePaul - Wether to force enable the +10 score for paul (eg if jerry mayor)
 * @property {Boolean} clearedRoomInfo - Show a summory of what rooms people cleared after run finishes
 * @property {Boolean} advancedClearedRooms - add ignore add and p kick in clearedRoomInfo
 * @property {Boolean} showSecretsBreakdown - add secret breakdown after run
 * @property {String} breakdownIgnoreList - List to ignore Players from advanced breakdown button adding
 * @property {"none"|"Just RARE REWARD"|"Just Dungeon Treasure"|"both"} rewardAnnounceHider - Which DH Rewards to hide
 * @property {String} apiKey - The user's api key, or "" if unknown
 * @property {Boolean} devInfo - Wether to show def info in various places in the map
 * @property {[r:Number, g:Number, b:Number, a:number]} mapBorderColor - The RGBO value of the map border color
 * @property {[r:Number, g:Number, b:Number, a:number]} mapBackgroundColor - The RGBO value of the map backround color
 * @property {[r:Number, g:Number, b:Number, a:number]} extraInfoBackroundColor - The RGBO value of the extrainfo backround color
 * @property {[r:Number, g:Number, b:Number, a:number]} healerColor - Border color for healer class
 * @property {[r:Number, g:Number, b:Number, a:number]} mageColor - Border color for mage class
 * @property {[r:Number, g:Number, b:Number, a:number]} bersColor - Border color for bers class
 * @property {[r:Number, g:Number, b:Number, a:number]} archColor - Border color for arch class
 * @property {[r:Number, g:Number, b:Number, a:number]} tankColor - Border color for tank class
 * @property {[r:Number, g:Number, b:Number, a:number]} singleBorderColor - Border color for everyone
 * @property {[r:Number, g:Number, b:Number, a:number]} singleBorderColorSelf - Border color for self
 */

const BufferedImage = Java.type("java.awt.image.BufferedImage")

class RenderContext {

    constructor(settings) {

        /**@type {ContextSettings} */
        this.settings = {}
        this.setSettings(settings)

        this.image = null;
        this.imageLastUpdate = 0;

        this.paddingTop = 0;
        this.paddingLeft = 0;

        this.borderWidth = 2;

        this.onDestroys = []
    }

    getImageSize(floor) {
        return this.paddingLeft * 2 + this.blockSize * 6 + this.roomGap / 2
    }

    get showMap() {
        return this.settings.showMap;
    }

    get posX() {
        return this.settings.posX
    }

    get posY() {
        return this.settings.posY
    }

    get size() {
        return this.settings.size
    }
    get showHeads() {
        return this.settings.showHeads;
    }
    get headScale() {
        return this.settings.headScale
    }
    get iconScale() {
        return this.settings.iconScale
    }
    get textScale() {
        return this.settings.textScale
    }
    get tickStyle() {
        return this.settings.tickStyle
    }
    
    get centerCheckmarks() {
        return this.settings.centerCheckmarks
    }
    
    get tickStyle_secrets_overHead() {
        return this.settings.tickStyle_secrets_overHead
    }
    get showSecretCount() {
        return this.settings.showSecretCount
    }
    get checkmarkCompleteRooms() {
        return this.settings.checkmarkCompleteRooms
    }

    get puzzleNames() {
        return this.settings.puzzleNames
    }
    get headBorder() {
        return this.settings.headBorder
    }
    get headBorderWidth() {
        return this.settings.headBorderWidth
    }
    get playerNames() {
        return this.settings.playerNames
    }

    get mapStyle() {
        return this.settings.mapStyle
    }

    get currentRoomInfo() {
        return this.settings.currentRoomInfo
    }

    get scoreInfoUnderMap() {
        return this.settings.scoreInfoUnderMap
    }

    get scoreInfoUnderMap_simplified_showMimicText() {
        return this.settings.scoreInfoUnderMap_simplified_showMimicText
    }

    get showScoreMessage() {
        return this.settings.showScoreMessage;
    }

    get custom270scoreMessage() {
        return this.settings.custom270scoreMessage;
    }
    
    get custom300scoreMessage() {
        return this.settings.custom300scoreMessage;
    }
    
    get showScoreTitle() {
        return this.settings.showScoreTitle;
    }

    get custom270scoreTitle() {
        return this.settings.custom270scoreTitle;
    }

    get custom300scoreTitle() {
        return this.settings.custom300scoreTitle;
    }

    get customSound() {
        return this.settings.customSound;
    }
    
    get custom270scoreSound() {
        return this.settings.custom270scoreSound;
    }
    
    get custom300scoreSound() {
        return this.settings.custom300scoreSound;
    }

    get staticSecretsLeft() {
        return this.settings.staticSecretsLeft;
    }

    get hideInBoss() {
        return this.settings.hideInBoss
    }

    get showTabs() {
        return this.settings.showTabs && this.posY > 0 //if y is 0 or less then tabs arnt visable anyway
    }

    get tabSecretCount() {
        return this.settings.tabSecretCount
    }

    get tabCryptCount() {
        return this.settings.tabCryptCount
    }

    get tabMimic() {
        return this.settings.tabMimic
    }

    get fixScore() {
        return this.settings.fixScore
    }

    get forcePaul() {
        return this.settings.forcePaul
    }

    get showSecrets() {
        return this.settings.showSecrets
    }

    get spiritLeapOverlay() {
        return this.settings.spiritLeapOverlay
    }
    get movingClosesChests() {
        return this.settings.movingClosesChests
    }

    get clearedRoomInfo() {
        return this.settings.clearedRoomInfo
    }

    get advancedClearedRooms() {
        return this.settings.advancedClearedRooms
    }

    get showSecretsBreakdown() {
        return this.settings.showSecretsBreakdown
    }

    get breakdownIgnoreList() {
        return this.settings.breakdownIgnoreList
    }

    get rewardAnnounceHider() {
        return this.settings.rewardAnnounceHider
    }

    get boxDoors() {
        return this.settings.boxDoors
    }

    get apiKey() {
        return this.settings.apiKey
    }

    get devInfo() {
        return this.settings.devInfo
    }

    get mapBorderColor() {
        return this.settings.mapBorderColor
    }

    get mapBackgroundColor() {
        return this.settings.mapBackgroundColor
    }

    get extraInfoBackroundColor() {
        return this.settings.extraInfoBackroundColor
    }

    get healerColor() {
        return this.settings.healerColor
    }

    get mageColor() {
        return this.settings.mageColor
    }

    get bersColor() {
        return this.settings.bersColor
    }

    get archColor() {
        return this.settings.archColor
    }

    get tankColor() {
        return this.settings.tankColor
    }

    get singleBorderColor() {
        return this.settings.singleBorderColor
    }

    get singleBorderColorSelf() {
        return this.settings.singleBorderColorSelf
    }

    get colorMap() {
        switch (this.mapStyle) {
            case "legalmap":
                return LegalMapColorMap
            case "teniosmap":
                return TeniosMapColorMap
            default:
            case "hypixelmap":
                return HypixelColorMap
        }
    }

    get customRoomColorNormal() {
        return this.settings.customRoomColorNormal;
    }
    get customRoomColorMini() {
        return this.settings.customRoomColorMini;
    }
    get customRoomColorRare() {
        return this.settings.customRoomColorRare;
    }
    get customRoomColorFairy() {
        return this.settings.customRoomColorFairy;
    }
    get customRoomColorBlood() {
        return this.settings.customRoomColorBlood;
    }
    get customRoomColorTrap() {
        return this.settings.customRoomColorTrap;
    }
    get customRoomColorSpawn() {
        return this.settings.customRoomColorSpawn;
    }
    get customRoomColorGold() {
        return this.settings.customRoomColorGold;
    }
    get customRoomColorPuzzle() {
        return this.settings.customRoomColorPuzzle;
    }
    get customRoomColorUnknown() {
        return this.settings.customRoomColorUnknown;
    }
    get customRoomColorWitherDoor() {
        return this.settings.customRoomColorWitherDoor;
    }
    get customRoomGapSize() {
        return this.settings.customRoomGapSize;
    }
    get customDoorSize() {
        return this.settings.customDoorSize;
    }

    get roomGap() {
        switch (this.mapStyle) {
            case 'custom':
                //capped cause players could theoretically create infinite dungeon map image sizes and run out of memory
                return Math.min(120, this.customRoomGapSize);
            case "legalmap":
                return 12 // 1/3 roomSize
            case "hypixelmap":
                return 9
            case "teniosmap":
            default:
                return 9
        }
    }

    get roomSize() {
        switch (this.mapStyle) {
            case "legalmap":
                return 36
            case "hypixelmap":
                return 36
            case "teniosmap":
            default:
                return 36
        }
    }

    get blockSize() {
        return this.roomSize + this.roomGap
    }

    get doorWidth() {
        switch (this.mapStyle) {
            case 'custom':
                return this.customDoorSize;
            case "legalmap":
                return 12
            case "hypixelmap":
                return 15
            case "teniosmap":
            default:
                return 15;
        }
    }

    /**
     * Gets the images to render ontop of the map, eg checkmarks
     * @param {String} type 
     * @returns {Image} The image to render
     */
    getImage(type) {
        switch (this.tickStyle) {
            case "default":
                if (this.iconScale < 8) return NEUMapTicks.get(type)

                let size = this.getIconSize(type)
                let scaledDownImage = new BufferedImage(Math.floor(size[0] / 2), Math.floor(size[1] / 2), BufferedImage.TYPE_INT_ARGB)
                let graphics = scaledDownImage.createGraphics()

                graphics.drawImage(NEUMapTicks.get(type), 0, 0, Math.floor(size[0] / 2), Math.floor(size[1] / 2), null)

                graphics.dispose()
                return scaledDownImage
            case 'hypixel-new':
                return HypixelTicksNew.get(type);
            case 'tenios':
            case "hypixel-old":
            default:
                return HypixelTicksOld.get(type)
        }
    }

    /**
     * Gets the width and height of different icons
     * @param {String} type 
     * @returns {[Number, Number]}
     */
    getIconSize(type) {
        switch (this.tickStyle) {
            case "default":
                return [16 * this.iconScale / 8, 16 * this.iconScale / 8]
            case "hypixel-new":
                switch (type) {
                    case "questionMark":
                        return [10 * this.iconScale / 10, 18 * this.iconScale / 10]
                    case "whiteCheck":
                    case "greenCheck":
                        return [18 * this.iconScale / 10, 18 * this.iconScale / 10]
                    case "failedRoom":
                        return [14 * this.iconScale / 8, 14 * this.iconScale / 8]
                }
            case 'tenios':
            case "hypixel-old":
            default:
                switch (type) {
                    case "questionMark":
                        return [10 * this.iconScale / 8, 16 * this.iconScale / 8]
                    case "whiteCheck":
                    case "greenCheck":
                        return [18 * this.iconScale / 10, 18 * this.iconScale / 10]
                    case "failedRoom":
                        return [14 * this.iconScale / 8, 14 * this.iconScale / 8]
                }
        }
    }

    setSettings(settings) {
        this.settings = RenderContext.addMissing(settings)
    }

    static addMissing({
        showMap = true,
        mapStyle = "legalmap",
        posX = 0,
        posY = 0,
        size = 100,
        showHeads = 'heads',
        headScale = 8,
        iconScale = 10,
        textScale = 10,
        tickStyle = "default",
        tickStyle_secrets_overHead = true,
        centerCheckmarks = false,
        showSecretCount = "never",
        checkmarkCompleteRooms = false,
        puzzleNames = "none",
        headBorder = "none",
        headBorderWidth = 3,
        playerNames = "leap",
        currentRoomInfo = "none",
        scoreInfoUnderMap = "simplified",
        scoreInfoUnderMap_simplified_showMimicText = true,
        showScoreMessage = 'never',
        custom270scoreMessage = '270 Score reached!',
        custom300scoreMessage = '300 Score reached!',
        showScoreTitle = 'never',
        custom270scoreTitle = '270 Score',
        custom300scoreTitle = '300 Score',
        customSound = false,
        custom270scoreSound = 'none',
        custom300scoreSound = 'none',
        staticSecretsLeft = false,
        tabSecretCount = false,
        tabCryptCount = false,
        tabMimic = false,
        fixScore = true,
        hideInBoss = false,
        showTabs = true,
        showSecrets = false,
        spiritLeapOverlay = false,
        movingClosesChests = false,
        forcePaul = false,
        clearedRoomInfo = true,
        advancedClearedRooms = false,
        showSecretsBreakdown = false,
        breakdownIgnoreList = "Name1 Name2 Name3 ...",
        rewardAnnounceHider = "none",
        apiKey = "",
        devInfo = false,
        boxDoors = true,
        mapBorderColor = [0, 0, 0, 255],
        mapBackgroundColor = [0, 0, 0, 100],
        extraInfoBackroundColor = [0, 0, 0, 100],
        healerColor = [240, 70, 240, 255],
        mageColor = [70, 210, 210, 255],
        bersColor = [255, 0, 0, 255],
        archColor = [30, 170, 50, 255],
        tankColor = [150, 150, 150, 255],
        singleBorderColor = [0, 0, 0, 255],
        singleBorderColorSelf = [0, 0, 0, 255],
        customRoomColorNormal = [114, 67, 27, 255],
        customRoomColorMini = [114, 67, 27, 255],
        customRoomColorRare = [114, 67, 27, 255],
        customRoomColorFairy = [239, 126, 163, 255],
        customRoomColorBlood = [255, 0, 0, 255],
        customRoomColorTrap = [213, 126, 50, 255],
        customRoomColorSpawn = [0, 123, 0, 255],
        customRoomColorGold = [226, 226, 50, 255],
        customRoomColorPuzzle = [176, 75, 213, 255],
        customRoomColorUnknown = [64, 64, 64, 255],
        customRoomColorWitherDoor = [0, 0, 0, 255],
        customRoomGapSize = 9,
        customDoorSize = 15
    }) {
        return {
            showMap,
            mapStyle,
            posX,
            posY,
            size,
            showHeads,
            headScale,
            iconScale,
            textScale,
            tickStyle,
            tickStyle_secrets_overHead,
            centerCheckmarks,
            showSecretCount,
            checkmarkCompleteRooms,
            puzzleNames,
            headBorder,
            headBorderWidth,
            playerNames,
            currentRoomInfo,
            scoreInfoUnderMap,
            scoreInfoUnderMap_simplified_showMimicText,
            showScoreMessage,
            custom270scoreMessage,
            custom300scoreMessage,
            showScoreTitle,
            custom270scoreTitle,
            custom300scoreTitle,
            customSound,
            custom270scoreSound,
            custom300scoreSound,
            staticSecretsLeft,
            tabCryptCount,
            tabSecretCount,
            tabMimic,
            fixScore,
            hideInBoss,
            showTabs,
            showSecrets,
            spiritLeapOverlay,
            movingClosesChests,
            forcePaul,
            clearedRoomInfo,
            advancedClearedRooms,
            showSecretsBreakdown,
            breakdownIgnoreList,
            rewardAnnounceHider,
            apiKey,
            devInfo,
            boxDoors,
            mapBorderColor,
            mapBackgroundColor,
            extraInfoBackroundColor,
            healerColor,
            mageColor,
            bersColor,
            archColor,
            tankColor,
            singleBorderColor,
            singleBorderColorSelf,
            customRoomColorNormal,
            customRoomColorMini,
            customRoomColorRare,
            customRoomColorFairy,
            customRoomColorBlood,
            customRoomColorTrap,
            customRoomColorSpawn,
            customRoomColorGold,
            customRoomColorPuzzle,
            customRoomColorUnknown,
            customRoomColorWitherDoor,
            customRoomGapSize,
            customDoorSize
        }
    }

    /**
     * Mark this image as needing a re-render
     * Will be re-rendered on the next game frame
     */
    markReRender() {
        this.imageLastUpdate = 0
    }

    onDestroy(callback) {
        this.onDestroys.push(callback)
    }

    /**
     * Prepairs this render context for garbage collection, eg clearing cached map image from memory
     */
    destroy() {
        this.image?.getTexture()?.[m.deleteGlTexture]()
        this.image = undefined

        this.onDestroys.forEach(fun => fun())
    }

    /**
     * A shortcut for getting the context's settings commonly used for rendering
     * @returns {{x:Number, y:Number, size:Number, headScale:Number}}
     */
    getMapDimensions() {
        return {
            x: this.posX,
            y: this.posY,
            size: this.size,
            headScale: this.headScale
        }
    }
}

export default RenderContext

let roomHash = {
    SPAWN: 0,
    NORMAL: 1,
    PUZZLE: 2,
    MINIBOSS: 3,
    FAIRY: 4,
    BLOOD: 5,
    UNKNOWN: 6,
    TRAP: 7,
    BLACK: 8, // For rendering wither doors
    NORMAL_CONNECTION: 9 // For rendering connections between normal rooms
}

const Color = Java.type("java.awt.Color")

const HypixelColorMap = new Map()
HypixelColorMap.set(roomHash.SPAWN, new Color(Renderer.color(0, 124, 0, 255)))
HypixelColorMap.set(roomHash.NORMAL, new Color(Renderer.color(114, 67, 27, 255)))
HypixelColorMap.set(roomHash.NORMAL_CONNECTION, new Color(Renderer.color(114, 67, 27, 255)))
HypixelColorMap.set(roomHash.PUZZLE, new Color(Renderer.color(178, 76, 216, 255)))
HypixelColorMap.set(roomHash.MINIBOSS, new Color(Renderer.color(229, 229, 51, 255)))
HypixelColorMap.set(roomHash.FAIRY, new Color(Renderer.color(242, 127, 165, 255)))
HypixelColorMap.set(roomHash.BLOOD, new Color(Renderer.color(255, 0, 0, 255)))
HypixelColorMap.set(roomHash.TRAP, new Color(Renderer.color(216, 127, 51, 255)))
HypixelColorMap.set(roomHash.UNKNOWN, new Color(Renderer.color(65, 65, 65, 255)))
HypixelColorMap.set(roomHash.BLACK, new Color(Renderer.color(0, 0, 0, 255)))


const LegalMapColorMap = new Map()
LegalMapColorMap.set(roomHash.SPAWN, new Color(Renderer.color(20, 133, 0, 255)))
LegalMapColorMap.set(roomHash.NORMAL, new Color(Renderer.color(107, 58, 17, 255)))
LegalMapColorMap.set(roomHash.NORMAL_CONNECTION, new Color(Renderer.color(92, 52, 14, 255)))
LegalMapColorMap.set(roomHash.PUZZLE, new Color(Renderer.color(117, 0, 133, 255)))
LegalMapColorMap.set(roomHash.MINIBOSS, new Color(Renderer.color(254, 223, 0, 255)))
LegalMapColorMap.set(roomHash.FAIRY, new Color(Renderer.color(224, 0, 255, 255)))
LegalMapColorMap.set(roomHash.BLOOD, new Color(Renderer.color(255, 0, 0, 255)))
LegalMapColorMap.set(roomHash.TRAP, new Color(Renderer.color(216, 127, 51, 255)))
LegalMapColorMap.set(roomHash.UNKNOWN, new Color(Renderer.color(65, 65, 65, 255)))
LegalMapColorMap.set(roomHash.BLACK, new Color(Renderer.color(0, 0, 0, 255)))


const TeniosMapColorMap = new Map()
TeniosMapColorMap.set('mobs', new Color(Renderer.color(114, 67, 27)));
TeniosMapColorMap.set('miniboss', new Color(Renderer.color(85, 51, 19)));
TeniosMapColorMap.set('rare', new Color(Renderer.color(175, 122, 87)));
TeniosMapColorMap.set('fairy', new Color(Renderer.color(239, 126, 163)));
TeniosMapColorMap.set('blood', new Color(Renderer.color(255, 0, 0)));
TeniosMapColorMap.set('spawn', new Color(Renderer.color(0, 123, 0)));
TeniosMapColorMap.set('trap', new Color(Renderer.color(213, 126, 50)));
TeniosMapColorMap.set('puzzle', new Color(Renderer.color(176, 75, 213)));
TeniosMapColorMap.set('gold', new Color(Renderer.color(226, 226, 50)));
TeniosMapColorMap.set('unknown', new Color(Renderer.color(64, 64, 64)));
TeniosMapColorMap.set('wither', new Color(Renderer.color(0, 0, 0)));

const HypixelTicksOld = new Map()
HypixelTicksOld.set("greenCheck", new Image("greenCheckVanilla-old.png", "https://i.imgur.com/h2WM1LO.png").image)
HypixelTicksOld.set("whiteCheck", new Image("whiteCheckVanilla-old.png", "https://i.imgur.com/hwEAcnI.png").image)
HypixelTicksOld.set("failedRoom", new Image("failedRoomVanilla.png", "https://i.imgur.com/WqW69z3.png").image)
HypixelTicksOld.set("questionMark", new Image("questionMarkVanilla-old.png", "https://i.imgur.com/1jyxH9I.png").image)

const HypixelTicksNew = new Map()
HypixelTicksNew.set("greenCheck", new Image("greenCheckVanilla-new.png", "https://i.imgur.com/KFGT3RL.png").image)
HypixelTicksNew.set("whiteCheck", new Image("whiteCheckVanilla-new.png", "https://i.imgur.com/pfDVZA0.png").image)
HypixelTicksNew.set("failedRoom", new Image("failedRoomVanilla.png", "https://i.imgur.com/WqW69z3.png").image)
HypixelTicksNew.set("questionMark", new Image("questionMarkVanilla-new.png", "https://i.imgur.com/xLI4gR6.png").image)

const NEUMapTicks = new Map()
NEUMapTicks.set("greenCheck", new Image("NEUMapGreenCheck.png", "https://i.imgur.com/vwiTAAf.png").image) //old: https://i.imgur.com/GQfTfmp.png
NEUMapTicks.set("whiteCheck", new Image("NEUMapWhiteCheck.png", "https://i.imgur.com/YOUsTg8.png").image) //old: https://i.imgur.com/9cZ28bJ.png
NEUMapTicks.set("failedRoom", new Image("NEUMapFailedRoom.png", "https://i.imgur.com/TM8LbGS.png").image) //old: https://i.imgur.com/YOUsTg8.png
NEUMapTicks.set("questionMark", new Image("NEUMapQuestionMark.png", "https://i.imgur.com/CPBuhXu.png").image) //old: https://i.imgur.com/kp92Inw.png
