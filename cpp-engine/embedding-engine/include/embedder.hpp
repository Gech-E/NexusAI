#pragma once

#include <vector>
#include <string>

namespace nexus {
namespace ai {

class Embedder {
public:
    Embedder();
    ~Embedder();

    /**
     * Initializes the embedding engine with the specified ONNX model.
     * e.g., all-MiniLM-L6-v2 in ONNX format.
     */
    void initialize(const std::string& model_path);

    /**
     * Generates a vector embedding for a given text.
     */
    std::vector<float> embed_text(const std::string& text);

    /**
     * Computes cosine similarity between two embeddings.
     */
    float compute_similarity(const std::vector<float>& emb1, const std::vector<float>& emb2);

private:
    bool is_initialized_;
    // Placeholder for ONNX Runtime session pointer
    void* ort_session_; 
};

} // namespace ai
} // namespace nexus
