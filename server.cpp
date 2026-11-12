#ifndef ASIO_STANDALONE
#define ASIO_STANDALONE
#endif
#include "crow_all.h"
#include "ParkingLot.h"
#include "Car.h"
#include "Bike.h"
#include "Truck.h"

#include <cctype>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

// CORS Middleware so frontend or external tools can call APIs from any origin
struct CORSMiddleware {
    struct context {};

    void before_handle(crow::request& /*req*/, crow::response& /*res*/, context& /*ctx*/) {}

    void after_handle(crow::request& req, crow::response& res, context& /*ctx*/) {
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.add_header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
        if (req.method == crow::HTTPMethod::Options) {
            res.code = 204;
        }
    }
};

std::string trimWhitespace(std::string s) {
    while (!s.empty() && std::isspace(static_cast<unsigned char>(s.front()))) {
        s.erase(s.begin());
    }
    while (!s.empty() && std::isspace(static_cast<unsigned char>(s.back()))) {
        s.pop_back();
    }
    return s;
}

void seedDemoLot(ParkingLot& lot) {
    std::vector<std::pair<int, VehicleType>> slots;
    slots.reserve(20);

    // 20 slots: 4 per row (A1..A4, B1..B4, C1..C4, D1..D4, E1..E4)
    for (int i = 1; i <= 12; ++i) {
        slots.emplace_back(i, VehicleType::Car);
    }
    for (int i = 13; i <= 16; ++i) {
        slots.emplace_back(i, VehicleType::Bike);
    }
    for (int i = 17; i <= 20; ++i) {
        slots.emplace_back(i, VehicleType::Truck);
    }

    // Seed 8 occupied slots matching prompt mockup:
    // Total Slots: 20 | Available: 12 | Occupied: 8
    // [A1] 🟢   [A2] 🔴   [A3] 🟢   [A4] 🔴
    // [B1] 🟢   [B2] 🟢   [B3] 🔴   [B4] 🟢
    std::vector<std::pair<std::unique_ptr<Vehicle>, int>> initialVehicles;
    initialVehicles.emplace_back(std::make_unique<Car>("MH-02-CD-2040"), 2);   // A2
    initialVehicles.emplace_back(std::make_unique<Car>("KA-04-GH-4060"), 4);   // A4
    initialVehicles.emplace_back(std::make_unique<Car>("WB-07-MN-7090"), 7);   // B3
    initialVehicles.emplace_back(std::make_unique<Car>("DL-09-XY-1010"), 10);  // C2
    initialVehicles.emplace_back(std::make_unique<Car>("TS-12-ZZ-3030"), 12);  // C4
    initialVehicles.emplace_back(std::make_unique<Bike>("RJ-14-BK-4444"), 14); // D2
    initialVehicles.emplace_back(std::make_unique<Bike>("UP-16-BK-6666"), 16); // D4
    initialVehicles.emplace_back(std::make_unique<Truck>("NL-01-TK-9999"), 18);// E2

    lot.resetState(slots, std::move(initialVehicles));
}

