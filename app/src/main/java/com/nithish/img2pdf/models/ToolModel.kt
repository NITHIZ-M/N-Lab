package com.nithish.img2pdf.models

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes

data class ToolModel(
    val id: Int,
    @StringRes val nameResId: Int,
    @DrawableRes val iconResId: Int
)