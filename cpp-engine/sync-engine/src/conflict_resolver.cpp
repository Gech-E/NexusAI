#include "sync_manager.hpp"
#include <algorithm>
#include <iostream>

namespace nexus { namespace ai {

/// CRDT-style conflict resolver for offline-first sync
class ConflictResolver {
public:
    enum class MergeResult { LOCAL_WINS, REMOTE_WINS, MERGED, CONFLICT };

    struct Resolution {
        MergeResult result;
        SyncRecord resolved_record;
        std::string reason;
    };

    Resolution resolve(const SyncRecord& local, const SyncRecord& remote, ConflictStrategy strategy) {
        Resolution res;

        // If hashes match, no conflict
        if (local.payload_hash == remote.payload_hash) {
            res.result = MergeResult::MERGED;
            res.resolved_record = local;
            res.reason = "Identical records — no conflict";
            return res;
        }

        // Delete always wins over update
        if (local.operation == "delete") {
            res.result = MergeResult::LOCAL_WINS;
            res.resolved_record = local;
            res.reason = "Local delete takes precedence";
            return res;
        }
        if (remote.operation == "delete") {
            res.result = MergeResult::REMOTE_WINS;
            res.resolved_record = remote;
            res.reason = "Remote delete takes precedence";
            return res;
        }

        // Apply configured strategy
        switch (strategy) {
            case ConflictStrategy::LAST_WRITE_WINS:
                if (local.timestamp_ms >= remote.timestamp_ms) {
                    res.result = MergeResult::LOCAL_WINS;
                    res.resolved_record = local;
                    res.reason = "Local has newer timestamp";
                } else {
                    res.result = MergeResult::REMOTE_WINS;
                    res.resolved_record = remote;
                    res.reason = "Remote has newer timestamp";
                }
                break;
            case ConflictStrategy::CLIENT_WINS:
                res.result = MergeResult::LOCAL_WINS;
                res.resolved_record = local;
                res.reason = "Client-wins policy";
                break;
            case ConflictStrategy::SERVER_WINS:
                res.result = MergeResult::REMOTE_WINS;
                res.resolved_record = remote;
                res.reason = "Server-wins policy";
                break;
            default:
                res.result = MergeResult::CONFLICT;
                res.resolved_record = remote;
                res.reason = "Unresolved conflict — defaulting to remote";
        }
        return res;
    }
};

}} // namespace nexus::ai
