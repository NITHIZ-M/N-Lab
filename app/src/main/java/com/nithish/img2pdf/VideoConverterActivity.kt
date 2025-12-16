package com.nithish.img2pdf

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityVideoConverterBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import java.io.File
import java.io.FileOutputStream

class VideoConverterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVideoConverterBinding
    private var currentToolId: Int = -1

    private val videoTools = listOf(
        // ToolModel(210, R.string.tool_video_to_mp3, R.drawable.ic_music), // Video to MP3 - Removed audio functionality
        ToolModel(211, R.string.tool_video_to_gif, R.drawable.ic_gif)    
    )

    private val selectVideo = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { 
            showRenameDialog(it)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVideoConverterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }
        supportActionBar?.title = "Video Converter" 

        val adapter = ToolsAdapter(videoTools) { tool ->
            currentToolId = tool.id
            selectVideo.launch("video/*")
        }

        binding.videoToolsGrid.adapter = adapter
        binding.videoToolsGrid.layoutManager = GridLayoutManager(this, 2)
        
        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.videoToolsGrid.setPadding(spacing, spacing, spacing, spacing)
        binding.videoToolsGrid.clipToPadding = false
    }

    private fun showRenameDialog(uri: Uri) {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("converted_video_${System.currentTimeMillis()}")

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
        val extension = if (currentToolId == 211) "gif" else "mp4" // Only GIF supported now or other video formats
        val outputFile = File(cacheDir, "$filename.$extension")
        
        // Basic implementation for GIF conversion if needed, using FFmpeg
        val inputFile = getFileFromUri(uri)
        if (inputFile != null) {
            val commands = if (currentToolId == 211) {
                arrayOf("ffmpeg", "-i", inputFile.absolutePath, outputFile.absolutePath)
            } else {
                arrayOf("ffmpeg", "-i", inputFile.absolutePath, outputFile.absolutePath) // Placeholder
            }
            
            RxFFmpegInvoke.getInstance().runCommand(commands, object : RxFFmpegSubscriber() {
                override fun onFinish() {
                    if (outputFile.exists()) {
                         Toast.makeText(this@VideoConverterActivity, "Conversion Successful", Toast.LENGTH_SHORT).show()
                         // Save to public storage logic here
                    } else {
                         Toast.makeText(this@VideoConverterActivity, "Conversion Failed", Toast.LENGTH_SHORT).show()
                    }
                }
                override fun onProgress(progress: Int, progressTime: Long) {}
                override fun onCancel() {}
                override fun onError(message: String) {
                    Toast.makeText(this@VideoConverterActivity, "Error: $message", Toast.LENGTH_SHORT).show()
                }
            })
        }
    }
    
    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_video_convert_${System.currentTimeMillis()}")
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