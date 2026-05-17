#include "cv_monitor.hpp"
#include <algorithm>
#include <cmath>

namespace nexus { namespace ai {

/// Multi-signal alert scorer: combines face, gaze, and phone signals
class AlertScorer {
public:
    struct SignalWeights {
        float no_face = 0.9f;
        float multiple_faces = 0.85f;
        float looking_away = 0.7f;
        float phone_detected = 0.95f;
    };

    struct ScoredAlert {
        std::string alert_type;
        float raw_confidence;
        float weighted_score;
        int severity;  // 1=low, 2=medium, 3=high
    };

    ScoredAlert score(const std::string& alert_type, float confidence) const {
        ScoredAlert sa;
        sa.alert_type = alert_type;
        sa.raw_confidence = confidence;

        float weight = 0.5f;
        if (alert_type == "no_face") weight = weights_.no_face;
        else if (alert_type == "multiple_faces") weight = weights_.multiple_faces;
        else if (alert_type == "looking_away") weight = weights_.looking_away;
        else if (alert_type == "phone_detected") weight = weights_.phone_detected;

        sa.weighted_score = std::clamp(confidence * weight, 0.0f, 1.0f);

        if (sa.weighted_score >= 0.8f) sa.severity = 3;
        else if (sa.weighted_score >= 0.5f) sa.severity = 2;
        else sa.severity = 1;

        return sa;
    }

    /// Aggregate multiple signals into a combined risk score
    float aggregate_risk(const std::vector<ScoredAlert>& alerts) const {
        if (alerts.empty()) return 0.0f;
        float max_score = 0.0f;
        float sum = 0.0f;
        for (const auto& a : alerts) {
            max_score = std::max(max_score, a.weighted_score);
            sum += a.weighted_score;
        }
        // Weighted combination: max signal + average as secondary
        return std::clamp(max_score * 0.7f + (sum / alerts.size()) * 0.3f, 0.0f, 1.0f);
    }

private:
    SignalWeights weights_;
};

}} // namespace nexus::ai
