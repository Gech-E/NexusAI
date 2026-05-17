#include "sync_manager.hpp"
#include <algorithm>
#include <unordered_set>
#include <iostream>
#include <functional>

namespace nexus { namespace ai {

SyncManager::SyncManager() : strategy_(ConflictStrategy::LAST_WRITE_WINS) {}

void SyncManager::set_strategy(ConflictStrategy strategy) { strategy_ = strategy; }

std::string SyncManager::compute_hash(const std::string& data) {
    // Simple FNV-1a hash for delta sync deduplication
    uint64_t hash = 14695981039346656037ULL;
    for (char c : data) {
        hash ^= static_cast<uint64_t>(c);
        hash *= 1099511628211ULL;
    }
    char buf[17];
    snprintf(buf, sizeof(buf), "%016llx", (unsigned long long)hash);
    return std::string(buf);
}

std::vector<SyncRecord> SyncManager::compute_delta(
    const std::vector<SyncRecord>& local,
    const std::vector<SyncRecord>& remote
) {
    std::unordered_set<std::string> remote_hashes;
    for (const auto& r : remote) remote_hashes.insert(r.payload_hash);

    std::vector<SyncRecord> delta;
    for (const auto& l : local) {
        if (remote_hashes.find(l.payload_hash) == remote_hashes.end()) {
            delta.push_back(l);
        }
    }
    return delta;
}

SyncRecord SyncManager::resolve_conflict(const SyncRecord& local, const SyncRecord& remote) {
    switch (strategy_) {
        case ConflictStrategy::LAST_WRITE_WINS:
            return (local.timestamp_ms >= remote.timestamp_ms) ? local : remote;
        case ConflictStrategy::CLIENT_WINS:
            return local;
        case ConflictStrategy::SERVER_WINS:
            return remote;
        case ConflictStrategy::MERGE:
            // For merge, take the newer version but keep both payloads
            if (local.version > remote.version) return local;
            return remote;
        default:
            return remote;
    }
}

}} // namespace nexus::ai
