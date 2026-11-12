cmake_minimum_required(VERSION 3.16)
project(ParkingManagementSystem LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(Threads REQUIRED)

add_executable(parking
    main.cpp
    Vehicle.cpp
    ParkingSlot.cpp
    Ticket.cpp
    ParkingLot.cpp
)

add_executable(server
    server.cpp
    Vehicle.cpp
    ParkingSlot.cpp
    Ticket.cpp
    ParkingLot.cpp
)

target_include_directories(server PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_definitions(server PRIVATE ASIO_STANDALONE)
target_link_libraries(server PRIVATE Threads::Threads)

if (MSVC)
    target_compile_options(parking PRIVATE /W4)
    target_compile_options(server PRIVATE /W4)
else()
    target_compile_options(parking PRIVATE -Wall -Wextra -pedantic)
    target_compile_options(server PRIVATE -Wall -Wextra -Wno-deprecated-literal-operator)
endif()
