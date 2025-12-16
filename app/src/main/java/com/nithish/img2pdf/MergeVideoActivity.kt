package com.nithish.img2pdf

import android.content.ContentValues
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.nithish.img2pdf.databinding.ActivityMergeVideoBinding
import io.microshow.rxffmpeg.RxFFmpegInvoke
import io.microshow.rxffmpeg.RxFFmpegSubscriber
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream

class MergeVideoActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMergeVideoBinding
    private val videoFiles = mutableListOf<File>()
    private lateinit var adapter: VideoListAdapter

    private val selectVideo = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { addVideo(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMergeVideoBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Merge Videos"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val uriList = if (Build.VERSION.SDK_INT >= 33) {
            intent.getParcelableArrayListExtra("video_uris", Uri::class.java)
        } else {
            intent.getParcelableArrayListExtra("video_uris")
        }
        
        uriList?.forEach { addVideo(it) }

        adapter = VideoListAdapter(videoFiles) { position ->
            removeVideo(position)
        }
        binding.videoList.adapter = adapter
        binding.videoList.layoutManager = LinearLayoutManager(this)

        binding.addVideoButton.setOnClickListener {
            selectVideo.launch("video/*")
        }

        binding.saveButton.setOnClickListener {
            mergeVideos()
        }
    }

    private fun addVideo(uri: Uri) {
        lifecycleScope.launch(Dispatchers.IO) {
            val file = getFileFromUri(uri)
            if (file != null) {
                withContext(Dispatchers.Main) {
                    videoFiles.add(file)
                    adapter.notifyItemInserted(videoFiles.size - 1)
                }
            }
        }
    }

    private fun removeVideo(position: Int) {
        videoFiles.removeAt(position)
        adapter.notifyItemRemoved(position)
    }

    private fun mergeVideos() {
        if (videoFiles.size < 2) {
            Toast.makeText(this, "Select at least 2 videos", Toast.LENGTH_SHORT).show()
            return
        }
        
        val filename = binding.filenameInput.text.toString()
        if (filename.isEmpty()) {
            Toast.makeText(this, "Please enter a filename", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch(Dispatchers.IO) {
            val outputDir = cacheDir
            val listFile = File(outputDir, "list.txt")
            val writer = java.io.FileWriter(listFile)
            videoFiles.forEach {
                writer.write("file '${it.absolutePath}'\n")
            }
            writer.close()

            val outputFile = File(outputDir, "${filename}.mp4")
            
            val commands = arrayOf(
                "ffmpeg", "-f", "concat", "-safe", "0", "-i", listFile.absolutePath,
                "-c", "copy", outputFile.absolutePath
            )
            
            withContext(Dispatchers.Main) {
                runFFmpegCommand(commands, outputFile, "Videos Merged")
            }
        }
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
                            Toast.makeText(this@MergeVideoActivity, "$successMessage. Saved to Movies/Img2PDF", Toast.LENGTH_LONG).show()
                            finish()
                        }
                    } else {
                        withContext(Dispatchers.Main) {
                            binding.progressBar.visibility = View.GONE
                            if (!isErrorOrCancelled) {
                                Toast.makeText(this@MergeVideoActivity, "Output file creation failed", Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            }

            override fun onProgress(progress: Int, progressTime: Long) {}

            override fun onCancel() {
                isErrorOrCancelled = true
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@MergeVideoActivity, "Cancelled", Toast.LENGTH_SHORT).show()
            }

            override fun onError(message: String) {
                isErrorOrCancelled = true
                binding.progressBar.visibility = View.GONE
                Toast.makeText(this@MergeVideoActivity, "Error: $message", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun getFileFromUri(uri: Uri): File? {
        val destinationFilename = File(cacheDir, "temp_merge_${System.currentTimeMillis()}.mp4")
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
    
    inner class VideoListAdapter(private val files: List<File>, private val onRemove: (Int) -> Unit) : RecyclerView.Adapter<VideoListAdapter.ViewHolder>() {
        inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
            val nameText: TextView = view.findViewById(android.R.id.text1)
        }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val view = android.view.LayoutInflater.from(parent.context).inflate(android.R.layout.simple_list_item_1, parent, false)
            return ViewHolder(view)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            holder.nameText.text = files[position].name
            holder.itemView.setOnClickListener { onRemove(position) }
        }

        override fun getItemCount() = files.size
    }
}