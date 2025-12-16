package com.nithish.img2pdf.utils

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.nithish.img2pdf.databinding.ItemToolBinding
import com.nithish.img2pdf.models.ToolModel

class ToolsAdapter(
    private val tools: List<ToolModel>,
    private val onToolClick: (ToolModel) -> Unit
) : RecyclerView.Adapter<ToolsAdapter.ToolViewHolder>() {

    inner class ToolViewHolder(private val binding: ItemToolBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(tool: ToolModel) {
            binding.toolName.setText(tool.nameResId)
            binding.toolIcon.setImageResource(tool.iconResId)
            binding.root.setOnClickListener { onToolClick(tool) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ToolViewHolder {
        val binding = ItemToolBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return ToolViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ToolViewHolder, position: Int) {
        holder.bind(tools[position])
    }

    override fun getItemCount(): Int = tools.size
}