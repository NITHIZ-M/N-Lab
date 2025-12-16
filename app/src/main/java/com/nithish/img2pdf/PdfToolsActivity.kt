package com.nithish.img2pdf

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
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
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.textfield.TextInputEditText
import com.itextpdf.kernel.pdf.EncryptionConstants
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfReader
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.kernel.pdf.WriterProperties
import com.itextpdf.kernel.utils.PdfMerger
import com.nithish.img2pdf.databinding.ActivityPdfToolsBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class PdfToolsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPdfToolsBinding
    private var currentToolId: Int = -1

    private val pdfTools = listOf(
        ToolModel(401, R.string.tool_split_pdf, R.drawable.ic_split),
        ToolModel(402, R.string.tool_merge_pdf, R.drawable.ic_merge),
        ToolModel(403, R.string.tool_compress_pdf, R.drawable.ic_compress),
        ToolModel(404, R.string.tool_unlock_pdf, R.drawable.ic_lock)
    )

    private val singlePdfPicker = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            result.data?.data?.also { uri ->
                when (currentToolId) {
                    401 -> performSplit(uri) // Dialog inside
                    403 -> showRenameDialog(uri) // Ask name before compress
                    404 -> performLock(uri) // Dialog inside (password + name)
                }
            }
        }
    }

    private val multiplePdfPicker = registerForActivityResult(ActivityResultContracts.OpenMultipleDocuments()) { uris ->
        if (uris.isNotEmpty()) {
            showRenameDialogForMerge(uris) // Ask name before merge
        } else {
            Toast.makeText(this, "No files selected", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPdfToolsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val adapter = ToolsAdapter(pdfTools) { tool ->
            currentToolId = tool.id
            when (tool.id) {
                401, 403, 404 -> selectSinglePdf()
                402 -> selectMultiplePdfs()
            }
        }

        binding.pdfToolsRecyclerView.adapter = adapter
        binding.pdfToolsRecyclerView.layoutManager = GridLayoutManager(this, 2)
        
        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.pdfToolsRecyclerView.setPadding(spacing, spacing, spacing, spacing)
        binding.pdfToolsRecyclerView.clipToPadding = false
    }

    private fun selectSinglePdf() {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
            addCategory(Intent.CATEGORY_OPENABLE)
            type = "application/pdf"
        }
        singlePdfPicker.launch(intent)
    }

    private fun selectMultiplePdfs() {
        multiplePdfPicker.launch(arrayOf("application/pdf"))
    }

    private fun getPdfOutputStream(fileName: String): OutputStream? {
        val finalFileName = if (fileName.endsWith(".pdf", true)) fileName else "$fileName.pdf"
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, finalFileName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/Img2PDF")
            }
            val uri = contentResolver.insert(MediaStore.Files.getContentUri("external"), contentValues)
            uri?.let { contentResolver.openOutputStream(it) }
        } else {
            val directory = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), "Img2PDF")
            if (!directory.exists()) {
                directory.mkdirs()
            }
            val file = File(directory, finalFileName)
            FileOutputStream(file)
        }
    }

    private fun showRenameDialog(uri: Uri) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("compressed_pdf_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Enter Output Filename")
            .setView(dialogView)
            .setPositiveButton("Process") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    executeCompress(uri, filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun showRenameDialogForMerge(uris: List<Uri>) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("merged_pdf_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Enter Output Filename")
            .setView(dialogView)
            .setPositiveButton("Process") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    executeMerge(uris, filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun performSplit(uri: Uri) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_split_pdf, null)
        val startPageInput = dialogView.findViewById<TextInputEditText>(R.id.start_page_edit_text)
        val endPageInput = dialogView.findViewById<TextInputEditText>(R.id.end_page_edit_text)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        // Show filename input again
        filenameInput.visibility = View.VISIBLE
        filenameInput.setText("split_pdf_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle(R.string.tool_split_pdf)
            .setView(dialogView)
            .setPositiveButton("Split") { _, _ ->
                val startPage = startPageInput.text.toString().toIntOrNull() ?: 0
                val endPage = endPageInput.text.toString().toIntOrNull() ?: 0
                val filename = filenameInput.text.toString()
                
                if (startPage > 0 && endPage >= startPage && filename.isNotEmpty()) {
                     executeSplit(uri, startPage, endPage, filename)
                } else {
                    Toast.makeText(this, "Invalid input", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun executeSplit(uri: Uri, startPage: Int, endPage: Int, filename: String) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                contentResolver.openInputStream(uri)?.use { inputStream ->
                    val pdfDoc = PdfDocument(PdfReader(inputStream))
                    val totalPages = pdfDoc.numberOfPages
                    
                    if(startPage > totalPages || endPage > totalPages) {
                        withContext(Dispatchers.Main) {
                            Toast.makeText(this@PdfToolsActivity, "Page range out of bounds (Max: $totalPages)", Toast.LENGTH_SHORT).show()
                            binding.progressBar.visibility = View.GONE
                        }
                        return@launch
                    }

                    getPdfOutputStream(filename)?.use { outputStream ->
                        val writer = PdfWriter(outputStream)
                        val destPdfDoc = PdfDocument(writer)
                        pdfDoc.copyPagesTo(startPage, endPage, destPdfDoc)
                        destPdfDoc.close()
                    }
                    pdfDoc.close()
                    
                    withContext(Dispatchers.Main) {
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@PdfToolsActivity, "PDF Split Successfully", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@PdfToolsActivity, "Error splitting PDF: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun executeMerge(uris: List<Uri>, filename: String) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                getPdfOutputStream(filename)?.use { outputStream ->
                    val writer = PdfWriter(outputStream)
                    val pdfDoc = PdfDocument(writer)
                    val merger = PdfMerger(pdfDoc)

                    for (uri in uris) {
                        contentResolver.openInputStream(uri)?.use { inputStream ->
                            val sourcePdf = PdfDocument(PdfReader(inputStream))
                            merger.merge(sourcePdf, 1, sourcePdf.numberOfPages)
                            sourcePdf.close()
                        }
                    }
                    pdfDoc.close()
                    withContext(Dispatchers.Main) {
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@PdfToolsActivity, "PDFs Merged Successfully", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@PdfToolsActivity, "Error merging PDFs: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun performCompress(uri: Uri) {
         // Moved to showRenameDialog
    }

    private fun executeCompress(uri: Uri, filename: String) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                contentResolver.openInputStream(uri)?.use { inputStream ->
                     val reader = PdfReader(inputStream)
                     val writerProperties = WriterProperties()
                     writerProperties.setCompressionLevel(9)
                     writerProperties.setFullCompressionMode(true)
                     
                     getPdfOutputStream(filename)?.use { outputStream ->
                        val writer = PdfWriter(outputStream, writerProperties)
                        val pdfDoc = PdfDocument(reader, writer)
                        pdfDoc.close()
                     }
                }
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@PdfToolsActivity, "PDF Compressed Successfully", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@PdfToolsActivity, "Error compressing PDF: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun performLock(uri: Uri) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_unlock_pdf, null)
        val passwordInput = dialogView.findViewById<TextInputEditText>(R.id.password_edit_text)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text) 
        filenameInput.visibility = View.VISIBLE 
        filenameInput.setText("protected_pdf_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Set Password")
            .setView(dialogView)
            .setPositiveButton("Lock") { _, _ ->
                val password = passwordInput.text.toString()
                val filename = filenameInput.text.toString()
                
                if (password.isNotEmpty() && filename.isNotEmpty()) {
                    executeLock(uri, password, filename)
                } else {
                    Toast.makeText(this, "Password and filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun executeLock(uri: Uri, password: String, filename: String) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                getPdfOutputStream(filename)?.use { outputStream ->
                    contentResolver.openInputStream(uri)?.use { inputStream ->
                        val reader = PdfReader(inputStream)
                        val writerProperties = WriterProperties().setStandardEncryption(
                            password.toByteArray(),
                            password.toByteArray(),
                            EncryptionConstants.ALLOW_PRINTING,
                            EncryptionConstants.ENCRYPTION_AES_256
                        )
                        val writer = PdfWriter(outputStream, writerProperties)
                        val pdfDoc = PdfDocument(reader, writer)
                        pdfDoc.close()
                        withContext(Dispatchers.Main) {
                            binding.progressBar.visibility = View.GONE
                            Toast.makeText(this@PdfToolsActivity, "PDF Locked Successfully", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@PdfToolsActivity, "Error locking PDF: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}