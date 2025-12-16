package com.nithish.img2pdf

import android.app.Activity
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.nithish.img2pdf.databinding.FragmentCompressImageBinding
import java.io.File
import java.io.FileOutputStream

class CompressImageFragment : Fragment() {

    private var _binding: FragmentCompressImageBinding? = null
    private val binding get() = _binding!!

    private var selectedImageUri: Uri? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCompressImageBinding.inflate(inflater, container, false)

        binding.selectImageButton.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
            startActivityForResult(intent, 100)
        }

        binding.compressButton.setOnClickListener {
            selectedImageUri?.let {
                // Compression logic will be added here
                Toast.makeText(requireContext(), "Compression feature coming soon!", Toast.LENGTH_SHORT).show()
            } ?: Toast.makeText(requireContext(), "Please select an image first", Toast.LENGTH_SHORT).show()
        }

        return binding.root
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == 100 && resultCode == Activity.RESULT_OK && data != null) {
            selectedImageUri = data.data
            binding.imageView.setImageURI(selectedImageUri)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}