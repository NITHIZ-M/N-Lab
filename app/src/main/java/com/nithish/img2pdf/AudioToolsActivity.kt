package com.nithish.img2pdf

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import com.nithish.img2pdf.databinding.ActivityAudioToolsBinding
import com.nithish.img2pdf.models.ToolModel
import com.nithish.img2pdf.utils.ToolsAdapter

class AudioToolsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAudioToolsBinding

    private val audioTools = listOf(
        ToolModel(101, R.string.tool_trim_audio, R.drawable.ic_tool_trim),
        ToolModel(102, R.string.tool_change_volume, R.drawable.ic_music),
        ToolModel(103, R.string.tool_change_speed, R.drawable.ic_speed),
        ToolModel(105, R.string.tool_equalizer, R.drawable.ic_music),
        ToolModel(106, R.string.tool_reverse_audio, R.drawable.ic_convert),
        ToolModel(108, R.string.tool_audio_joiner, R.drawable.ic_merge)
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAudioToolsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.setHomeAsUpIndicator(R.drawable.ic_arrow_back)
        binding.toolbar.setNavigationOnClickListener { onBackPressedDispatcher.onBackPressed() }

        val adapter = ToolsAdapter(audioTools) { tool ->
            val intent = when(tool.id) {
                101 -> Intent(this, TrimAudioActivity::class.java)
                102 -> Intent(this, VolumeActivity::class.java)
                103 -> Intent(this, SpeedActivity::class.java)
                105 -> Intent(this, EqualizerActivity::class.java)
                106 -> Intent(this, ReverseActivity::class.java)
                108 -> Intent(this, JoinerActivity::class.java)
                else -> null
            }
            if (intent != null) {
                startActivity(intent)
            } else {
                Toast.makeText(this, "Tool not implemented", Toast.LENGTH_SHORT).show()
            }
        }

        binding.audioToolsGrid.adapter = adapter
        binding.audioToolsGrid.layoutManager = GridLayoutManager(this, 2)
        val spacing = resources.getDimensionPixelSize(R.dimen.grid_spacing)
        binding.audioToolsGrid.setPadding(spacing, spacing, spacing, spacing)
        binding.audioToolsGrid.clipToPadding = false
    }
}