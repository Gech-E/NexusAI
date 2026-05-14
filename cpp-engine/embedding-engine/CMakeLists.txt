add_library(embedding-engine STATIC 
    src/embedder.cpp
)
target_include_directories(embedding-engine PUBLIC include)
