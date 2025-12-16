package com.nithish.img2pdf

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.nithish.img2pdf.databinding.ActivityToolListBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter

class ToolListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityToolListBinding

    private val pdfTools = listOf(
        ToolModel(1, R.string.tool_split_pdf, R.drawable.ic_split),
        ToolModel(2, R.string.tool_merge_pdf, R.drawable.ic_merge),
        ToolModel(3, R.string.tool_compress_pdf, R.drawable.ic_compress),
        ToolModel(4, R.string.tool_unlock_pdf, R.drawable.ic_unlock),
        ToolModel(5, R.string.tool_protect, R.drawable.ic_lock),
        ToolModel(6, R.string.tool_rotate, R.drawable.ic_rotate),
        ToolModel(7, R.string.tool_page_numbers, R.drawable.baseline_123_24),
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityToolListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val categoryId = intent.getStringExtra("category_id")
        if (categoryId == null) {
            finish() // Or show an error
            return
        }

        val (tools, title) = when (categoryId) {
            "pdf" -> pdfTools to "PDF Tools"
            else -> emptyList<ToolModel>() to "Tools"
        }

        supportActionBar?.title = title
        setupToolsGrid(tools, categoryId)
    }

    private fun setupToolsGrid(tools: List<ToolModel>, categoryId: String) {
        val toolsAdapter = ToolsAdapter(tools) { tool ->
            val intent = when(categoryId) {
                "pdf" -> Intent(this, PdfToolsActivity::class.java)
                else -> null
            }
            
            if(intent != null){
                startActivity(intent)
            } else {
                Toast.makeText(this, "Category not supported", Toast.LENGTH_SHORT).show()
            }
        }
        binding.toolsGrid.adapter = toolsAdapter
        binding.toolsGrid.layoutManager = GridLayoutManager(this, 2)
        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.toolsGrid.setPadding(spacing, spacing, spacing, spacing)
        binding.toolsGrid.clipToPadding = false
    }
}