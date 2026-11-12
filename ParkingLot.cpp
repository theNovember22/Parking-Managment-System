#include "ParkingLot.h"

#include <algorithm>
#include <chrono>
#include <ctime>
#include <iostream>
#include <utility>

const char* ParkingLot::vehicleTypeToString(VehicleType type) {
    switch (type) {
        case VehicleType::Car:
            return "Car";
        case VehicleType::Bike:
            return "Bike";
        case VehicleType::Truck:
            return "Truck";
    }

    return "Unknown";
}

VehicleType ParkingLot::stringToVehicleType(const std::string& typeStr) {
    if (typeStr == "Bike" || typeStr == "bike" || typeStr == "BIKE") {
        return VehicleType::Bike;
    }
    if (typeStr == "Truck" || typeStr == "truck" || typeStr == "TRUCK") {
        return VehicleType::Truck;
    }
    return VehicleType::Car;
}

std::string ParkingLot::getSlotLabel(int slotId) {
    if (slotId <= 0) return std::to_string(slotId);
    int rowIdx = (slotId - 1) / 4;
    int colIdx = (slotId - 1) % 4 + 1;
    char rowChar = static_cast<char>('A' + rowIdx);
    return std::string(1, rowChar) + std::to_string(colIdx);
}

std::string ParkingLot::formatTimePoint(const std::chrono::system_clock::time_point& tp) {
    auto timeT = std::chrono::system_clock::to_time_t(tp);
    std::tm tmVal{};
    localtime_r(&timeT, &tmVal);
    char buf[32];
    std::strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &tmVal);
    return std::string(buf);
}

ParkingLot::ParkingLot()
    : nextTicketId(1) {
}

void ParkingLot::addSlot(int slotId, VehicleType type) {
    std::lock_guard<std::mutex> lock(mtx);
    slots.emplace_back(slotId, type);
}

ParkingSlot* ParkingLot::findAvailableSlotInternal(const Vehicle* vehicle) {
    for (ParkingSlot& slot : slots) {
        if (slot.canPark(vehicle)) {
            return &slot;
        }
    }

    return nullptr;
}

ParkingSlot* ParkingLot::findAvailableSlot(const Vehicle* vehicle) {
    std::lock_guard<std::mutex> lock(mtx);
    return findAvailableSlotInternal(vehicle);
}

ParkResult ParkingLot::parkVehicleApi(std::unique_ptr<Vehicle> vehicle, int targetSlotId) {
    std::lock_guard<std::mutex> lock(mtx);
    ParkResult res;

    if (vehicle == nullptr) {
        res.success = false;
        res.message = "Invalid vehicle.";
        return res;
    }

    const std::string number = vehicle->getNumber();

    if (activeTickets.find(number) != activeTickets.end()) {
        res.success = false;
        res.message = "Vehicle " + number + " is already parked.";
        return res;
    }

    ParkingSlot* slot = nullptr;
    if (targetSlotId > 0) {
        for (ParkingSlot& s : slots) {
            if (s.getSlotId() == targetSlotId) {
                if (!s.isAvailable()) {
                    res.success = false;
                    res.message = "Slot " + getSlotLabel(targetSlotId) + " is already occupied.";
                    return res;
                }
                if (!s.canPark(vehicle.get())) {
                    res.success = false;
                    res.message = "Slot " + getSlotLabel(targetSlotId) + " is reserved for " +
                                  vehicleTypeToString(s.getSlotType()) + "s.";
                    return res;
                }
                slot = &s;
                break;
            }
        }
        if (slot == nullptr) {
            res.success = false;
            res.message = "Slot " + std::to_string(targetSlotId) + " does not exist.";
            return res;
        }
    } else {
        slot = findAvailableSlotInternal(vehicle.get());
    }

    if (slot == nullptr) {
        res.success = false;
        res.message = "No suitable slot is available for " + vehicle->getName() + " (" + number + ").";
        return res;
    }

    Vehicle* rawVehicle = vehicle.get();

    if (!slot->parkVehicle(rawVehicle)) {
        res.success = false;
        res.message = "Unable to park vehicle " + number + ".";
        return res;
    }

    int ticketId = nextTicketId++;
    res.success = true;
    res.slotId = slot->getSlotId();
    res.slotLabel = getSlotLabel(slot->getSlotId());
    res.ticketId = ticketId;
    res.vehicleNumber = number;
    res.vehicleType = rawVehicle->getName();
    res.ratePerHour = rawVehicle->getRatePerHour();
    res.message = rawVehicle->getName() + " " + number + " parked in slot " +
                  res.slotLabel + " (Slot " + std::to_string(res.slotId) + ").";

    activeVehicles.emplace(number, std::move(vehicle));
    activeTickets.emplace(
        number,
        Ticket(ticketId, rawVehicle, slot)
    );

    return res;
}

