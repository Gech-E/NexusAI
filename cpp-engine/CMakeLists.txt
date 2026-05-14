cmake_minimum_required(VERSION 3.20)
project(nexus_cpp_engine VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Build configuration
option(ENABLE_ONNX "Enable ONNX Runtime" OFF)
option(ENABLE_OPENCV "Enable OpenCV for CV Monitor" OFF)
option(ENABLE_PYBIND "Build Python bindings" ON)
option(ENABLE_SIMD "Enable SIMD optimizations" ON)
option(ENABLE_TESTS "Build tests" ON)

# Compiler optimizations
if(ENABLE_SIMD)
    if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
        add_compile_options(-mavx2 -mfma -O3)
    elseif(MSVC)
        add_compile_options(/arch:AVX2 /O2)
    endif()
endif()

# Core library — inference engine
add_library(nexus_inference STATIC
    inference-engine/src/inference_engine.cpp
    inference-engine/src/model_loader.cpp
    inference-engine/src/quantization_utils.cpp
)
target_include_directories(nexus_inference PUBLIC inference-engine/include)

# Recommendation engine
add_library(nexus_recommender STATIC
    recommendation-engine/src/recommender.cpp
    recommendation-engine/src/collaborative_filter.cpp
    recommendation-engine/src/adaptive_engine.cpp
)
target_include_directories(nexus_recommender PUBLIC recommendation-engine/include)
target_link_libraries(nexus_recommender PRIVATE nexus_inference)

# Embedding engine
add_library(nexus_embeddings STATIC
    embedding-engine/src/embedding_generator.cpp
    embedding-engine/src/vector_index.cpp
)
target_include_directories(nexus_embeddings PUBLIC embedding-engine/include)
target_link_libraries(nexus_embeddings PRIVATE nexus_inference)

# CV Monitor
add_library(nexus_cv_monitor STATIC
    cv-monitor/src/cv_monitor.cpp
    cv-monitor/src/face_detector.cpp
    cv-monitor/src/gaze_tracker.cpp
    cv-monitor/src/phone_detector.cpp
    cv-monitor/src/alert_scorer.cpp
)
target_include_directories(nexus_cv_monitor PUBLIC cv-monitor/include)
target_link_libraries(nexus_cv_monitor PRIVATE nexus_inference)

# Sync engine
add_library(nexus_sync STATIC
    sync-engine/src/sync_manager.cpp
    sync-engine/src/conflict_resolver.cpp
)
target_include_directories(nexus_sync PUBLIC sync-engine/include)

# Thread pool / optimization utilities
add_library(nexus_optimization STATIC
    optimization/src/thread_pool.cpp
    optimization/src/memory_pool.cpp
    optimization/src/simd_utils.cpp
)
target_include_directories(nexus_optimization PUBLIC optimization/include)

# ONNX Runtime
if(ENABLE_ONNX)
    find_package(onnxruntime QUIET)
    if(onnxruntime_FOUND)
        target_link_libraries(nexus_inference PRIVATE onnxruntime::onnxruntime)
        target_compile_definitions(nexus_inference PRIVATE NEXUS_HAS_ONNX=1)
    endif()
endif()

# OpenCV
if(ENABLE_OPENCV)
    find_package(OpenCV QUIET COMPONENTS core imgproc highgui dnn)
    if(OpenCV_FOUND)
        target_link_libraries(nexus_cv_monitor PRIVATE ${OpenCV_LIBS})
        target_compile_definitions(nexus_cv_monitor PRIVATE NEXUS_HAS_OPENCV=1)
    endif()
endif()

# Python bindings
if(ENABLE_PYBIND)
    find_package(pybind11 QUIET)
    if(pybind11_FOUND)
        pybind11_add_module(nexus_ai_bindings
            bindings/src/python_bindings.cpp
        )
        target_link_libraries(nexus_ai_bindings PRIVATE
            nexus_inference
            nexus_recommender
            nexus_embeddings
            nexus_cv_monitor
            nexus_sync
            nexus_optimization
        )
    else()
        message(STATUS "pybind11 not found — Python bindings skipped")
    endif()
endif()

# Tests
if(ENABLE_TESTS)
    enable_testing()
    add_subdirectory(tests EXCLUDE_FROM_ALL)
endif()

# Installation
install(TARGETS nexus_inference nexus_recommender nexus_embeddings nexus_cv_monitor nexus_sync nexus_optimization
    LIBRARY DESTINATION lib
    ARCHIVE DESTINATION lib
)
