package com.nithish.img2pdf

import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityImageConverterBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class ImageConverterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityImageConverterBinding
    private var currentToolId: Int = -1

    private val imageTools = listOf(
        ToolModel(204, R.string.tool_convert_to_png, R.drawable.ic_image),
        ToolModel(205, R.string.tool_convert_to_jpg, R.drawable.ic_image)
    )

    private val selectImage = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { 
            showRenameDialog(it)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityImageConverterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }
        supportActionBar?.title = getString(R.string.image_tools)

        val adapter = ToolsAdapter(imageTools) { tool ->
            currentToolId = tool.id
            selectImage.launch("image/*")
        }

        binding.imageToolsGrid.adapter = adapter
        binding.imageToolsGrid.layoutManager = GridLayoutManager(this, 2)
        
        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.imageToolsGrid.setPadding(spacing, spacing, spacing, spacing)
        binding.imageToolsGrid.clipToPadding = false
    }

    private fun showRenameDialog(uri: Uri) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("converted_image_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Enter Output Filename")
            .setView(dialogView)
            .setPositiveButton("Convert") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    performConversion(uri, filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun performConversion(uri: Uri, filename: String) {
        val format = if (currentToolId == 204) Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG
        val extension = if (currentToolId == 204) "png" else "jpg"
        val mimeType = if (currentToolId == 204) "image/png" else "image/jpeg"
        val finalFileName = if (filename.endsWith(".$extension", true)) filename else "$filename.$extension"

        binding.progressBar.visibility = View.VISIBLE
        Thread {
            try {
                contentResolver.openInputStream(uri)?.use { inputStream ->
                    val bitmap = BitmapFactory.decodeStream(inputStream)
                    saveBitmap(bitmap, finalFileName, mimeType, format)
                }
                runOnUiThread {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this, "Converted to ${extension.uppercase()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                runOnUiThread {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }.start()
    }

    private fun saveBitmap(bitmap: Bitmap, fileName: String, mimeType: String, format: Bitmap.CompressFormat) {
        try {
            var fos: OutputStream? = null
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Img2PDF")
                }
                val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                fos = uri?.let { contentResolver.openOutputStream(it) }
            } else {
                val destDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Img2PDF")
                if (!destDir.exists()) {
                    destDir.mkdirs()
                }
                val destFile = File(destDir, fileName)
                fos = FileOutputStream(destFile)
            }

            fos?.use {
                bitmap.compress(format, 100, it)
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}