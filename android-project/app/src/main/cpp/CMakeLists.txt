cmake_minimum_required(VERSION 3.22.1)

project("opus_jni")

add_library(
        ${CMAKE_PROJECT_NAME}
        SHARED
        opus_jni.cpp)

# When adding actual libopus:
# add_subdirectory(libopus)
# target_link_libraries(${CMAKE_PROJECT_NAME} opus)

find_library(
        log-lib
        log)

target_link_libraries(
        ${CMAKE_PROJECT_NAME}
        ${log-lib})
