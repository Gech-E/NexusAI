pybind11_add_module(nexus_ai_bindings nexus_ai_bindings.cpp)

# Link against the static libraries
target_link_libraries(nexus_ai_bindings PRIVATE recommendation-engine embedding-engine cv-monitor)

