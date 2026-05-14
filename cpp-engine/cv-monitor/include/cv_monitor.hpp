#pragma once

#include <vector>
#include <string>

namespace nexus {
namespace ai {

struct CVAlert {
    std::string student_id;
    std::string alert_type; // e.g., "multiple_faces", "no_face", "looking_away"
    float confidence;
    long long timestamp_ms;
};

class CVMonitor {
public:
    CVMonitor();
    ~CVMonitor();

    /**
     * Initializes the OpenCV classifiers (e.g., Haar cascades or DNN models).
     */
    void initialize(const std::string& config_path);

    /**
     * Processes a single video frame (provided as a raw byte buffer) and returns any alerts.
     */
    std::vector<CVAlert> process_frame(
        const std::string& student_id,
        const std::vector<unsigned char>& image_buffer,
        int width,
        int height
    );

private:
    bool is_initialized_;
    // Placeholder for cv::CascadeClassifier or cv::dnn::Net
    void* face_classifier_;
};

} // namespace ai
} // namespace nexus
