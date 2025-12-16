package com.nithish.img2pdf

import android.app.Activity
import android.content.ContentValues
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import com.nithish.img2pdf.databinding.FragmentImageToJpgBinding
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class ImageToJpgFragment : Fragment() {

    private var _binding: FragmentImageToJpgBinding? = null
    private val binding get() = _binding!!

    private var selectedImageUri: Uri? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentImageToJpgBinding.inflate(inflater, container, false)

        binding.selectImageButton.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
            startActivityForResult(intent, 200)
        }

        binding.convertToJpgButton.setOnClickListener {
            selectedImageUri?.let {
                viewLifecycleOwner.lifecycleScope.launch {
                    binding.convertToJpgButton.isEnabled = false
                    val bitmap = withContext(Dispatchers.IO) {
                        MediaStore.Images.Media.getBitmap(requireActivity().contentResolver, it)
                    }
                    saveImageToJpg(bitmap)
                    binding.convertToJpgButton.isEnabled = true
                }
            } ?: Toast.makeText(requireContext(), "Please select an image first", Toast.LENGTH_SHORT).show()
        }

        return binding.root
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 200 && resultCode == Activity.RESULT_OK && data != null) {
            selectedImageUri = data.data
            binding.imageViewPreview.setImageURI(selectedImageUri)
        }
    }

    private suspend fun saveImageToJpg(bitmap: Bitmap) = withContext(Dispatchers.IO) {
        val fileName = "Converted_${System.currentTimeMillis()}.jpg"
        var fos: OutputStream? = null

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            requireActivity().contentResolver?.also { resolver ->
                val contentValues = ContentValues().apply {
                    put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                    put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg")
                    put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_PICTURES)
                }
                val imageUri: Uri? = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues)
                fos = imageUri?.let { resolver.openOutputStream(it) }
            }
        } else {
            val imagesDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES)
            val image = File(imagesDir, fileName)
            fos = FileOutputStream(image)
        }

        fos?.use {
            bitmap.compress(Bitmap.CompressFormat.JPEG, 100, it)
            withContext(Dispatchers.Main) {
                Toast.makeText(requireContext(), "Image saved to Pictures folder", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}