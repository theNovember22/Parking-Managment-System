#ifndef PARKING_LOT_H
#define PARKING_LOT_H

#include "ParkingSlot.h"
#include "Ticket.h"
#include "Vehicle.h"

#include <chrono>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct ParkResult {
    bool success{false};
    int slotId{-1};
    int ticketId{-1};
    std::string slotLabel;
    std::string vehicleNumber;
    std::string vehicleType;
    int ratePerHour{0};
    std::string message;
};

struct ExitResult {
    bool success{false};
    int slotId{-1};
    int ticketId{-1};
    std::string slotLabel;
    std::string vehicleNumber;
    std::string vehicleType;
    int bill{0};
    double durationSeconds{0.0};
    std::string message;
};

struct TicketInfo {
    int ticketId{0};
    std::string vehicleNumber;
    std::string vehicleType;
    int ratePerHour{0};
    int slotId{0};
    std::string slotLabel;
    int currentBill{0};
    long long durationSeconds{0};
    std::string entryTime;
};

struct SlotInfo {
    int slotId{0};
    std::string slotLabel;
    std::string type;
    bool isAvailable{true};
    bool hasVehicle{false};
    TicketInfo ticket;
};

struct TypeStats {
    int total{0};
    int available{0};
    int occupied{0};
    int ratePerHour{0};
};

struct ParkingStats {
    int totalSlots{0};
    int availableSlots{0};
    int occupiedSlots{0};
    TypeStats cars;
    TypeStats bikes;
    TypeStats trucks;
};

class ParkingLot {
private:
    std::vector<ParkingSlot> slots;
    std::unordered_map<std::string, Ticket> activeTickets;
    std::unordered_map<std::string, std::unique_ptr<Vehicle>> activeVehicles;
    int nextTicketId;
    mutable std::mutex mtx;

    ParkingSlot* findAvailableSlotInternal(const Vehicle* vehicle);
    bool parkInSlotInternal(std::unique_ptr<Vehicle> vehicle, int targetSlotId);
    static std::string formatTimePoint(const std::chrono::system_clock::time_point& tp);

public:
    ParkingLot();

    void addSlot(int slotId, VehicleType type);
    ParkingSlot* findAvailableSlot(const Vehicle* vehicle);

    bool parkVehicle(std::unique_ptr<Vehicle> vehicle);
    bool parkInSlot(std::unique_ptr<Vehicle> vehicle, int targetSlotId);
    bool exitVehicle(const std::string& vehicleNumber);

    void displayAvailableSlots() const;
    void displayOccupiedSlots() const;

    // API Query & Thread-safe helpers
    ParkResult parkVehicleApi(std::unique_ptr<Vehicle> vehicle, int targetSlotId = -1);
    ExitResult exitVehicleApi(const std::string& vehicleNumber);

    std::vector<SlotInfo> getSlotsInfo() const;
    std::vector<TicketInfo> getTicketsInfo() const;
    ParkingStats getStats() const;
    void resetState(
        const std::vector<std::pair<int, VehicleType>>& newSlots,
        std::vector<std::pair<std::unique_ptr<Vehicle>, int>> initialVehicles
    );

    const std::vector<ParkingSlot>& getSlots() const;
    const std::unordered_map<std::string, Ticket>& getActiveTickets() const;
    const Ticket* getTicket(const std::string& vehicleNumber) const;

    static std::string getSlotLabel(int slotId);
    static const char* vehicleTypeToString(VehicleType type);
    static VehicleType stringToVehicleType(const std::string& typeStr);
};

#endif
