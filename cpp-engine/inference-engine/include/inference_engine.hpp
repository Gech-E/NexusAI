#pragma once
#include <string>
#include <vector>
#include <memory>

namespace nexus { namespace ai {

struct InferenceResult {
    std::vector<float> output;
    float latency_ms;
    bool success;
};

class InferenceEngine {
public:
    InferenceEngine();
    ~InferenceEngine();
    bool load_model(const std::string& model_path, const std::string& format = "onnx");
    InferenceResult run(const std::vector<float>& input, const std::vector<int64_t>& shape);
    bool is_loaded() const { return is_loaded_; }
    std::string get_model_info() const;
    void set_threads(int num_threads);
private:
    bool is_loaded_;
    int num_threads_;
    std::string model_path_;
    std::string model_format_;
};

}} // namespace nexus::ai
