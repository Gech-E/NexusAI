#include "recommender.hpp"
#include <algorithm>
#include <cmath>
#include <unordered_map>
#include <iostream>

namespace nexus { namespace ai {

/// Item-item collaborative filtering using cosine similarity
struct ItemProfile {
    std::string item_id;
    std::vector<float> ratings;  // per-student ratings
};

float cosine_similarity(const std::vector<float>& a, const std::vector<float>& b) {
    if (a.size() != b.size() || a.empty()) return 0.0f;
    float dot = 0, norm_a = 0, norm_b = 0;
    for (size_t i = 0; i < a.size(); ++i) {
        dot += a[i] * b[i];
        norm_a += a[i] * a[i];
        norm_b += b[i] * b[i];
    }
    float denom = std::sqrt(norm_a) * std::sqrt(norm_b);
    return denom > 0 ? dot / denom : 0.0f;
}

std::vector<std::pair<std::string, float>> find_similar_items(
    const std::string& target_id,
    const std::vector<ItemProfile>& items,
    int top_k
) {
    std::vector<std::pair<std::string, float>> similarities;
    const ItemProfile* target = nullptr;
    for (const auto& item : items) {
        if (item.item_id == target_id) { target = &item; break; }
    }
    if (!target) return {};

    for (const auto& item : items) {
        if (item.item_id == target_id) continue;
        float sim = cosine_similarity(target->ratings, item.ratings);
        if (sim > 0.0f) {
            similarities.push_back({item.item_id, sim});
        }
    }
    std::sort(similarities.begin(), similarities.end(),
              [](const auto& a, const auto& b) { return a.second > b.second; });
    if ((int)similarities.size() > top_k) similarities.resize(top_k);
    return similarities;
}

}} // namespace nexus::ai
