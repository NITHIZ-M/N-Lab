package com.nithish.img2pdf

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.bumptech.glide.Glide
import com.nithish.img2pdf.databinding.ActivityCompressImageBinding
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import java.io.File
import java.io.FileOutputStream

class CompressImageActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCompressImageBinding
    private var imageUri: Uri? = null
    private var sourceFile: File? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCompressImageBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupToolbar()

        val uriString = intent.getStringExtra("image_uri")
        if (uriString != null) {
            imageUri = Uri.parse(uriString)
            sourceFile = getFileFromUri(imageUri!!)
            loadImage()
        }

        binding.qualitySeekBar.addOnChangeListener { _, value, _ ->
            binding.qualityValueText.text = "${value.toInt()}%"
        }

        binding.saveButton.setOnClickListener {
            val quality = binding.qualitySeekBar.value.toInt()
            val filename = binding.filenameEditText.text.toString()

            if (filename.isEmpty()) {
                Toast.makeText(this, "Please enter a filename", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            compressImage(quality, filename)
        }
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Compress Image"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }
    }

    private fun loadImage() {
        sourceFile?.let {
            Glide.with(this).load(it).into(binding.previewImageView)
        }
    }

    private fun compressImage(quality: Int, filename: String) {
        val outputFile = File(getExternalFilesDir(null), "$filename.jpg")
        
        // Map 0-100 quality to FFmpeg qscale 31-1 (approximate)
        // qscale: lower is better quality. 1 is highest, 31 is lowest.
        // If quality is 100, q = 1. If quality is 0, q = 31.
        val q = 31 - (quality * 30 / 100)
        
        val commands = arrayOf(
            "ffmpeg", "-i", sourceFile!!.absolutePath,
            "-q:v", q.toString(),
            outputFile.absolutePath
        )
        
        binding.progressBar.visibility = View.VISIBLE
        
        RxFFmpegInvoke.getInstance().runCommand(commands, object : RxFFmpegSubscriber() {
            override fun onFinish() {
                binding.progressBar.visibility = View.GONE
                saveImageToPublic(outputFile, "$filename.jpg")
                Toast.makeText(this@CompressImageActivity, "Image Saved", Toast.LENGTH_LONG).show()
                finish()
            }

            override fun onProgress(progress: Int, progressTime: Long) {}

            override fun onCancel() {
                binding.progressBar.visibility = View.GONE
            }

            override fun onError(message: String) {
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@CompressImageActivity, "Error: $message", Toast.LENGTH_SHORT).show()
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
                val resolver = contentResolver
                val collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                val uri = resolver.insert(collection, contentValues)
                uri?.let { destUri ->
                    resolver.openOutputStream(destUri)?.use { out ->
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
            Toast.makeText(this, "Error saving to gallery: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_compress_${System.currentTimeMillis()}")
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
