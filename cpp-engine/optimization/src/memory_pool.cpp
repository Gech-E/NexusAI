#include "memory_pool.hpp"
#include <cstdlib>

namespace nexus { namespace ai {

MemoryPool::MemoryPool(size_t block_size, size_t initial_blocks)
    : block_size_(block_size), allocated_(0) {
    grow(initial_blocks);
}

MemoryPool::~MemoryPool() {
    for (void* ptr : all_blocks_) std::free(ptr);
}

void MemoryPool::grow(size_t count) {
    for (size_t i = 0; i < count; ++i) {
        void* block = std::malloc(block_size_);
        if (block) {
            all_blocks_.push_back(block);
            free_list_.push_back(block);
        }
    }
}

void* MemoryPool::allocate() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (free_list_.empty()) grow(16);
    if (free_list_.empty()) return nullptr;
    void* ptr = free_list_.back();
    free_list_.pop_back();
    ++allocated_;
    return ptr;
}

void MemoryPool::deallocate(void* ptr) {
    if (!ptr) return;
    std::lock_guard<std::mutex> lock(mutex_);
    free_list_.push_back(ptr);
    --allocated_;
}

}} // namespace nexus::ai
