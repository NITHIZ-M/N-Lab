package com.nithish.img2pdf

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.slider.RangeSlider
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityTrimVideoBinding
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.concurrent.TimeUnit

class TrimVideoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityTrimVideoBinding
    private var videoUri: Uri? = null
    private var startTime: Long = 0
    private var endTime: Long = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTrimVideoBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Trim Video"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val uriString = intent.getStringExtra("video_uri")
        
        if (uriString != null) {
            videoUri = Uri.parse(uriString)
            setupVideoView()
        } else {
            Toast.makeText(this, "No video selected", Toast.LENGTH_SHORT).show()
            finish()
        }

        binding.saveButton.setOnClickListener {
            showSaveDialog()
        }
    }

    private fun setupVideoView() {
        binding.videoView.setVideoURI(videoUri)
        binding.videoView.setOnPreparedListener { mp ->
            val duration = mp.duration.toLong()
            endTime = duration
            binding.rangeSlider.valueFrom = 0f
            binding.rangeSlider.valueTo = duration.toFloat()
            binding.rangeSlider.values = listOf(0f, duration.toFloat())
            updateTrimTimeLabel()

            binding.rangeSlider.addOnChangeListener(object : RangeSlider.OnChangeListener {
                override fun onValueChange(slider: RangeSlider, value: Float, fromUser: Boolean) {
                    val values = slider.values
                    startTime = values[0].toLong()
                    endTime = values[1].toLong()
                    updateTrimTimeLabel()
                    if (fromUser) {
                        binding.videoView.seekTo(startTime.toInt())
                    }
                }
            })
            binding.videoView.start()
        }
    }

    private fun updateTrimTimeLabel() {
        val start = formatTime(startTime)
        val end = formatTime(endTime)
        binding.trimTimeText.text = "$start - $end"
    }

    private fun formatTime(millis: Long): String {
        return String.format("%02d:%02d:%02d",
            TimeUnit.MILLISECONDS.toHours(millis),
            TimeUnit.MILLISECONDS.toMinutes(millis) - TimeUnit.HOURS.toMinutes(TimeUnit.MILLISECONDS.toHours(millis)),
            TimeUnit.MILLISECONDS.toSeconds(millis) - TimeUnit.MINUTES.toSeconds(TimeUnit.MILLISECONDS.toMinutes(millis))
        )
    }

    private fun showSaveDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("trimmed_video_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Save Video")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    trimVideo(filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun trimVideo(filename: String) {
        val startSec = startTime / 1000.0
        val durationSec = (endTime - startTime) / 1000.0

        val inputFile = getFileFromUri(videoUri!!)
        if (inputFile == null) {
            Toast.makeText(this, "Failed to access input file", Toast.LENGTH_SHORT).show()
            return
        }

        val outputFile = File(cacheDir, "${filename}.mp4")

        val commands = arrayOf(
            "ffmpeg", "-i", inputFile.absolutePath,
            "-ss", String.format("%.2f", startSec),
            "-t", String.format("%.2f", durationSec),
            "-c", "copy", outputFile.absolutePath
        )

        runFFmpegCommand(commands, outputFile, "Video Trimmed")
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
                            Toast.makeText(this@TrimVideoActivity, "$successMessage. Saved to Movies/Img2PDF", Toast.LENGTH_LONG).show()
                            finish()
                        }
                    } else {
                        withContext(Dispatchers.Main) {
                            binding.progressBar.visibility = View.GONE
                            if (!isErrorOrCancelled) {
                                Toast.makeText(this@TrimVideoActivity, "Output file creation failed", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            }

            override fun onProgress(progress: Int, progressTime: Long) {}

            override fun onCancel() {
                isErrorOrCancelled = true
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@TrimVideoActivity, "Cancelled", Toast.LENGTH_SHORT).show()
            }

            override fun onError(message: String) {
                isErrorOrCancelled = true
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@TrimVideoActivity, "Error: $message", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_video_trim_${System.currentTimeMillis()}.mp4")
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