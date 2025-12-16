package com.nithish.img2pdf

import android.content.ContentValues
import android.content.Intent
import android.graphics.BitmapFactory
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
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityResizeImageBinding
import com.yalantis.ucrop.UCrop
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import java.io.File
import java.io.FileOutputStream

class ResizeImageActivity : AppCompatActivity() {

    private lateinit var binding: ActivityResizeImageBinding
    private var imageUri: Uri? = null
    private var sourceFile: File? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityResizeImageBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val uriString = intent.getStringExtra("image_uri")
        if (uriString != null) {
            imageUri = Uri.parse(uriString)
            sourceFile = getFileFromUri(imageUri!!)
            loadImage()
            
            // Set initial dimensions
            sourceFile?.let {
                val options = BitmapFactory.Options()
                options.inJustDecodeBounds = true
                BitmapFactory.decodeFile(it.absolutePath, options)
                binding.widthEditText.setText(options.outWidth.toString())
                binding.heightEditText.setText(options.outHeight.toString())
            }
        }

        binding.cropButton.setOnClickListener {
            sourceFile?.let { file ->
                startCrop(Uri.fromFile(file))
            }
        }

        binding.saveButton.setOnClickListener {
            val width = binding.widthEditText.text.toString().toIntOrNull()
            val height = binding.heightEditText.text.toString().toIntOrNull()

            if (width == null || height == null) {
                Toast.makeText(this, "Please enter valid dimensions", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            showSaveDialog(width, height)
        }
    }

    private fun loadImage() {
        sourceFile?.let {
            Glide.with(this).load(it).into(binding.previewImageView)
        }
    }

    private fun startCrop(uri: Uri) {
        val destinationFileName = "cropped_${System.currentTimeMillis()}.jpg"
        val destinationFile = File(cacheDir, destinationFileName)
        val options = UCrop.Options()
        
        UCrop.of(uri, Uri.fromFile(destinationFile))
            .withOptions(options)
            .start(this)
    }

    private fun showSaveDialog(width: Int, height: Int) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("resized_image_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Save Image")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    resizeImage(width, height, filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (resultCode == RESULT_OK && requestCode == UCrop.REQUEST_CROP) {
            val resultUri = UCrop.getOutput(data!!)
            resultUri?.let {
                // Update source file to cropped image
                sourceFile = File(it.path!!)
                loadImage()
                
                // Update dimensions
                val options = BitmapFactory.Options()
                options.inJustDecodeBounds = true
                BitmapFactory.decodeFile(sourceFile!!.absolutePath, options)
                binding.widthEditText.setText(options.outWidth.toString())
                binding.heightEditText.setText(options.outHeight.toString())
            }
        } else if (resultCode == UCrop.RESULT_ERROR) {
            val cropError = UCrop.getError(data!!)
            Toast.makeText(this, "Crop error: ${cropError?.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun resizeImage(width: Int, height: Int, filename: String) {
        val outputFile = File(cacheDir, "$filename.jpg")
        val commands = arrayOf(
            "ffmpeg", "-i", sourceFile!!.absolutePath,
            "-vf", "scale=$width:$height",
            outputFile.absolutePath
        )
        
        binding.progressBar.visibility = View.VISIBLE
        
        RxFFmpegInvoke.getInstance().runCommand(commands, object : RxFFmpegSubscriber() {
            override fun onFinish() {
                if (outputFile.exists()) {
                    saveImageToPublic(outputFile, "$filename.jpg")
                    runOnUiThread {
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@ResizeImageActivity, "Image Saved", Toast.LENGTH_LONG).show()
                        finish()
                    }
                } else {
                    runOnUiThread { 
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@ResizeImageActivity, "Failed to create file", Toast.LENGTH_SHORT).show()
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
                    Toast.makeText(this@ResizeImageActivity, "Error: $message", Toast.LENGTH_SHORT).show()
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
            // Toast handled in calling thread or suppressed
        }
    }

    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_resize_${System.currentTimeMillis()}")
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