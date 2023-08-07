package bettermap.utils

import bettermap.BetterMap.Companion.mc
import bettermap.components.MapPlayer
import bettermap.dungeon.Dungeon
import bettermap.dungeon.MapUtils
import bettermap.utils.Renderer.renderRectBorder
import net.minecraft.client.gui.Gui
import net.minecraft.client.renderer.GlStateManager
import net.minecraft.client.renderer.Tessellator
import net.minecraft.client.renderer.WorldRenderer
import net.minecraft.client.renderer.vertex.DefaultVertexFormats
import net.minecraft.entity.Entity
import net.minecraft.util.AxisAlignedBB
import org.lwjgl.opengl.GL11
import java.awt.Color

object RenderUtils {
    val tessellator: Tessellator = Tessellator.getInstance()
    val worldRenderer: WorldRenderer = tessellator.worldRenderer

    fun preDraw() {
        GlStateManager.enableAlpha()
        GlStateManager.enableBlend()
        GlStateManager.disableDepth()
        GlStateManager.disableLighting()
        GlStateManager.disableTexture2D()
        GlStateManager.tryBlendFuncSeparate(770, 771, 1, 0)
    }

    fun postDraw() {
        GlStateManager.disableBlend()
        GlStateManager.enableDepth()
        GlStateManager.enableTexture2D()
    }

    fun addQuadVertices(x: Double, y: Double, w: Double, h: Double) {
        worldRenderer.pos(x, y + h, 0.0).endVertex()
        worldRenderer.pos(x + w, y + h, 0.0).endVertex()
        worldRenderer.pos(x + w, y, 0.0).endVertex()
        worldRenderer.pos(x, y, 0.0).endVertex()
    }

    fun drawTexturedQuad(x: Double, y: Double, width: Double, height: Double) {
        worldRenderer.begin(GL11.GL_QUADS, DefaultVertexFormats.POSITION_TEX)
        worldRenderer.pos(x, y + height, 0.0).tex(0.0, 1.0).endVertex()
        worldRenderer.pos(x + width, y + height, 0.0).tex(1.0, 1.0).endVertex()
        worldRenderer.pos(x + width, y, 0.0).tex(1.0, 0.0).endVertex()
        worldRenderer.pos(x, y, 0.0).tex(0.0, 0.0).endVertex()
        tessellator.draw()
    }


    fun renderCenteredText(text: List<String>, x: Int, y: Int, color: Int, scale: Float) {
        if (text.isEmpty()) return
        GlStateManager.pushMatrix()
        GlStateManager.translate(x.toFloat(), y.toFloat(), 0f)
        GlStateManager.scale(scale, scale, 1f)

        val fontHeight = mc.fontRendererObj.FONT_HEIGHT + 1
        val yTextOffset = text.size * fontHeight / -2f

        text.withIndex().forEach { (index, text) ->
            mc.fontRendererObj.drawString(
                text,
                mc.fontRendererObj.getStringWidth(text) / -2f,
                yTextOffset + index * 10,
                color,
                true
            )
        }

        GlStateManager.popMatrix()
    }

    /**
     * Draws the player's head on the screen.
     *
     * @param name The name of the player.
     * @param player The player object containing information about the player's location and other details.
     */
    fun drawPlayerHead(name: String, player: MapPlayer) {
        GlStateManager.pushMatrix()
        try {
            // Translates to the player's location which is updated every tick.
            if (name == mc.thePlayer.name && player.mapX == 0 && player.mapY == 0) {
                GlStateManager.translate(
                    (mc.thePlayer.posX - Dungeon.startX + 15) * MapUtils.coordMultiplier + MapUtils.startCorner.first,
                    (mc.thePlayer.posZ - Dungeon.startY + 15) * MapUtils.coordMultiplier + MapUtils.startCorner.second,
                    0.0
                )
            } else {
                GlStateManager.translate(player.mapX.toFloat(), player.mapY.toFloat(), 0f)
            }

            // Handle player names

            /*
            Commented out since no config exists yet.
            2 -> always show
            1 -> show holding leap

            if (config.playerHeads == 2 || config.playerHeads == 1 && mc.thePlayer.heldItem?.itemID.equalsOneOf(
                    "SPIRIT_LEAP", "INFINITE_SPIRIT_LEAP", "HAUNT_ABILITY"
                )
            ) {
                GlStateManager.pushMatrix()
                GlStateManager.scale(0.8, 0.8, 1.0)
                if (config.rotate) {
                    GlStateManager.rotate(mc.thePlayer.rotationYawHead + 180f, 0f, 0f, 1f)
                }
                mc.fontRendererObj.drawString(
                    name, mc.fontRendererObj.getStringWidth(name) / -2f, 10f, 0xffffff, true
                )
                GlStateManager.popMatrix()
            }
            */

            // Apply head rotation and scaling
            GlStateManager.rotate(player.yaw + 180f, 0f, 0f, 1f)

            // Again no config
//            GlStateManager.scale(config.playerHeadScale, config.playerHeadScale, 1f)

            // Render black border around the player head
            renderRectBorder(-6.0, -6.0, 12.0, 12.0, 1.0, Color(0, 0, 0, 255))

            preDraw()
            GlStateManager.enableTexture2D()
            GlStateManager.color(1f, 1f, 1f, 1f)

            mc.textureManager.bindTexture(player.networkPlayerInfo.locationSkin)

            Gui.drawScaledCustomSizeModalRect(-6, -6, 8f, 8f, 8, 8, 12, 12, 64f, 64f)
            if (player.renderHat) {
                Gui.drawScaledCustomSizeModalRect(-6, -6, 40f, 8f, 8, 8, 12, 12, 64f, 64f)
            }

            postDraw()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        GlStateManager.popMatrix()
    }

    fun Color.bind() {
        GlStateManager.color(this.red / 255f, this.green / 255f, this.blue / 255f, this.alpha / 255f)
    }

    fun Entity.getInterpolatedPosition(partialTicks: Float): Triple<Double, Double, Double> {
        return Triple(
            this.lastTickPosX + (this.posX - this.lastTickPosX) * partialTicks,
            this.lastTickPosY + (this.posY - this.lastTickPosY) * partialTicks,
            this.lastTickPosZ + (this.posZ - this.lastTickPosZ) * partialTicks
        )
    }

    fun drawFilledAABB(aabb: AxisAlignedBB, color: Color) {
        color.bind()

        worldRenderer.begin(GL11.GL_QUADS, DefaultVertexFormats.POSITION)

        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()

        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()

        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()

        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()

        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()

        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()
        tessellator.draw()
    }

    fun drawOutlinedAABB(aabb: AxisAlignedBB, color: Color) {
        color.bind()

        worldRenderer.begin(GL11.GL_LINE_STRIP, DefaultVertexFormats.POSITION)

        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.minZ).endVertex()

        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.minZ).endVertex()

        worldRenderer.pos(aabb.minX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.minX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.maxZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.maxY, aabb.minZ).endVertex()
        worldRenderer.pos(aabb.maxX, aabb.minY, aabb.minZ).endVertex()

        tessellator.draw()
    }
}
