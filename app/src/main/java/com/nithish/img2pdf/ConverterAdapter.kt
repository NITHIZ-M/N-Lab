package com.nithish.img2pdf

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.nithish.img2pdf.databinding.ItemConverterOptionBinding

class ConverterAdapter(
    private val options: List<ConverterOption>,
    private val onOptionClick: (ConverterOption) -> Unit
) : RecyclerView.Adapter<ConverterAdapter.ViewHolder>() {

    inner class ViewHolder(val binding: ItemConverterOptionBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemConverterOptionBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val option = options[position]
        holder.binding.tvTitle.text = option.title
        holder.binding.ivIcon.setImageResource(option.icon)
        holder.binding.root.setOnClickListener { onOptionClick(option) }
    }

    override fun getItemCount() = options.size
}