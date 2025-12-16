package com.nithish.img2pdf.models

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes

data class CategoryModel(
    val id: String,
    @StringRes val titleResId: Int,
    @DrawableRes val iconResId: Int,
    val toolCount: Int,
    @StringRes val descriptionResId: Int,
    val popularTools: List<ToolModel>
)