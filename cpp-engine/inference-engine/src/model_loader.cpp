#include "inference_engine.hpp"
#include <fstream>
#include <iostream>
#include <filesystem>

namespace nexus { namespace ai {

namespace fs = std::filesystem;

struct ModelMetadata {
    std::string name;
    std::string format;
    size_t file_size;
    bool valid;
};

ModelMetadata validate_model_file(const std::string& path) {
    ModelMetadata meta;
    meta.valid = false;

    if (!fs::exists(path)) {
        std::cerr << "[ModelLoader] File not found: " << path << std::endl;
        return meta;
    }

    meta.file_size = fs::file_size(path);
    meta.name = fs::path(path).stem().string();

    std::string ext = fs::path(path).extension().string();
    if (ext == ".onnx") meta.format = "onnx";
    else if (ext == ".bin" || ext == ".gguf") meta.format = "ggml";
    else if (ext == ".pt" || ext == ".pth") meta.format = "pytorch";
    else meta.format = "unknown";

    // Basic validation: check file isn't empty
    if (meta.file_size > 0) {
        meta.valid = true;
        std::cout << "[ModelLoader] Validated: " << meta.name
                  << " (" << meta.format << ", " << meta.file_size << " bytes)" << std::endl;
    }
    return meta;
}

std::vector<std::string> discover_models(const std::string& directory) {
    std::vector<std::string> models;
    if (!fs::exists(directory) || !fs::is_directory(directory)) {
        std::cerr << "[ModelLoader] Directory not found: " << directory << std::endl;
        return models;
    }
    for (const auto& entry : fs::directory_iterator(directory)) {
        if (entry.is_regular_file()) {
            std::string ext = entry.path().extension().string();
            if (ext == ".onnx" || ext == ".bin" || ext == ".gguf") {
                models.push_back(entry.path().string());
            }
        }
    }
    std::cout << "[ModelLoader] Discovered " << models.size() << " models in " << directory << std::endl;
    return models;
}

}} // namespace nexus::ai
