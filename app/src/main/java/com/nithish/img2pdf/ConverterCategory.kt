package com.nithish.img2pdf

import com.nithish.img2pdf.models.ToolModel

data class ConverterCategory(
    val id: Int,
    val title: String,
    val description: String,
    val icon: Int,
    val color: Int,
    val converters: List<ToolModel>
)