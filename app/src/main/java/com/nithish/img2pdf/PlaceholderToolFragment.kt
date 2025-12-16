package com.nithish.img2pdf

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.nithish.img2pdf.databinding.FragmentPlaceholderToolBinding

class PlaceholderToolFragment : Fragment() {

    private var _binding: FragmentPlaceholderToolBinding? = null
    private val binding get() = _binding!!

    private var toolName: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            toolName = it.getString(ARG_TOOL_NAME)
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPlaceholderToolBinding.inflate(inflater, container, false)
        binding.toolNamePlaceholder.text = "$toolName Coming Soon!"
        return binding.root
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_TOOL_NAME = "tool_name"

        fun newInstance(toolName: String): PlaceholderToolFragment {
            val fragment = PlaceholderToolFragment()
            val args = Bundle()
            args.putString(ARG_TOOL_NAME, toolName)
            fragment.arguments = args
            return fragment
        }
    }
}