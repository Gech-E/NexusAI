#include <vector>
#include <cstdint>
#include <algorithm>
#include <cmath>
#include <iostream>

namespace nexus { namespace ai {

/// Quantize FP32 tensor to INT8 with scale factor
struct QuantizedTensor {
    std::vector<int8_t> data;
    float scale;
    int8_t zero_point;
};

QuantizedTensor quantize_int8(const std::vector<float>& input) {
    QuantizedTensor qt;
    if (input.empty()) return qt;

    float min_val = *std::min_element(input.begin(), input.end());
    float max_val = *std::max_element(input.begin(), input.end());

    qt.scale = (max_val - min_val) / 255.0f;
    if (qt.scale == 0.0f) qt.scale = 1.0f;
    qt.zero_point = static_cast<int8_t>(std::round(-min_val / qt.scale) - 128);

    qt.data.resize(input.size());
    for (size_t i = 0; i < input.size(); ++i) {
        int32_t quantized = static_cast<int32_t>(std::round(input[i] / qt.scale)) + qt.zero_point;
        qt.data[i] = static_cast<int8_t>(std::clamp(quantized, -128, 127));
    }
    return qt;
}

/// Dequantize INT8 tensor back to FP32
std::vector<float> dequantize_int8(const QuantizedTensor& qt) {
    std::vector<float> output(qt.data.size());
    for (size_t i = 0; i < qt.data.size(); ++i) {
        output[i] = (static_cast<float>(qt.data[i]) - qt.zero_point) * qt.scale;
    }
    return output;
}

/// Quantize to FP16 (stored as uint16_t)
std::vector<uint16_t> quantize_fp16(const std::vector<float>& input) {
    std::vector<uint16_t> output(input.size());
    for (size_t i = 0; i < input.size(); ++i) {
        // IEEE 754 half-precision conversion (simplified)
        uint32_t bits;
        std::memcpy(&bits, &input[i], sizeof(float));
        uint16_t sign = (bits >> 16) & 0x8000;
        int32_t exponent = ((bits >> 23) & 0xFF) - 127 + 15;
        uint16_t mantissa = (bits >> 13) & 0x03FF;

        if (exponent <= 0) { output[i] = sign; }
        else if (exponent >= 31) { output[i] = sign | 0x7C00; }
        else { output[i] = sign | (static_cast<uint16_t>(exponent) << 10) | mantissa; }
    }
    return output;
}

}} // namespace nexus::ai
