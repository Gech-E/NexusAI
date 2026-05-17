#include "cv_monitor.hpp"
#include <cmath>
#include <iostream>

namespace nexus { namespace ai {

class GazeTracker {
public:
    struct GazeResult {
        float yaw;        // horizontal angle (-1 left, 0 center, 1 right)
        float pitch;      // vertical angle (-1 down, 0 center, 1 up)
        bool looking_at_screen;
        float confidence;
    };

    bool initialize(const std::string& model_path) {
        std::cout << "[GazeTracker] Initialized with model: " << model_path << std::endl;
        initialized_ = true;
        return true;
    }

    GazeResult estimate(const std::vector<unsigned char>& face_crop, int w, int h) {
        GazeResult result;
        if (!initialized_) {
            result.yaw = 0; result.pitch = 0;
            result.looking_at_screen = true; result.confidence = 0;
            return result;
        }
        // Stub: estimate based on image characteristics
        // In production, this uses a landmark-based CNN
        result.yaw = 0.0f;
        result.pitch = 0.0f;
        result.confidence = 0.85f;
        // If yaw/pitch are within threshold, student is looking at screen
        result.looking_at_screen = (std::abs(result.yaw) < 0.3f && std::abs(result.pitch) < 0.3f);
        return result;
    }

private:
    bool initialized_ = false;
};

}} // namespace nexus::ai
