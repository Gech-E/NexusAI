#include "thread_pool.hpp"

namespace nexus { namespace ai {

ThreadPool::ThreadPool(size_t num_threads) {
    if (num_threads == 0)
        num_threads = std::thread::hardware_concurrency();
    for (size_t i = 0; i < num_threads; ++i) {
        workers_.emplace_back([this] {
            while (true) {
                std::function<void()> task;
                {
                    std::unique_lock<std::mutex> lock(queue_mutex_);
                    condition_.wait(lock, [this] { return stop_ || !tasks_.empty(); });
                    if (stop_ && tasks_.empty()) return;
                    task = std::move(tasks_.front());
                    tasks_.pop();
                }
                task();
            }
        });
    }
}

ThreadPool::~ThreadPool() { shutdown(); }

void ThreadPool::shutdown() {
    stop_ = true;
    condition_.notify_all();
    for (auto& w : workers_) { if (w.joinable()) w.join(); }
    workers_.clear();
}

template<class F, class... Args>
auto ThreadPool::enqueue(F&& f, Args&&... args) -> std::future<decltype(f(args...))> {
    using ReturnType = decltype(f(args...));
    auto task = std::make_shared<std::packaged_task<ReturnType()>>(
        std::bind(std::forward<F>(f), std::forward<Args>(args)...)
    );
    std::future<ReturnType> result = task->get_future();
    {
        std::unique_lock<std::mutex> lock(queue_mutex_);
        tasks_.emplace([task]() { (*task)(); });
    }
    condition_.notify_one();
    return result;
}

// Explicit instantiation for common types
template std::future<void> ThreadPool::enqueue(std::function<void()>&&);

}} // namespace nexus::ai
