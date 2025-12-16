package com.nithish.img2pdf

import android.Manifest
import android.content.ContentValues
import android.content.pm.PackageManager
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
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.textfield.TextInputEditText
import com.itextpdf.io.image.ImageDataFactory
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Image
import com.nithish.img2pdf.databinding.ActivityJpgToPdfBinding
import com.nithish.img2pdf.models.ImageModel
import com.nithish.img2pdf.utils.ImagesAdapter
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class JpgToPdfActivity : AppCompatActivity() {

    private lateinit var binding: ActivityJpgToPdfBinding
    private lateinit var imagesAdapter: ImagesAdapter
    private val images = mutableListOf<ImageModel>()
    private val STORAGE_PERMISSION_CODE = 101

    private val selectImages =
        registerForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
            if (uris.isNotEmpty()) {
                uris.forEach { uri ->
                    images.add(ImageModel(uri))
                }
                updateUi()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityJpgToPdfBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        imagesAdapter = ImagesAdapter(images)
        binding.imageGrid.layoutManager = GridLayoutManager(this, 3)
        binding.imageGrid.adapter = imagesAdapter

        // Use emptyState or uploadCard
        binding.uploadCard.setOnClickListener {
            checkPermissionAndSelectImages()
        }

        binding.clearButton.setOnClickListener {
            images.clear()
            updateUi()
        }

        binding.convertButton.setOnClickListener {
            if (images.isNotEmpty()) {
                showRenameDialog()
            } else {
                Toast.makeText(this, "Please select images first", Toast.LENGTH_SHORT).show()
            }
        }

        updateUi()
    }

    private fun checkPermissionAndSelectImages() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.READ_MEDIA_IMAGES
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                selectImages.launch("image/*")
            } else {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.READ_MEDIA_IMAGES),
                    STORAGE_PERMISSION_CODE
                )
            }
        } else {
            if (ContextCompat.checkSelfPermission(
                    this,
                    Manifest.permission.READ_EXTERNAL_STORAGE
                ) == PackageManager.PERMISSION_GRANTED
            ) {
                selectImages.launch("image/*")
            } else {
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE),
                    STORAGE_PERMISSION_CODE
                )
            }
        }
    }

    private fun showRenameDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("jpg_to_pdf_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Enter Output Filename")
            .setView(dialogView)
            .setPositiveButton("Convert") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    createPdf(filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun createPdf(filename: String) {
        val finalFileName = if (filename.endsWith(".pdf", true)) filename else "$filename.pdf"
        var fos: OutputStream? = null

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, finalFileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOCUMENTS + "/Img2PDF")
                }
                val uri = contentResolver.insert(MediaStore.Files.getContentUri("external"), contentValues)
                fos = uri?.let { contentResolver.openOutputStream(it) }
            } else {
                val directory = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS), "Img2PDF")
                if (!directory.exists()) {
                    directory.mkdirs()
                }
                val file = File(directory, finalFileName)
                fos = FileOutputStream(file)
            }

            fos?.use { outputStream ->
                val pdfWriter = PdfWriter(outputStream)
                val pdfDocument = PdfDocument(pdfWriter)
                val document = Document(pdfDocument)

                document.setMargins(0f, 0f, 0f, 0f)

                for (imageModel in images) {
                    val inputStream = contentResolver.openInputStream(imageModel.uri)
                    val bytes = inputStream?.readBytes()
                    if (bytes != null) {
                        val imageData = ImageDataFactory.create(bytes)
                        val image = Image(imageData)

                        val pdfPageSize = pdfDocument.defaultPageSize
                        image.scaleToFit(pdfPageSize.width, pdfPageSize.height)

                        val x = (pdfPageSize.width - image.imageScaledWidth) / 2
                        val y = (pdfPageSize.height - image.imageScaledHeight) / 2
                        image.setFixedPosition(x, y)

                        document.add(image)

                        if (images.indexOf(imageModel) < images.size - 1) {
                            document.add(com.itextpdf.layout.element.AreaBreak(com.itextpdf.layout.properties.AreaBreakType.NEXT_PAGE))
                        }
                    }
                }

                document.close()
                Toast.makeText(this, "PDF created successfully", Toast.LENGTH_LONG).show()
                images.clear()
                updateUi()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            Toast.makeText(this, "Error creating PDF: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == STORAGE_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                selectImages.launch("image/*")
            } else {
                Toast.makeText(this, "Permission denied", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun updateUi() {
        if (images.isEmpty()) {
            binding.emptyState.visibility = View.VISIBLE
            binding.imageGrid.visibility = View.GONE
            binding.bottomBar.visibility = View.GONE
            binding.actionBar.visibility = View.GONE
        } else {
            binding.emptyState.visibility = View.GONE
            binding.imageGrid.visibility = View.VISIBLE
            binding.bottomBar.visibility = View.VISIBLE
            binding.actionBar.visibility = View.VISIBLE
            binding.imageCountText.text = "${images.size} Selected"
        }
        imagesAdapter.notifyDataSetChanged()
    }
}