package com.nithish.img2pdf

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.nithish.img2pdf.databinding.ActivityCropVideoBinding
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class CropVideoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCropVideoBinding
    private var videoUri: Uri? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCropVideoBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Crop Video"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val uriString = intent.getStringExtra("video_uri")
        if (uriString != null) {
            videoUri = Uri.parse(uriString)
            binding.videoView.setVideoURI(videoUri)
            binding.videoView.start()
        } else {
            Toast.makeText(this, "No video selected", Toast.LENGTH_SHORT).show()
            finish()
        }

        binding.saveButton.setOnClickListener {
            cropVideo()
        }
    }

    private fun cropVideo() {
        val filename = binding.filenameInput.text.toString()
        val width = binding.widthInput.text.toString()
        val height = binding.heightInput.text.toString()

        if (filename.isEmpty() || width.isEmpty() || height.isEmpty()) {
            Toast.makeText(this, "Please fill all fields", Toast.LENGTH_SHORT).show()
            return
        }

        val inputFile = getFileFromUri(videoUri!!)
        if (inputFile == null) {
            Toast.makeText(this, "Failed to access input file", Toast.LENGTH_SHORT).show()
            return
        }

        val outputFile = File(cacheDir, "${filename}.mp4")

        // ffmpeg crop filter: crop=width:height:x:y
        val commands = arrayOf(
            "ffmpeg", "-i", inputFile.absolutePath,
            "-vf", "crop=$width:$height",
            outputFile.absolutePath
        )

        runFFmpegCommand(commands, outputFile, "Video Cropped")
    }

    private fun runFFmpegCommand(commands: Array<String>, outputFile: File, successMessage: String) {
        binding.progressBar.visibility = View.VISIBLE

        RxFFmpegInvoke.getInstance().runCommand(commands, object : RxFFmpegSubscriber() {
            var isErrorOrCancelled = false

            override fun onFinish() {
                lifecycleScope.launch(Dispatchers.IO) {
                    if (!isErrorOrCancelled && outputFile.exists()) {
                        saveFileToPublic(outputFile, "video/mp4", "Movies/Img2PDF")
                        withContext(Dispatchers.Main) {
                            binding.progressBar.visibility = View.GONE
                            Toast.makeText(this@CropVideoActivity, "$successMessage. Saved to Movies/Img2PDF", Toast.LENGTH_LONG).show()
                            finish()
                        }
                    } else {
                        withContext(Dispatchers.Main) {
                            binding.progressBar.visibility = View.GONE
                            if (!isErrorOrCancelled) {
                                Toast.makeText(this@CropVideoActivity, "Output file creation failed", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            }

            override fun onProgress(progress: Int, progressTime: Long) {}

            override fun onCancel() {
                isErrorOrCancelled = true
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@CropVideoActivity, "Cancelled", Toast.LENGTH_SHORT).show()
            }

            override fun onError(message: String) {
                isErrorOrCancelled = true
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@CropVideoActivity, "Error: $message", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_video_crop_${System.currentTimeMillis()}.mp4")
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

    private fun saveFileToPublic(file: File, mimeType: String, subDir: String): Uri? {
        val contentValues = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, file.name)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.MediaColumns.RELATIVE_PATH, subDir)
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
        }

        val resolver = contentResolver
        val collection = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            MediaStore.Video.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        } else {
            MediaStore.Video.Media.EXTERNAL_CONTENT_URI
        }

        val uri = resolver.insert(collection, contentValues) ?: return null

        try {
            resolver.openOutputStream(uri)?.use { outputStream ->
                FileInputStream(file).use { inputStream ->
                    inputStream.copyTo(outputStream)
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                contentValues.clear()
                contentValues.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(uri, contentValues, null, null)
            }
            return uri
        } catch (e: Exception) {
            e.printStackTrace()
            try { resolver.delete(uri, null, null) } catch(ignore: Exception) {}
            return null
        }
    }
}