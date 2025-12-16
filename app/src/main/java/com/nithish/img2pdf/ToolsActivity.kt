package com.nithish.img2pdf

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.nithish.img2pdf.databinding.ActivityToolsBinding
import com.nithish.img2pdf.models.CategoryModel
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.CategoryAdapter

class ToolsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityToolsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityToolsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)

        val categories = listOf(
            CategoryModel(
                id = "pdf",
                titleResId = R.string.pdf_tools,
                iconResId = R.drawable.ic_pdf, 
                toolCount = 4,
                descriptionResId = R.string.pdf_tools_description,
                popularTools = listOf(
                    ToolModel(402, R.string.tool_merge_pdf, R.drawable.ic_merge),
                    ToolModel(401, R.string.tool_split_pdf, R.drawable.ic_split),
                    ToolModel(403, R.string.tool_compress_pdf, R.drawable.ic_compress)
                )
            ),
            CategoryModel(
                id = "image",
                titleResId = R.string.image_tools,
                iconResId = R.drawable.ic_menu_image,
                toolCount = 3,
                descriptionResId = R.string.image_tools_description,
                popularTools = listOf(
                    ToolModel(202, R.string.tool_resize_image, R.drawable.ic_resize),
                    ToolModel(203, R.string.tool_compress_image, R.drawable.ic_compress),
                    ToolModel(204, R.string.tool_rotate_image, R.drawable.ic_rotate)
                )
            ),
            CategoryModel(
                id = "audio",
                titleResId = R.string.audio_tools,
                iconResId = R.drawable.ic_audio,
                toolCount = 6,
                descriptionResId = R.string.audio_tools_description,
                popularTools = listOf(
                    ToolModel(101, R.string.tool_trim_audio, R.drawable.ic_tool_trim),
                    ToolModel(103, R.string.tool_change_speed, R.drawable.ic_speed),
                    ToolModel(108, R.string.tool_audio_joiner, R.drawable.ic_merge)
                )
            ),
            CategoryModel(
                id = "video",
                titleResId = R.string.video_tools,
                iconResId = R.drawable.ic_video,
                toolCount = 5,
                descriptionResId = R.string.video_tools_description,
                popularTools = listOf(
                    ToolModel(501, R.string.tool_trim_video, R.drawable.ic_tool_trim),
                    ToolModel(502, R.string.tool_merge_video, R.drawable.ic_merge),
                    ToolModel(503, R.string.tool_crop_video, R.drawable.ic_crop)
                )
            ),
             CategoryModel(
                id = "document",
                titleResId = R.string.document_conversion,
                iconResId = R.drawable.ic_document,
                toolCount = 8,
                descriptionResId = R.string.document_conversion_description,
                popularTools = listOf(
                    ToolModel(301, R.string.tool_pdf_to_word, R.drawable.ic_pdf_to_word),
                    ToolModel(307, R.string.tool_jpg_to_pdf, R.drawable.ic_image), 
                    ToolModel(302, R.string.tool_word_to_pdf, R.drawable.ic_word_to_pdf)
                )
            )
        )

        val adapter = CategoryAdapter(categories, 
            onCategoryClick = { category ->
                try {
                    val intent = when(category.id) {
                        "pdf" -> Intent(this, PdfToolsActivity::class.java)
                        "image" -> Intent(this, ImageToolListActivity::class.java)
                        "audio" -> Intent(this, AudioToolsActivity::class.java)
                        "video" -> Intent(this, VideoToolsActivity::class.java)
                        "document" -> Intent(this, DocumentConversionActivity::class.java)
                        else -> Intent(this, ToolListActivity::class.java)
                    }
                    intent.putExtra("category_id", category.id)
                    startActivity(intent)
                } catch (e: Exception) {
                    Toast.makeText(this, "Error opening ${getString(category.titleResId)}", Toast.LENGTH_SHORT).show()
                    e.printStackTrace()
                }
            },
            onToolChipClick = { toolName ->
                Toast.makeText(this, "$toolName clicked", Toast.LENGTH_SHORT).show()
            }
        )

        binding.categoryGrid.layoutManager = LinearLayoutManager(this)
        binding.categoryGrid.adapter = adapter
    }
}