bool ParkingLot::parkInSlotInternal(std::unique_ptr<Vehicle> vehicle, int targetSlotId) {
    if (!vehicle) return false;

    ParkingSlot* targetSlot = nullptr;
    for (ParkingSlot& slot : slots) {
        if (slot.getSlotId() == targetSlotId) {
            targetSlot = &slot;
            break;
        }
    }

    if (!targetSlot || !targetSlot->canPark(vehicle.get())) {
        return false;
    }

    const std::string number = vehicle->getNumber();
    if (activeTickets.find(number) != activeTickets.end()) {
        return false;
    }

    Vehicle* rawVehicle = vehicle.get();
    if (!targetSlot->parkVehicle(rawVehicle)) {
        return false;
    }

    int ticketId = nextTicketId++;
    activeVehicles.emplace(number, std::move(vehicle));
    activeTickets.emplace(number, Ticket(ticketId, rawVehicle, targetSlot));
    return true;
}

bool ParkingLot::parkInSlot(std::unique_ptr<Vehicle> vehicle, int targetSlotId) {
    std::lock_guard<std::mutex> lock(mtx);
    return parkInSlotInternal(std::move(vehicle), targetSlotId);
}

bool ParkingLot::parkVehicle(std::unique_ptr<Vehicle> vehicle) {
    ParkResult res = parkVehicleApi(std::move(vehicle));
    std::cout << res.message << "\n";
    return res.success;
}

ExitResult ParkingLot::exitVehicleApi(const std::string& vehicleNumber) {
    std::lock_guard<std::mutex> lock(mtx);
    ExitResult res;

    auto ticketIt = activeTickets.find(vehicleNumber);

    if (ticketIt == activeTickets.end()) {
        res.success = false;
        res.message = "Vehicle " + vehicleNumber + " is not parked.";
        return res;
    }

    Ticket& ticket = ticketIt->second;
    ticket.closeTicket();

    const int bill = ticket.calculateBill();
    ParkingSlot* slot = ticket.getSlot();
    slot->removeVehicle();

    res.success = true;
    res.vehicleNumber = vehicleNumber;
    res.ticketId = ticket.getTicketId();
    res.slotId = slot->getSlotId();
    res.slotLabel = getSlotLabel(slot->getSlotId());
    res.bill = bill;
    if (ticket.getVehicle() != nullptr) {
        res.vehicleType = ticket.getVehicle()->getName();
    }

    auto duration = ticket.getExitTime() - ticket.getEntryTime();
    res.durationSeconds = static_cast<double>(
        std::chrono::duration_cast<std::chrono::seconds>(duration).count()
    );

    res.message = "Vehicle " + vehicleNumber + " exited from slot " +
                  res.slotLabel + " (Slot " + std::to_string(slot->getSlotId()) +
                  ").\nBill: Rs. " + std::to_string(bill);

    activeTickets.erase(ticketIt);
    activeVehicles.erase(vehicleNumber);

    return res;
}

bool ParkingLot::exitVehicle(const std::string& vehicleNumber) {
    ExitResult res = exitVehicleApi(vehicleNumber);
    std::cout << res.message << "\n";
    return res.success;
}

std::vector<SlotInfo> ParkingLot::getSlotsInfo() const {
    std::lock_guard<std::mutex> lock(mtx);
    std::vector<SlotInfo> result;
    result.reserve(slots.size());

    auto now = std::chrono::system_clock::now();

    for (const ParkingSlot& slot : slots) {
        SlotInfo info;
        info.slotId = slot.getSlotId();
        info.slotLabel = getSlotLabel(slot.getSlotId());
        info.type = vehicleTypeToString(slot.getSlotType());
        info.isAvailable = slot.isAvailable();

        if (!slot.isAvailable() && slot.getVehicle() != nullptr) {
            info.hasVehicle = true;
            const Vehicle* veh = slot.getVehicle();
            info.ticket.vehicleNumber = veh->getNumber();
            info.ticket.vehicleType = veh->getName();
            info.ticket.ratePerHour = veh->getRatePerHour();
            info.ticket.slotId = slot.getSlotId();
            info.ticket.slotLabel = info.slotLabel;

            auto it = activeTickets.find(veh->getNumber());
            if (it != activeTickets.end()) {
                const Ticket& ticket = it->second;
                info.ticket.ticketId = ticket.getTicketId();
                info.ticket.currentBill = ticket.calculateBill();
                info.ticket.durationSeconds = std::chrono::duration_cast<std::chrono::seconds>(
                    now - ticket.getEntryTime()
                ).count();
                info.ticket.entryTime = formatTimePoint(ticket.getEntryTime());
            }
        }

        result.push_back(std::move(info));
    }

    return result;
}

