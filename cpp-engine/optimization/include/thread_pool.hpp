#pragma once
#include <functional>
#include <vector>
#include <queue>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <future>
#include <atomic>

namespace nexus { namespace ai {

class ThreadPool {
public:
    explicit ThreadPool(size_t num_threads = 0);
    ~ThreadPool();
    template<class F, class... Args>
    auto enqueue(F&& f, Args&&... args) -> std::future<decltype(f(args...))>;
    size_t active_threads() const { return workers_.size(); }
    void shutdown();
private:
    std::vector<std::thread> workers_;
    std::queue<std::function<void()>> tasks_;
    std::mutex queue_mutex_;
    std::condition_variable condition_;
    std::atomic<bool> stop_{false};
};

}} // namespace nexus::ai
