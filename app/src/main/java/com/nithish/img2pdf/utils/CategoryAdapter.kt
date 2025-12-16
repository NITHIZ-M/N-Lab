package com.nithish.img2pdf.utils

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.nithish.img2pdf.R
import com.nithish.img2pdf.databinding.ItemCategoryBinding
import com.nithish.img2pdf.models.CategoryModel

class CategoryAdapter(
    private val categories: List<CategoryModel>,
    private val onCategoryClick: (CategoryModel) -> Unit,
    private val onToolChipClick: (String) -> Unit
) : RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder>() {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val binding = ItemCategoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CategoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        val category = categories[position]
        holder.bind(category)
    }

    override fun getItemCount() = categories.size

    inner class CategoryViewHolder(private val binding: ItemCategoryBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(category: CategoryModel) {
            binding.categoryTitle.text = binding.root.context.getString(category.titleResId)
            binding.categoryDescription.text = binding.root.context.getString(category.descriptionResId)
            binding.categoryIcon.setImageResource(category.iconResId)
            binding.toolCount.text = "${category.toolCount} tools"

            binding.root.setOnClickListener {
                onCategoryClick(category)
            }
        }
    }
}