#pragma once
#include <string>
#include <vector>
#include <cstdint>

namespace nexus { namespace ai {

struct SyncRecord {
    std::string entity_type;
    std::string entity_id;
    std::string operation;  // "create", "update", "delete"
    int64_t timestamp_ms;
    std::string payload_hash;
    int version;
};

enum class ConflictStrategy { LAST_WRITE_WINS, MERGE, CLIENT_WINS, SERVER_WINS };

class SyncManager {
public:
    SyncManager();
    void set_strategy(ConflictStrategy strategy);
    std::vector<SyncRecord> compute_delta(
        const std::vector<SyncRecord>& local,
        const std::vector<SyncRecord>& remote
    );
    SyncRecord resolve_conflict(const SyncRecord& local, const SyncRecord& remote);
    std::string compute_hash(const std::string& data);
private:
    ConflictStrategy strategy_;
};

}} // namespace nexus::ai
