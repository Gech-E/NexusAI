#pragma once

#include <cstdint>
#include <functional>
#include <memory>
#include <string>
#include <vector>
#include <mutex>
#include <condition_variable>
#include <thread>
#include <queue>
#include <future>

namespace nexus::optimization {

class ThreadPool {
public:
    explicit ThreadPool(size_t num_threads = 0);
    ~ThreadPool();

    ThreadPool(const ThreadPool&) = delete;
    ThreadPool& operator=(const ThreadPool&) = delete;

    template <typename F, typename... Args>
    auto submit(F&& f, Args&&... args) -> std::future<std::invoke_result_t<F, Args...>> {
        using return_type = std::invoke_result_t<F, Args...>;

        auto task = std::make_shared<std::packaged_task<return_type()>>(
            std::bind(std::forward<F>(f), std::forward<Args>(args)...)
        );

        auto result = task->get_future();
        {
            std::unique_lock<std::mutex> lock(queue_mutex_);
            if (stop_) throw std::runtime_error("ThreadPool is stopped");
            tasks_.emplace([task]() { (*task)(); });
        }
        condition_.notify_one();
        return result;
    }

    [[nodiscard]] size_t thread_count() const noexcept { return workers_.size(); }

private:
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex queue_mutex_;
    std::condition_variable condition_;
    bool stop_ = false;
};

class MemoryPool {
public:
    explicit MemoryPool(size_t block_size, size_t initial_blocks = 64);
    ~MemoryPool();

    MemoryPool(const MemoryPool&) = delete;
    MemoryPool& operator=(const MemoryPool&) = delete;

    void* allocate();
    void deallocate(void* ptr);
    [[nodiscard]] size_t block_size() const noexcept { return block_size_; }
    [[nodiscard]] size_t allocated_count() const noexcept { return allocated_; }

private:
    size_t block_size_;
    size_t allocated_ = 0;
    std::vector<void*> free_blocks_;
    std::vector<std::unique_ptr<uint8_t[]>> chunks_;
    std::mutex mutex_;

    void grow(size_t count);
};

namespace simd {
    float dot_product_avx2(const float* a, const float* b, size_t n);
    void vector_add(const float* a, const float* b, float* result, size_t n);
    void vector_scale(const float* input, float scalar, float* output, size_t n);
    float vector_l2_norm(const float* v, size_t n);
    void softmax(const float* input, float* output, size_t n);
} // namespace simd

} // namespace nexus::optimization
