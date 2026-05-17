#include "recommender.hpp"
#include <cmath>
#include <algorithm>
#include <iostream>

namespace nexus { namespace ai {

/// BKT (Bayesian Knowledge Tracing) adaptive engine
struct KnowledgeState {
    std::string topic_id;
    float p_know;       // probability student knows the skill
    float p_learn;      // probability of learning per opportunity (0.1 default)
    float p_guess;      // probability of guessing correctly (0.25 for 4-choice)
    float p_slip;       // probability of slipping despite knowing (0.1)
};

KnowledgeState create_default_state(const std::string& topic_id) {
    return {topic_id, 0.3f, 0.1f, 0.25f, 0.1f};
}

/// Update knowledge state after an observation (correct/incorrect)
void update_knowledge(KnowledgeState& state, bool correct) {
    float p_correct_know = (1.0f - state.p_slip);
    float p_correct_not = state.p_guess;

    float p_correct = state.p_know * p_correct_know + (1.0f - state.p_know) * p_correct_not;

    float posterior;
    if (correct) {
        posterior = (state.p_know * p_correct_know) / p_correct;
    } else {
        float p_wrong = 1.0f - p_correct;
        posterior = (state.p_know * state.p_slip) / (p_wrong > 0 ? p_wrong : 0.01f);
    }

    // Apply learning transition
    state.p_know = posterior + (1.0f - posterior) * state.p_learn;
    state.p_know = std::clamp(state.p_know, 0.01f, 0.99f);
}

/// Select next best topic based on knowledge states (zone of proximal development)
std::string select_next_topic(const std::vector<KnowledgeState>& states) {
    // Target topics where p_know is between 0.3 and 0.7 (zone of proximal development)
    float best_score = -1.0f;
    std::string best_topic;
    for (const auto& s : states) {
        // Score: highest for p_know near 0.5 (most to learn from)
        float zpd_score = 1.0f - std::abs(s.p_know - 0.5f) * 2.0f;
        if (zpd_score > best_score) {
            best_score = zpd_score;
            best_topic = s.topic_id;
        }
    }
    return best_topic;
}

/// Determine recommended difficulty level
int adaptive_difficulty(float p_know) {
    if (p_know < 0.3f) return 1;       // Easy
    if (p_know < 0.6f) return 2;       // Medium
    if (p_know < 0.85f) return 3;      // Hard
    return 4;                           // Challenge
}

}} // namespace nexus::ai
