#include "simd_utils.hpp"
#include <cmath>
#include <algorithm>

#ifdef __AVX2__
#include <immintrin.h>
#endif

namespace nexus { namespace ai { namespace simd {

float dot_product(const float* a, const float* b, size_t n) {
    float result = 0.0f;
#ifdef __AVX2__
    size_t i = 0;
    __m256 sum = _mm256_setzero_ps();
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(a + i);
        __m256 vb = _mm256_loadu_ps(b + i);
        sum = _mm256_fmadd_ps(va, vb, sum);
    }
    float tmp[8];
    _mm256_storeu_ps(tmp, sum);
    for (int j = 0; j < 8; ++j) result += tmp[j];
    for (; i < n; ++i) result += a[i] * b[i];
#else
    for (size_t i = 0; i < n; ++i) result += a[i] * b[i];
#endif
    return result;
}

void vector_add(const float* a, const float* b, float* out, size_t n) {
#ifdef __AVX2__
    size_t i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(a + i);
        __m256 vb = _mm256_loadu_ps(b + i);
        _mm256_storeu_ps(out + i, _mm256_add_ps(va, vb));
    }
    for (; i < n; ++i) out[i] = a[i] + b[i];
#else
    for (size_t i = 0; i < n; ++i) out[i] = a[i] + b[i];
#endif
}

void vector_scale(const float* a, float scalar, float* out, size_t n) {
#ifdef __AVX2__
    __m256 vs = _mm256_set1_ps(scalar);
    size_t i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(a + i);
        _mm256_storeu_ps(out + i, _mm256_mul_ps(va, vs));
    }
    for (; i < n; ++i) out[i] = a[i] * scalar;
#else
    for (size_t i = 0; i < n; ++i) out[i] = a[i] * scalar;
#endif
}

float vector_norm(const float* a, size_t n) {
    return std::sqrt(dot_product(a, a, n));
}

void softmax(const float* input, float* output, size_t n) {
    float max_val = *std::max_element(input, input + n);
    float sum = 0.0f;
    for (size_t i = 0; i < n; ++i) {
        output[i] = std::exp(input[i] - max_val);
        sum += output[i];
    }
    for (size_t i = 0; i < n; ++i) output[i] /= sum;
}

void relu(const float* input, float* output, size_t n) {
    for (size_t i = 0; i < n; ++i) output[i] = std::max(0.0f, input[i]);
}

}}} // namespace nexus::ai::simd
