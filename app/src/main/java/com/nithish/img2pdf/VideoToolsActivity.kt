package com.nithish.img2pdf

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.nithish.img2pdf.databinding.ActivityVideoToolsBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter

class VideoToolsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVideoToolsBinding
    private var currentToolId: Int = -1

    private val videoTools = listOf(
        ToolModel(501, R.string.tool_trim_video, R.drawable.ic_tool_trim),
        ToolModel(502, R.string.tool_merge_video, R.drawable.ic_merge),
        ToolModel(503, R.string.tool_crop_video, R.drawable.ic_crop),
        ToolModel(504, R.string.tool_rotate_video, R.drawable.ic_rotate),
        ToolModel(505, R.string.tool_speed_volume_video, R.drawable.ic_speed)
    )

    private val selectVideo = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { 
             handleVideoSelection(it)
        }
    }
    
    private val selectMultipleVideos = registerForActivityResult(ActivityResultContracts.GetMultipleContents()) { uris ->
        if(uris.isNotEmpty()){
            handleMultipleVideoSelection(uris)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVideoToolsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.title = "Video Tools"
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val adapter = ToolsAdapter(videoTools) { tool ->
            currentToolId = tool.id
            when(tool.id){
                502 -> selectMultipleVideos.launch("video/*")
                else -> selectVideo.launch("video/*")
            }
        }

        binding.videoToolsRecyclerView.adapter = adapter
        binding.videoToolsRecyclerView.layoutManager = GridLayoutManager(this, 2)

        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.videoToolsRecyclerView.setPadding(spacing, spacing, spacing, spacing)
        binding.videoToolsRecyclerView.clipToPadding = false
    }

    private fun handleVideoSelection(uri: Uri) {
        val intent = when (currentToolId) {
            501 -> Intent(this, TrimVideoActivity::class.java)
            503 -> Intent(this, CropVideoActivity::class.java)
            504 -> Intent(this, RotateVideoActivity::class.java)
            505 -> Intent(this, SpeedVolumeActivity::class.java)
            else -> null
        }

        if (intent != null) {
            intent.putExtra("video_uri", uri.toString())
            startActivity(intent)
        }
    }

    private fun handleMultipleVideoSelection(uris: List<Uri>) {
        if (currentToolId == 502) { 
            val intent = Intent(this, MergeVideoActivity::class.java)
            intent.putParcelableArrayListExtra("video_uris", ArrayList(uris))
            startActivity(intent)
        }
    }
}