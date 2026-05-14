#include "recommender.hpp"
#include <iostream>
#include <algorithm>

namespace nexus {
namespace ai {

Recommender::Recommender() : is_initialized_(false), ort_session_(nullptr) {
}

Recommender::~Recommender() {
    // Cleanup ONNX session
}

void Recommender::initialize(const std::string& model_path) {
    std::cout << "[Recommender] Initializing model from: " << model_path << std::endl;
    // In a real implementation, you would load the ONNX model here
    is_initialized_ = true;
}

std::vector<Recommendation> Recommender::generate_recommendations(
    const std::string& student_id,
    const std::vector<StudentSkill>& current_skills,
    int top_k
) {
    if (!is_initialized_) {
        std::cerr << "[Recommender] Error: Engine not initialized." << std::endl;
        return {};
    }

    std::vector<Recommendation> results;
    
    // Stub logic: If a skill is below 0.7, recommend a resource for it
    for (const auto& skill : current_skills) {
        if (skill.mastery_level < 0.7f) {
            Recommendation rec;
            rec.resource_id = "res_" + skill.topic_id + "_101";
            rec.topic_id = skill.topic_id;
            rec.score = 1.0f - skill.mastery_level; // Higher priority for lower mastery
            results.push_back(rec);
        }
    }

    // Sort by priority (highest score first)
    std::sort(results.begin(), results.end(), [](const Recommendation& a, const Recommendation& b) {
        return a.score > b.score;
    });

    if (results.size() > static_cast<size_t>(top_k)) {
        results.resize(top_k);
    }

    return results;
}

} // namespace ai
} // namespace nexus
