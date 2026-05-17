#pragma once
#include <vector>
#include <cstddef>

namespace nexus { namespace ai {

namespace simd {
    float dot_product(const float* a, const float* b, size_t n);
    void vector_add(const float* a, const float* b, float* out, size_t n);
    void vector_scale(const float* a, float scalar, float* out, size_t n);
    float vector_norm(const float* a, size_t n);
    void softmax(const float* input, float* output, size_t n);
    void relu(const float* input, float* output, size_t n);
}

}} // namespace nexus::ai