int main(int argc, char* argv[]) {
    int port = 8080;
    if (const char* envPort = std::getenv("PORT")) {
        try {
            int parsed = std::stoi(envPort);
            if (parsed > 0 && parsed <= 65535) {
                port = parsed;
            }
        } catch (...) {
            std::cerr << "Invalid PORT env var. Using default port 8080.\n";
        }
    }
    if (argc > 1) {
        try {
            int parsed = std::stoi(argv[1]);
            if (parsed > 0 && parsed <= 65535) {
                port = parsed;
            }
        } catch (...) {
            std::cerr << "Invalid port argument. Using port " << port << ".\n";
        }
    }

    ParkingLot lot;
    seedDemoLot(lot);

    crow::App<CORSMiddleware> app;

    // OPTIONS preflight handler for any api path
    CROW_ROUTE(app, "/api/<path>")
        .methods(crow::HTTPMethod::Options)
    ([](const crow::request&, crow::response& res, std::string) {
        res.code = 204;
        res.end();
    });

    // 1. GET /api/parking/slots
    CROW_ROUTE(app, "/api/parking/slots").methods(crow::HTTPMethod::Get)
    ([&lot]() {
        auto slotsInfo = lot.getSlotsInfo();
        std::vector<crow::json::wvalue> slotList;
        slotList.reserve(slotsInfo.size());

        for (const auto& info : slotsInfo) {
            crow::json::wvalue s;
            s["slotId"] = info.slotId;
            s["slotLabel"] = info.slotLabel;
            s["type"] = info.type;
            s["isAvailable"] = info.isAvailable;

            if (info.hasVehicle) {
                crow::json::wvalue v;
                v["number"] = info.ticket.vehicleNumber;
                v["type"] = info.ticket.vehicleType;
                v["ratePerHour"] = info.ticket.ratePerHour;
                v["ticketId"] = info.ticket.ticketId;
                v["currentBill"] = info.ticket.currentBill;
                v["durationSeconds"] = info.ticket.durationSeconds;
                v["entryTime"] = info.ticket.entryTime;
                s["vehicle"] = std::move(v);
            } else {
                s["vehicle"] = nullptr;
            }

            slotList.push_back(std::move(s));
        }

        crow::json::wvalue res = std::move(slotList);
        return crow::response(200, res);
    });

    // 2. POST /api/vehicles/park
    CROW_ROUTE(app, "/api/vehicles/park").methods(crow::HTTPMethod::Post)
    ([&lot](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body || !body.has("vehicleNumber") || !body.has("type")) {
            crow::json::wvalue err;
            err["success"] = false;
            err["message"] = "Invalid request format. Required fields: 'vehicleNumber' and 'type'.";
            return crow::response(400, err);
        }

        std::string vehicleNumber = trimWhitespace(body["vehicleNumber"].s());
        std::string typeStr = trimWhitespace(body["type"].s());

        if (vehicleNumber.empty()) {
            crow::json::wvalue err;
            err["success"] = false;
            err["message"] = "Vehicle number cannot be empty.";
            return crow::response(400, err);
        }

        int targetSlotId = -1;
        if (body.has("slotId") && body["slotId"].t() == crow::json::type::Number) {
            targetSlotId = static_cast<int>(body["slotId"].i());
        }

        std::unique_ptr<Vehicle> vehicle;
        if (typeStr == "Bike" || typeStr == "bike" || typeStr == "BIKE") {
            vehicle = std::make_unique<Bike>(vehicleNumber);
        } else if (typeStr == "Truck" || typeStr == "truck" || typeStr == "TRUCK") {
            vehicle = std::make_unique<Truck>(vehicleNumber);
        } else if (typeStr == "Car" || typeStr == "car" || typeStr == "CAR") {
            vehicle = std::make_unique<Car>(vehicleNumber);
        } else {
            crow::json::wvalue err;
            err["success"] = false;
            err["message"] = "Invalid vehicle type: '" + typeStr + "'. Allowed types: Car, Bike, Truck.";
            return crow::response(400, err);
        }

        ParkResult result = lot.parkVehicleApi(std::move(vehicle), targetSlotId);
        crow::json::wvalue res;
        res["success"] = result.success;
        res["message"] = result.message;

        if (result.success) {
            res["slotId"] = result.slotId;
            res["slotLabel"] = result.slotLabel;
            res["ticketId"] = result.ticketId;
            res["vehicleNumber"] = result.vehicleNumber;
            res["vehicleType"] = result.vehicleType;
            res["ratePerHour"] = result.ratePerHour;
            return crow::response(200, res);
        }

        return crow::response(400, res);
    });

    // 3. POST /api/vehicles/exit
    CROW_ROUTE(app, "/api/vehicles/exit").methods(crow::HTTPMethod::Post)
    ([&lot](const crow::request& req) {
        auto body = crow::json::load(req.body);
        if (!body || !body.has("vehicleNumber")) {
            crow::json::wvalue err;
            err["success"] = false;
            err["message"] = "Invalid request format. Required field: 'vehicleNumber'.";
            return crow::response(400, err);
        }

        std::string vehicleNumber = trimWhitespace(body["vehicleNumber"].s());

        if (vehicleNumber.empty()) {
            crow::json::wvalue err;
            err["success"] = false;
            err["message"] = "Vehicle number cannot be empty.";
            return crow::response(400, err);
        }

        ExitResult result = lot.exitVehicleApi(vehicleNumber);
        crow::json::wvalue res;
        res["success"] = result.success;
        res["message"] = result.message;

        if (result.success) {
            res["ticketId"] = result.ticketId;
            res["slotId"] = result.slotId;
            res["slotLabel"] = result.slotLabel;
            res["vehicleNumber"] = result.vehicleNumber;
            res["vehicleType"] = result.vehicleType;
            res["bill"] = result.bill;
            res["durationSeconds"] = result.durationSeconds;
            return crow::response(200, res);
        }

        return crow::response(404, res);
    });

    // 4. GET /api/tickets
    CROW_ROUTE(app, "/api/tickets").methods(crow::HTTPMethod::Get)
    ([&lot]() {
        auto tickets = lot.getTicketsInfo();
        std::vector<crow::json::wvalue> ticketList;
        ticketList.reserve(tickets.size());

        for (const auto& info : tickets) {
            crow::json::wvalue t;
            t["ticketId"] = info.ticketId;
            t["vehicleNumber"] = info.vehicleNumber;
            t["vehicleType"] = info.vehicleType;
            t["ratePerHour"] = info.ratePerHour;
            t["slotId"] = info.slotId;
            t["slotLabel"] = info.slotLabel;
            t["currentBill"] = info.currentBill;
            t["entryTime"] = info.entryTime;
            t["durationSeconds"] = info.durationSeconds;
            ticketList.push_back(std::move(t));
        }

        crow::json::wvalue res = std::move(ticketList);
        return crow::response(200, res);
    });

    // 5. GET /api/stats
    CROW_ROUTE(app, "/api/stats").methods(crow::HTTPMethod::Get)
    ([&lot]() {
        ParkingStats stats = lot.getStats();

        crow::json::wvalue res;
        res["totalSlots"] = stats.totalSlots;
        res["availableSlots"] = stats.availableSlots;
        res["occupiedSlots"] = stats.occupiedSlots;

        crow::json::wvalue carObj;
        carObj["total"] = stats.cars.total;
        carObj["available"] = stats.cars.available;
        carObj["occupied"] = stats.cars.occupied;
        carObj["ratePerHour"] = stats.cars.ratePerHour;
        res["cars"] = std::move(carObj);

        crow::json::wvalue bikeObj;
        bikeObj["total"] = stats.bikes.total;
        bikeObj["available"] = stats.bikes.available;
        bikeObj["occupied"] = stats.bikes.occupied;
        bikeObj["ratePerHour"] = stats.bikes.ratePerHour;
        res["bikes"] = std::move(bikeObj);

        crow::json::wvalue truckObj;
        truckObj["total"] = stats.trucks.total;
        truckObj["available"] = stats.trucks.available;
        truckObj["occupied"] = stats.trucks.occupied;
        truckObj["ratePerHour"] = stats.trucks.ratePerHour;
        res["trucks"] = std::move(truckObj);

        return crow::response(200, res);
    });

    // 6. POST /api/reset (Re-initialize to default demo state)
    CROW_ROUTE(app, "/api/reset").methods(crow::HTTPMethod::Post)
    ([&lot]() {
        seedDemoLot(lot);
        crow::json::wvalue res;
        res["success"] = true;
        res["message"] = "Parking lot reset to initial demo state (20 slots: 12 available, 8 occupied).";
        return crow::response(200, res);
    });

    // 7. GET / - Serves React Frontend Dashboard
    CROW_ROUTE(app, "/")
    ([](crow::response& res) {
        std::ifstream f("frontend/index.html");
        if (f.good()) {
            res.set_static_file_info("frontend/index.html");
        } else {
            std::ifstream f2("index.html");
            if (f2.good()) {
                res.set_static_file_info("index.html");
            } else {
                res.body = "<!DOCTYPE html><html><body><h1>Smart Parking Management System</h1><p>Frontend file not found.</p></body></html>";
                res.set_header("Content-Type", "text/html");
            }
        }
        res.end();
    });

    auto serveSafeFile = [](crow::response& res, const std::string& baseDir, const std::string& filename) {
        if (filename.find("..") != std::string::npos || filename.find('/') != std::string::npos || filename.find('\\') != std::string::npos) {
            res.code = 403;
            res.body = "Forbidden";
            res.end();
            return;
        }
        std::string filePath = baseDir + "/" + filename;
        std::ifstream f(filePath);
        if (f.good()) {
            res.set_static_file_info(filePath);
        } else {
            res.code = 404;
            res.body = "Not found";
        }
        res.end();
    };

    // Serve frontend source files and local fallback image assets
    CROW_ROUTE(app, "/src/<string>")
    ([&serveSafeFile](crow::response& res, std::string filename) {
        serveSafeFile(res, "frontend/src", filename);
    });

    CROW_ROUTE(app, "/assets/<string>")
    ([&serveSafeFile](crow::response& res, std::string filename) {
        serveSafeFile(res, "frontend/assets", filename);
    });

    std::cout << "\n=======================================================\n";
    std::cout << "  Smart Parking Management Server (Crow C++)           \n";
    std::cout << "=======================================================\n";
    std::cout << "  Dashboard URL: http://localhost:" << port << "\n";
    std::cout << "  API Endpoints:\n";
    std::cout << "    GET  http://localhost:" << port << "/api/parking/slots\n";
    std::cout << "    POST http://localhost:" << port << "/api/vehicles/park\n";
    std::cout << "    POST http://localhost:" << port << "/api/vehicles/exit\n";
    std::cout << "    GET  http://localhost:" << port << "/api/tickets\n";
    std::cout << "    GET  http://localhost:" << port << "/api/stats\n";
    std::cout << "    POST http://localhost:" << port << "/api/reset\n";
    std::cout << "=======================================================\n\n";

    app.port(port).multithreaded().run();

    return 0;
}
