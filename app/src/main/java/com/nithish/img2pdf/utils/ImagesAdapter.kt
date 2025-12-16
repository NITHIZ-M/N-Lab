package com.nithish.img2pdf.utils

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.nithish.img2pdf.databinding.ItemImageBinding
import com.nithish.img2pdf.models.ImageModel

class ImagesAdapter(private val images: MutableList<ImageModel>) :
    RecyclerView.Adapter<ImagesAdapter.ImageViewHolder>() {

    inner class ImageViewHolder(val binding: ItemImageBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ImageViewHolder {
        val binding = ItemImageBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ImageViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ImageViewHolder, position: Int) {
        val image = images[position]
        Glide.with(holder.itemView.context)
            .load(image.uri)
            .into(holder.binding.imageView)

        holder.binding.removeButton.setOnClickListener {
            val currentPosition = holder.adapterPosition
            if (currentPosition != RecyclerView.NO_POSITION) {
                images.removeAt(currentPosition)
                notifyItemRemoved(currentPosition)
            }
        }
    }

    override fun getItemCount(): Int {
        return images.size
    }
}