std::vector<TicketInfo> ParkingLot::getTicketsInfo() const {
    std::lock_guard<std::mutex> lock(mtx);
    std::vector<TicketInfo> result;
    result.reserve(activeTickets.size());

    auto now = std::chrono::system_clock::now();

    for (const auto& pair : activeTickets) {
        const Ticket& ticket = pair.second;
        TicketInfo t;
        t.ticketId = ticket.getTicketId();

        if (ticket.getVehicle() != nullptr) {
            t.vehicleNumber = ticket.getVehicle()->getNumber();
            t.vehicleType = ticket.getVehicle()->getName();
            t.ratePerHour = ticket.getVehicle()->getRatePerHour();
        } else {
            t.vehicleNumber = pair.first;
            t.vehicleType = "Unknown";
        }

        if (ticket.getSlot() != nullptr) {
            t.slotId = ticket.getSlot()->getSlotId();
            t.slotLabel = getSlotLabel(t.slotId);
        }

        t.currentBill = ticket.calculateBill();
        t.durationSeconds = std::chrono::duration_cast<std::chrono::seconds>(
            now - ticket.getEntryTime()
        ).count();
        t.entryTime = formatTimePoint(ticket.getEntryTime());

        result.push_back(std::move(t));
    }

    std::sort(result.begin(), result.end(), [](const TicketInfo& a, const TicketInfo& b) {
        return a.ticketId < b.ticketId;
    });

    return result;
}

ParkingStats ParkingLot::getStats() const {
    std::lock_guard<std::mutex> lock(mtx);
    ParkingStats stats;
    stats.totalSlots = static_cast<int>(slots.size());
    stats.cars.ratePerHour = 50;
    stats.bikes.ratePerHour = 20;
    stats.trucks.ratePerHour = 150;

    for (const ParkingSlot& slot : slots) {
        bool isAvail = slot.isAvailable();
        if (isAvail) {
            stats.availableSlots++;
        } else {
            stats.occupiedSlots++;
        }

        switch (slot.getSlotType()) {
            case VehicleType::Car:
                stats.cars.total++;
                if (isAvail) stats.cars.available++;
                else stats.cars.occupied++;
                break;
            case VehicleType::Bike:
                stats.bikes.total++;
                if (isAvail) stats.bikes.available++;
                else stats.bikes.occupied++;
                break;
            case VehicleType::Truck:
                stats.trucks.total++;
                if (isAvail) stats.trucks.available++;
                else stats.trucks.occupied++;
                break;
        }
    }

    return stats;
}

void ParkingLot::resetState(
    const std::vector<std::pair<int, VehicleType>>& newSlots,
    std::vector<std::pair<std::unique_ptr<Vehicle>, int>> initialVehicles
) {
    std::lock_guard<std::mutex> lock(mtx);
    activeTickets.clear();
    activeVehicles.clear();
    slots.clear();
    nextTicketId = 1;

    // Reserve upfront so vector reallocations never invalidate slot pointers in Tickets
    slots.reserve(newSlots.size());
    for (const auto& s : newSlots) {
        slots.emplace_back(s.first, s.second);
    }

    for (auto& item : initialVehicles) {
        parkInSlotInternal(std::move(item.first), item.second);
    }
}

const std::vector<ParkingSlot>& ParkingLot::getSlots() const {
    return slots;
}

const std::unordered_map<std::string, Ticket>& ParkingLot::getActiveTickets() const {
    return activeTickets;
}

const Ticket* ParkingLot::getTicket(const std::string& vehicleNumber) const {
    std::lock_guard<std::mutex> lock(mtx);
    auto it = activeTickets.find(vehicleNumber);
    if (it != activeTickets.end()) {
        return &it->second;
    }
    return nullptr;
}

void ParkingLot::displayAvailableSlots() const {
    std::lock_guard<std::mutex> lock(mtx);
    std::cout << "\nAvailable slots:\n";
    bool found = false;

    for (const ParkingSlot& slot : slots) {
        if (slot.isAvailable()) {
            found = true;
            std::cout << "Slot " << slot.getSlotId()
                      << " (" << vehicleTypeToString(slot.getSlotType())
                      << ")\n";
        }
    }

    if (!found) {
        std::cout << "None\n";
    }
}

void ParkingLot::displayOccupiedSlots() const {
    std::lock_guard<std::mutex> lock(mtx);
    std::cout << "\nOccupied slots:\n";
    bool found = false;

    for (const ParkingSlot& slot : slots) {
        const Vehicle* vehicle = slot.getVehicle();

        if (vehicle != nullptr) {
            found = true;
            std::cout << "Slot " << slot.getSlotId()
                      << " -> " << vehicle->getName()
                      << " " << vehicle->getNumber()
                      << "\n";
        }
    }

    if (!found) {
        std::cout << "None\n";
    }
}
