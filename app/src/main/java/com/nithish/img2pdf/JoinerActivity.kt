package com.nithish.img2pdf

import android.content.ContentValues
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.textfield.TextInputEditText
import com.nithish.img2pdf.databinding.ActivityJoinerBinding
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.FileWriter

class JoinerActivity : AppCompatActivity() {

    private lateinit var binding: ActivityJoinerBinding
    private val audioFiles = mutableListOf<File>()
    private lateinit var adapter: AudioListAdapter
    private var mediaPlayer: MediaPlayer? = null
    private var previewFile: File? = null

    private val selectAudioLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
        uri?.let { addAudio(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityJoinerBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        setupRecyclerView()
        
        binding.addAudioButton.setOnClickListener { selectAudioLauncher.launch("audio/*") }
        binding.playButton.setOnClickListener { togglePlay() }
        binding.saveButton.setOnClickListener { showSaveDialog() }
    }

    private fun setupRecyclerView() {
        adapter = AudioListAdapter(audioFiles) { position ->
            audioFiles.removeAt(position)
            adapter.notifyItemRemoved(position)
            // Reset preview when list changes
            previewFile = null
            mediaPlayer?.release()
            mediaPlayer = null
            binding.playButton.text = getString(R.string.play_preview)
        }
        binding.audioList.adapter = adapter
        binding.audioList.layoutManager = LinearLayoutManager(this)
    }

    private fun addAudio(uri: Uri) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            val file = getFileFromUri(uri)
            withContext(Dispatchers.Main) {
                binding.progressBar.visibility = View.GONE
                if (file != null) {
                    audioFiles.add(file)
                    adapter.notifyItemInserted(audioFiles.size - 1)
                    // Reset preview
                    previewFile = null
                    mediaPlayer?.release()
                    mediaPlayer = null
                    binding.playButton.text = getString(R.string.play_preview)
                } else {
                    Toast.makeText(this@JoinerActivity, "Failed to load file", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun showSaveDialog() {
        if (audioFiles.size < 2) {
            Toast.makeText(this, "Select at least 2 files", Toast.LENGTH_SHORT).show()
            return
        }

        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_rename, null)
        val filenameInput = dialogView.findViewById<TextInputEditText>(R.id.filename_edit_text)
        filenameInput.setText("joined_audio_${System.currentTimeMillis()}")

        AlertDialog.Builder(this)
            .setTitle("Save Joined Audio")
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val filename = filenameInput.text.toString()
                if (filename.isNotEmpty()) {
                    joinAudio(filename, isPreview = false)
                } else {
                    Toast.makeText(this, "Filename cannot be empty", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun joinAudio(filename: String, isPreview: Boolean) {
        if (audioFiles.size < 2 && !isPreview) {
             // Already checked in showSaveDialog but safe check
             return
        }
        if (audioFiles.isEmpty() && isPreview) {
             Toast.makeText(this, "No audio to preview", Toast.LENGTH_SHORT).show()
             return
        }

        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch(Dispatchers.IO) {
            try {
                val listFile = createConcatListFile()
                val outputFile = File(cacheDir, "$filename.mp3")
                val commands = arrayOf("-f", "concat", "-safe", "0", "-i", listFile.absolutePath, "-c", "copy", outputFile.absolutePath)
                
                withContext(Dispatchers.Main) {
                    runFFmpegCommand(commands, outputFile, isPreview)
                }
            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) {
                    binding.progressBar.visibility = View.GONE
                    Toast.makeText(this@JoinerActivity, "Error preparing join", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    private fun createConcatListFile(): File {
        val listFile = File(cacheDir, "list.txt")
        FileWriter(listFile).use { writer ->
            audioFiles.forEach {
                writer.write("file '${it.absolutePath}'\n")
            }
        }
        return listFile
    }
    
    private fun togglePlay() {
        if (mediaPlayer?.isPlaying == true) {
            mediaPlayer?.pause()
            binding.playButton.text = getString(R.string.play_preview)
            return
        }

        if (previewFile != null && previewFile!!.exists()) {
            mediaPlayer?.start()
            binding.playButton.text = getString(R.string.pause_preview)
        } else {
            // Join for preview
            if(audioFiles.size >= 2) {
                joinAudio("temp_preview_join", isPreview = true)
            } else if (audioFiles.size == 1) {
                // Just play the single file
                previewFile = audioFiles[0]
                startPreview(previewFile!!)
            } else {
                Toast.makeText(this, "Add audio files first", Toast.LENGTH_SHORT).show()
            }
        }
    }
    
    private fun startPreview(file: File) {
        try {
            previewFile = file
            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                setDataSource(file.absolutePath)
                setOnPreparedListener { 
                    binding.progressBar.visibility = View.GONE
                    start()
                    binding.playButton.text = getString(R.string.pause_preview)
                }
                prepareAsync()
            }
        } catch (e: Exception) { e.printStackTrace() }
    }

    private fun runFFmpegCommand(commands: Array<String>, outputFile: File, isPreview: Boolean) {
        RxFFmpegInvoke.getInstance().runCommand(commands, object : RxFFmpegSubscriber() {
            override fun onFinish() {
                if (isPreview) {
                    runOnUiThread { startPreview(outputFile) }
                } else {
                    if (outputFile.exists()) {
                        saveFileToPublic(outputFile, "audio/mpeg", "Music/Img2PDF")
                        runOnUiThread {
                            binding.progressBar.visibility = View.GONE
                            Toast.makeText(this@JoinerActivity, "Saved successfully", Toast.LENGTH_SHORT).show()
                            finish()
                        }
                    } else {
                        runOnUiThread { binding.progressBar.visibility = View.GONE }
                    }
                }
            }
            override fun onProgress(progress: Int, progressTime: Long) {}
            override fun onCancel() {}
            override fun onError(message: String) {
                 runOnUiThread { 
                     binding.progressBar.visibility = View.GONE
                     Toast.makeText(this@JoinerActivity, "Error: $message", Toast.LENGTH_SHORT).show()
                 }
            }
        })
    }
    
    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_join_${System.currentTimeMillis()}.mp3")
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
    
    inner class AudioListAdapter(private val files: MutableList<File>, private val onRemove: (Int) -> Unit) : RecyclerView.Adapter<AudioListAdapter.ViewHolder>() {
        inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val nameText: TextView = view.findViewById(android.R.id.text1)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_1, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.nameText.text = files[position].name
            holder.itemView.setOnClickListener { onRemove(holder.adapterPosition) }
        }

        override fun getItemCount() = files.size
    }
}