package com.nithish.img2pdf

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.GridLayoutManager
import com.nithish.img2pdf.databinding.ActivityToolListBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter

class ImageToolListActivity : AppCompatActivity() {

    private lateinit var binding: ActivityToolListBinding
    private var currentToolId: Int = -1
    private val STORAGE_PERMISSION_CODE = 101

    private val imageTools = listOf(
        ToolModel(202, R.string.tool_resize_image, R.drawable.ic_resize),
        ToolModel(203, R.string.tool_compress_image, R.drawable.ic_compress),
        ToolModel(204, R.string.tool_rotate_image, R.drawable.ic_rotate)
    )

    private val selectImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { 
             handleImageSelection(it)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityToolListBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = getString(R.string.image_tools)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val adapter = ToolsAdapter(imageTools) { tool ->
            currentToolId = tool.id
            checkPermissionAndSelectImage()
        }

        binding.toolsGrid.adapter = adapter
        binding.toolsGrid.layoutManager = GridLayoutManager(this, 2)
        
        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.toolsGrid.setPadding(spacing, spacing, spacing, spacing)
        binding.toolsGrid.clipToPadding = false
    }

    private fun checkPermissionAndSelectImage() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED) {
                selectImage.launch("image/*")
            } else {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_MEDIA_IMAGES), STORAGE_PERMISSION_CODE)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED) {
                selectImage.launch("image/*")
            } else {
                ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), STORAGE_PERMISSION_CODE)
            }
        }
    }

    private fun handleImageSelection(uri: Uri) {
        val intent = when (currentToolId) {
            202 -> Intent(this, ResizeImageActivity::class.java)
            203 -> Intent(this, CompressImageActivity::class.java)
            204 -> Intent(this, RotateImageActivity::class.java)
            else -> null
        }
        
        if (intent != null) {
            intent.putExtra("image_uri", uri.toString())
            startActivity(intent)
        } else {
            Toast.makeText(this, "Tool not implemented yet", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == STORAGE_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                selectImage.launch("image/*")
            } else {
                Toast.makeText(this, "Permission denied", Toast.LENGTH_SHORT).show()
            }
        }
    }
}