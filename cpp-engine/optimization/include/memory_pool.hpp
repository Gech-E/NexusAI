#pragma once
#include <cstddef>
#include <vector>
#include <mutex>

namespace nexus { namespace ai {

class MemoryPool {
public:
    explicit MemoryPool(size_t block_size = 4096, size_t initial_blocks = 16);
    ~MemoryPool();
    void* allocate();
    void deallocate(void* ptr);
    size_t allocated_count() const { return allocated_; }
    size_t block_size() const { return block_size_; }
private:
    size_t block_size_;
    size_t allocated_;
    std::vector<void*> free_list_;
    std::vector<void*> all_blocks_;
    std::mutex mutex_;
    void grow(size_t count);
};

}} // namespace nexus::ai
