#include "embedder.hpp"
#include <iostream>
#include <cmath>

namespace nexus {
namespace ai {

Embedder::Embedder() : is_initialized_(false), ort_session_(nullptr) {
}

Embedder::~Embedder() {
    // Cleanup ONNX session
}

void Embedder::initialize(const std::string& model_path) {
    std::cout << "[Embedder] Initializing embedding model from: " << model_path << std::endl;
    // Load ONNX model here
    is_initialized_ = true;
}

std::vector<float> Embedder::embed_text(const std::string& text) {
    if (!is_initialized_) {
        std::cerr << "[Embedder] Error: Engine not initialized." << std::endl;
        return {};
    }

    // Stub logic: return a dummy embedding of size 384 (common for MiniLM)
    // In production, this tokenizes the text and runs the ONNX inference session
    std::vector<float> dummy_emb(384, 0.0f);
    
    // Simple hash-like fill to make the stub vector deterministic based on text length
    float val = static_cast<float>(text.length()) / 100.0f;
    for (size_t i = 0; i < dummy_emb.size(); ++i) {
        dummy_emb[i] = val * static_cast<float>(i % 10) / 10.0f;
    }

    return dummy_emb;
}

float Embedder::compute_similarity(const std::vector<float>& emb1, const std::vector<float>& emb2) {
    if (emb1.size() != emb2.size() || emb1.empty()) {
        return 0.0f;
    }

    float dot_product = 0.0f;
    float norm1 = 0.0f;
    float norm2 = 0.0f;

    for (size_t i = 0; i < emb1.size(); ++i) {
        dot_product += emb1[i] * emb2[i];
        norm1 += emb1[i] * emb1[i];
        norm2 += emb2[i] * emb2[i];
    }

    if (norm1 == 0.0f || norm2 == 0.0f) {
        return 0.0f;
    }

    return dot_product / (std::sqrt(norm1) * std::sqrt(norm2));
}

} // namespace ai
} // namespace nexus
