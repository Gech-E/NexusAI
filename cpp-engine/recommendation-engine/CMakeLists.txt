add_library(recommendation-engine STATIC 
    src/recommender.cpp
)
target_include_directories(recommendation-engine PUBLIC include)
