package com.nithish.img2pdf

import android.content.ContentValues
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityVolumeBinding
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class VolumeActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVolumeBinding
    private var audioUri: Uri? = null
    private var inputFile: File? = null
    private var mediaPlayer: MediaPlayer? = null
    private var volumeLevel: Float = 1.0f

    private val selectAudio = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { 
            audioUri = it
            loadAudio()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVolumeBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val uriString = intent.getStringExtra("audio_uri")
        if (uriString != null) {
            audioUri = Uri.parse(uriString)
            loadAudio()
        } else {
            selectAudio.launch("audio/*")
        }

        binding.volumeSlider.addOnChangeListener { _, value, _ ->
            volumeLevel = value / 100f
            binding.volumeLabel.text = "Volume: ${value.toInt()}%"
            mediaPlayer?.setVolume(volumeLevel, volumeLevel)
        }

        binding.playButton.setOnClickListener { togglePlay() }
        binding.saveButton.setOnClickListener { showSaveDialog() }
    }

    private fun loadAudio() {
        if (audioUri == null) return
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            inputFile = getFileFromUri(audioUri!!)
            withContext(Dispatchers.Main) {
                binding.progressBar.visibility = View.GONE
                if (inputFile != null && inputFile!!.exists()) {
                    initMediaPlayer(inputFile!!)
                    binding.fileInfoText.text = "File loaded: ${inputFile!!.name}"
                }
            }
        }
    }

    private fun initMediaPlayer(file: File) {
        mediaPlayer?.release()
        mediaPlayer = MediaPlayer().apply {
            setDataSource(file.absolutePath)
            prepare()
            setVolume(volumeLevel, volumeLevel)
        }
    }

    private fun togglePlay() {
        mediaPlayer?.let {
            if (it.isPlaying) {
                it.pause()
                binding.playButton.text = getString(R.string.play_preview)
            } else {
                it.start()
                binding.playButton.text = getString(R.string.pause_preview)
            }
        }
    }

    private fun showSaveDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("volume_adjusted_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Save Audio")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    saveVolumeChange(filename)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun saveVolumeChange(filename: String) {
        if (inputFile == null) return
        val outputFile = File(cacheDir, "$filename.mp3")
        val commands = arrayOf("ffmpeg", "-i", inputFile!!.absolutePath, "-filter:a", "volume=$volumeLevel", outputFile.absolutePath)

        binding.progressBar.visibility = View.VISIBLE
        RxFFmpegInvoke.getInstance().runCommand(commands, object : RxFFmpegSubscriber() {
            override fun onFinish() {
                if (outputFile.exists()) {
                    saveFileToPublic(outputFile, "audio/mpeg", "Music/Img2PDF")
                    runOnUiThread {
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@VolumeActivity, "Saved successfully", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                } else {
                     runOnUiThread { 
                         binding.progressBar.visibility = View.GONE 
                         Toast.makeText(this@VolumeActivity, "Failed to create file", Toast.LENGTH_SHORT).show()
                     }
                }
            }
            override fun onProgress(progress: Int, progressTime: Long) {}
            override fun onCancel() {}
            override fun onError(message: String) {
                 runOnUiThread { 
                     binding.progressBar.visibility = View.GONE
                     Toast.makeText(this@VolumeActivity, "Error: $message", Toast.LENGTH_SHORT).show()
                 }
            }
        })
    }
    
    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_audio_vol_${System.currentTimeMillis()}")
        try {
            contentResolver.openInputStream(uri)?.use { ins ->
                FileOutputStream(destinationFilename).use { out -> ins.copyTo(out) }
            }
            return destinationFilename
        } catch (e: Exception) { return null }
    }
    
    private fun saveFileToPublic(file: File, mimeType: String, subDir: String) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val contentValues = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, file.name)
                put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
                put(MediaStore.MediaColumns.RELATIVE_PATH, subDir)
            }
            contentResolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, contentValues)?.let { uri ->
                contentResolver.openOutputStream(uri)?.use { out ->
                    FileInputStream(file).copyTo(out)
                }
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        mediaPlayer?.release()
    }
}