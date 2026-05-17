#include "embedder.hpp"
#include <algorithm>
#include <cmath>
#include <iostream>
#include <unordered_map>

namespace nexus { namespace ai {

/// In-memory FAISS-compatible flat vector index
class VectorIndex {
public:
    void add(const std::string& id, const std::vector<float>& embedding) {
        entries_.push_back({id, embedding});
    }

    void clear() { entries_.clear(); }
    size_t size() const { return entries_.size(); }

    /// Brute-force nearest neighbor search (L2 distance)
    std::vector<std::pair<std::string, float>> search(
        const std::vector<float>& query, int top_k
    ) const {
        std::vector<std::pair<std::string, float>> results;
        for (const auto& entry : entries_) {
            float dist = l2_distance(query, entry.embedding);
            results.push_back({entry.id, dist});
        }
        std::sort(results.begin(), results.end(),
                  [](const auto& a, const auto& b) { return a.second < b.second; });
        if ((int)results.size() > top_k) results.resize(top_k);
        return results;
    }

    /// Cosine similarity search
    std::vector<std::pair<std::string, float>> search_cosine(
        const std::vector<float>& query, int top_k
    ) const {
        std::vector<std::pair<std::string, float>> results;
        for (const auto& entry : entries_) {
            float sim = cosine_sim(query, entry.embedding);
            results.push_back({entry.id, sim});
        }
        std::sort(results.begin(), results.end(),
                  [](const auto& a, const auto& b) { return a.second > b.second; });
        if ((int)results.size() > top_k) results.resize(top_k);
        return results;
    }

private:
    struct Entry {
        std::string id;
        std::vector<float> embedding;
    };
    std::vector<Entry> entries_;

    static float l2_distance(const std::vector<float>& a, const std::vector<float>& b) {
        if (a.size() != b.size()) return 1e9f;
        float sum = 0;
        for (size_t i = 0; i < a.size(); ++i) {
            float d = a[i] - b[i];
            sum += d * d;
        }
        return std::sqrt(sum);
    }

    static float cosine_sim(const std::vector<float>& a, const std::vector<float>& b) {
        if (a.size() != b.size() || a.empty()) return 0;
        float dot = 0, na = 0, nb = 0;
        for (size_t i = 0; i < a.size(); ++i) {
            dot += a[i] * b[i];
            na += a[i] * a[i];
            nb += b[i] * b[i];
        }
        float d = std::sqrt(na) * std::sqrt(nb);
        return d > 0 ? dot / d : 0;
    }
};

}} // namespace nexus::ai
