package com.nithish.img2pdf

import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.pdf.PdfRenderer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.ParcelFileDescriptor
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityDocumentConversionBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class DocumentConversionActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDocumentConversionBinding
    private var currentToolId: Int = -1

    private val conversionTools = listOf(
        ToolModel(301, R.string.tool_pdf_to_word, R.drawable.ic_pdf_to_word),
        ToolModel(303, R.string.tool_pdf_to_jpg, R.drawable.ic_pdf),
        ToolModel(304, R.string.tool_pdf_to_png, R.drawable.ic_pdf),
        ToolModel(306, R.string.tool_word_to_pdf, R.drawable.ic_word_to_pdf),
        ToolModel(307, R.string.tool_jpg_to_pdf, R.drawable.ic_image),
        ToolModel(308, R.string.tool_excel_to_pdf, R.drawable.ic_excel_to_pdf),
        ToolModel(309, R.string.tool_ppt_to_pdf, R.drawable.ic_ppt_to_pdf),
        ToolModel(310, R.string.tool_png_to_pdf, R.drawable.ic_image),
    )

    private val selectFile = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let {
            showRenameDialog(it)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityDocumentConversionBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }
        supportActionBar?.title = getString(R.string.document_conversion)

        val adapter = ToolsAdapter(conversionTools) { tool ->
            currentToolId = tool.id
            when (tool.id) {
                307, 310 -> {
                    // Launch JpgToPdfActivity for Image to PDF conversions
                    startActivity(Intent(this, JpgToPdfActivity::class.java))
                }
                else -> {
                    val mimeType = when (tool.id) {
                        301, 303, 304 -> "application/pdf"
                        else -> "*/*"
                    }
                    try {
                        selectFile.launch(mimeType)
                    } catch (e: Exception) {
                        Toast.makeText(this, "Could not open file picker", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }

        binding.conversionToolsGrid.adapter = adapter
        binding.conversionToolsGrid.layoutManager = GridLayoutManager(this, 2)
        
        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.conversionToolsGrid.setPadding(spacing, spacing, spacing, spacing)
        binding.conversionToolsGrid.clipToPadding = false
    }

    private fun showRenameDialog(uri: Uri) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("converted_doc_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Enter Output Filename")
            .setView(dialogView)
            .setPositiveButton("Convert") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    handleFileSelection(uri, filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun handleFileSelection(uri: Uri, outputFilename: String) {
        val inputFile = getFileFromUri(uri)
        if (inputFile == null) {
            Toast.makeText(this, "Could not get file path", Toast.LENGTH_SHORT).show()
            return
        }

        when (currentToolId) {
            301 -> performConversion(inputFile, outputFilename, "pdfToWord") // Placeholder
            303 -> pdfToImage(inputFile, Bitmap.CompressFormat.JPEG, "jpg", "image/jpeg", outputFilename)
            304 -> pdfToImage(inputFile, Bitmap.CompressFormat.PNG, "png", "image/png", outputFilename)
            306 -> performConversion(inputFile, outputFilename, "wordToPdf") // Placeholder
            308 -> performConversion(inputFile, outputFilename, "excelToPdf") // Placeholder
            309 -> performConversion(inputFile, outputFilename, "pptToPdf") // Placeholder
        }
    }

    private fun performConversion(inputFile: File, outputFilename: String, conversionType: String) {
        // Placeholder for future implementation of other conversions
        Toast.makeText(this, "Conversion $conversionType started for $outputFilename", Toast.LENGTH_SHORT).show()
    }

    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(getExternalFilesDir(null), "temp_file_${System.currentTimeMillis()}")
        try {
            contentResolver.openInputStream(uri)?.use { ins ->
                FileOutputStream(destinationFilename).use { out ->
                    ins.copyTo(out)
                }
            }
            return destinationFilename
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }

    private fun pdfToImage(inputFile: File, format: Bitmap.CompressFormat, extension: String, mimeType: String, outputBaseName: String) {
        binding.progressBar.visibility = View.VISIBLE
        Thread {
            try {
                val fileDescriptor = ParcelFileDescriptor.open(inputFile, ParcelFileDescriptor.MODE_READ_ONLY)
                val renderer = PdfRenderer(fileDescriptor)
                val pageCount = renderer.pageCount

                for (i in 0 until pageCount) {
                    val page = renderer.openPage(i)
                    val bitmap = Bitmap.createBitmap(page.width, page.height, Bitmap.Config.ARGB_8888)
                    page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
                    
                    val fileName = "${outputBaseName}_page_${i + 1}.$extension"
                    saveBitmap(bitmap, fileName, mimeType, format)
                    
                    page.close()
                }
                renderer.close()
                fileDescriptor.close()
                
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