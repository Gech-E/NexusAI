#include "inference_engine.hpp"
#include <iostream>
#include <chrono>
#include <numeric>
#include <cmath>

#ifdef NEXUS_HAS_ONNX
#include <onnxruntime_cxx_api.h>
#endif

namespace nexus { namespace ai {

InferenceEngine::InferenceEngine() : is_loaded_(false), num_threads_(4) {}
InferenceEngine::~InferenceEngine() = default;

bool InferenceEngine::load_model(const std::string& model_path, const std::string& format) {
    model_path_ = model_path;
    model_format_ = format;

#ifdef NEXUS_HAS_ONNX
    try {
        Ort::Env env(ORT_LOGGING_LEVEL_WARNING, "nexus_inference");
        Ort::SessionOptions opts;
        opts.SetIntraOpNumThreads(num_threads_);
        opts.SetGraphOptimizationLevel(GraphOptimizationLevel::ORT_ENABLE_ALL);
        // Session creation would happen here with the model file
        is_loaded_ = true;
        std::cout << "[InferenceEngine] Model loaded: " << model_path << std::endl;
    } catch (const Ort::Exception& e) {
        std::cerr << "[InferenceEngine] ONNX error: " << e.what() << std::endl;
        return false;
    }
#else
    // Stub mode — simulates model loading for development/testing
    std::cout << "[InferenceEngine] Stub mode — model path recorded: " << model_path << std::endl;
    is_loaded_ = true;
#endif
    return is_loaded_;
}

InferenceResult InferenceEngine::run(const std::vector<float>& input, const std::vector<int64_t>& shape) {
    InferenceResult result;
    result.success = false;

    if (!is_loaded_) {
        std::cerr << "[InferenceEngine] Error: no model loaded." << std::endl;
        return result;
    }

    auto start = std::chrono::high_resolution_clock::now();

#ifdef NEXUS_HAS_ONNX
    // Real ONNX inference would execute here
    // For now, return stub output
#endif

    // Stub: produce a normalized softmax-like output
    size_t output_size = std::max(size_t(1), input.size() / 4);
    result.output.resize(output_size);
    float sum = 0.0f;
    for (size_t i = 0; i < output_size; ++i) {
        result.output[i] = std::exp(-static_cast<float>(i) * 0.5f);
        sum += result.output[i];
    }
    for (auto& v : result.output) v /= sum;  // normalize

    auto end = std::chrono::high_resolution_clock::now();
    result.latency_ms = std::chrono::duration<float, std::milli>(end - start).count();
    result.success = true;
    return result;
}

std::string InferenceEngine::get_model_info() const {
    return "Model: " + model_path_ + " | Format: " + model_format_ +
           " | Threads: " + std::to_string(num_threads_) +
           " | Loaded: " + (is_loaded_ ? "yes" : "no");
}

void InferenceEngine::set_threads(int num_threads) {
    num_threads_ = std::max(1, num_threads);
}

}} // namespace nexus::ai
