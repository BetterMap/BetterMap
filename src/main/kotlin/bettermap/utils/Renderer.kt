package bettermap.utils

import bettermap.utils.RenderUtils.bind
import gg.essential.elementa.utils.withAlpha
import net.minecraft.client.renderer.GlStateManager
import net.minecraft.client.renderer.vertex.DefaultVertexFormats
import net.minecraft.util.AxisAlignedBB
import org.lwjgl.opengl.GL11
import java.awt.Color

object Renderer {
    fun drawBox(aabb: AxisAlignedBB, color: Color, outline: Float, fill: Float, ignoreDepth: Boolean) {
        GlStateManager.pushMatrix()
        RenderUtils.preDraw()
        GlStateManager.depthMask(!ignoreDepth)
        GL11.glLineWidth(outline)

        RenderUtils.drawOutlinedAABB(aabb, color.withAlpha(outline))

        RenderUtils.drawFilledAABB(aabb, color.withAlpha(fill))

        GlStateManager.depthMask(true)
        RenderUtils.postDraw()
        GlStateManager.popMatrix()
    }

    fun renderRect(x: Double, y: Double, w: Double, h: Double, color: Color) {
        if (color.alpha == 0) return
        RenderUtils.preDraw()
        color.bind()

        RenderUtils.worldRenderer.begin(GL11.GL_QUADS, DefaultVertexFormats.POSITION)
        RenderUtils.addQuadVertices(x, y, w, h)
        RenderUtils.tessellator.draw()

        RenderUtils.postDraw()
    }

    fun renderRectBorder(x: Double, y: Double, w: Double, h: Double, thickness: Double, color: Color) {
        if (color.alpha == 0) return
        RenderUtils.preDraw()
        color.bind()

        RenderUtils.worldRenderer.begin(GL11.GL_QUADS, DefaultVertexFormats.POSITION)
        RenderUtils.addQuadVertices(x - thickness, y, thickness, h)
        RenderUtils.addQuadVertices(x - thickness, y - thickness, w + thickness * 2, thickness)
        RenderUtils.addQuadVertices(x + w, y, thickness, h)
        RenderUtils.addQuadVertices(x - thickness, y + h, w + thickness * 2, thickness)
        RenderUtils.tessellator.draw()

        RenderUtils.postDraw()
    }
}
