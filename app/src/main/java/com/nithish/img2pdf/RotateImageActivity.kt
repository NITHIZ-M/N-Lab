package com.nithish.img2pdf

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityRotateImageBinding
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import java.io.File
import java.io.FileOutputStream

class RotateImageActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRotateImageBinding
    private var imageUri: Uri? = null
    private var sourceFile: File? = null
    private var currentRotation = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityRotateImageBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()

        val uriString = intent.getStringExtra("image_uri")
        if (uriString != null) {
            imageUri = Uri.parse(uriString)
            sourceFile = getFileFromUri(imageUri!!)
            loadImage()
        }

        binding.rotateLeftButton.setOnClickListener {
            rotatePreview(-90f)
        }

        binding.rotateRightButton.setOnClickListener {
            rotatePreview(90f)
        }

        binding.saveButton.setOnClickListener {
            showSaveDialog()
        }
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Rotate Image"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }
    }

    private fun loadImage() {
        sourceFile?.let {
            Glide.with(this)
                .load(it)
                .diskCacheStrategy(DiskCacheStrategy.NONE)
                .skipMemoryCache(true)
                .into(binding.previewImageView)
        }
    }

    private fun rotatePreview(degrees: Float) {
        currentRotation = (currentRotation + degrees.toInt()) % 360
        if (currentRotation < 0) currentRotation += 360
        
        binding.previewImageView.rotation = binding.previewImageView.rotation + degrees
    }

    private fun showSaveDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("rotated_image_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Save Image")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    saveRotatedImage(filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun saveRotatedImage(filename: String) {
        val outputFile = File(getExternalFilesDir(null), "$filename.jpg")
        
        // Use FFmpeg for rotation to ensure quality and handle large files
        // transpose=1 (90 Clockwise), transpose=2 (90 Counter-Clockwise)
        // For 180, transpose=2,transpose=2 or transpose=1,transpose=1
        
        val transposeFilter = when (currentRotation) {
            90 -> "transpose=1"
            180 -> "transpose=1,transpose=1" 
            270 -> "transpose=2"
            else -> "" // 0
        }
        
        if (transposeFilter.isEmpty()) {
             // Just copy if 0 rotation, but user clicked save so maybe they want a copy
             val commands = arrayOf(
                "ffmpeg", "-i", sourceFile!!.absolutePath,
                outputFile.absolutePath
            )
            runCommand(commands, outputFile, filename)
        } else {
            val commands = arrayOf(
                "ffmpeg", "-i", sourceFile!!.absolutePath,
                "-vf", transposeFilter,
                outputFile.absolutePath
            )
            runCommand(commands, outputFile, filename)
        }
    }
    
    private fun runCommand(commands: Array<String>, outputFile: File, filename: String) {
        binding.progressBar.visibility = View.VISIBLE
        
        RxFFmpegInvoke.getInstance().runCommand(commands, object : RxFFmpegSubscriber() {
            override fun onFinish() {
                if (outputFile.exists()) {
                    saveImageToPublic(outputFile, "$filename.jpg")
                    runOnUiThread {
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@RotateImageActivity, "Image Saved", Toast.LENGTH_LONG).show()
                        finish()
                    }
                } else {
                    runOnUiThread { 
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@RotateImageActivity, "Failed to create file", Toast.LENGTH_SHORT).show()
                    }
                }
            }

            override fun onProgress(progress: Int, progressTime: Long) {}

            override fun onCancel() {
                runOnUiThread { binding.progressBar.visibility = View.GONE }
            }

            override fun onError(message: String) {
                runOnUiThread {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@RotateImageActivity, "Error: $message", Toast.LENGTH_SHORT).show()
                }
            }
        })
    }

    private fun saveImageToPublic(file: File, fileName: String) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Img2PDF")
                }
                val uri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                uri?.let { destUri ->
                    contentResolver.openOutputStream(destUri)?.use { out ->
                        file.inputStream().use { input ->
                            input.copyTo(out)
                        }
                    }
                }
            } else {
                val destDir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Img2PDF")
                if (!destDir.exists()) {
                    destDir.mkdirs()
                }
                val destFile = File(destDir, fileName)
                file.copyTo(destFile, overwrite = true)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            // Toast handled in UI thread
        }
    }

    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_rotate_${System.currentTimeMillis()}")
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
}