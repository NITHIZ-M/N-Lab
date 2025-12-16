package com.nithish.img2pdf

data class ConverterOption(
    val id: Int,
    val title: String,
    val fromFormat: String,
    val toFormat: String,
    val icon: Int
)