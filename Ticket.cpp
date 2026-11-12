#include "Ticket.h"

#include <algorithm>
#include <chrono>
#include <cmath>
#include <stdexcept>

Ticket::Ticket(int ticketId, Vehicle* vehicle, ParkingSlot* slot)
    : ticketId(ticketId),
      vehicle(vehicle),
      slot(slot),
      entryTime(std::chrono::system_clock::now()),
      exitTime() {
    if (vehicle == nullptr || slot == nullptr) {
        throw std::invalid_argument("Ticket requires a valid vehicle and parking slot");
    }
}

void Ticket::closeTicket() {
    if (exitTime == std::chrono::system_clock::time_point()) {
        exitTime = std::chrono::system_clock::now();
    }
}

int Ticket::calculateBill() const {
    auto endTime = (exitTime == std::chrono::system_clock::time_point())
                       ? std::chrono::system_clock::now()
                       : exitTime;

    auto duration = endTime - entryTime;

    double seconds =
        std::chrono::duration_cast<std::chrono::seconds>(duration).count();

    int hours = std::max(
        1,
        static_cast<int>(std::ceil(seconds / 3600.0))
    );

    return hours * vehicle->getRatePerHour();
}

int Ticket::getTicketId() const {
    return ticketId;
}

Vehicle* Ticket::getVehicle() {
    return vehicle;
}

const Vehicle* Ticket::getVehicle() const {
    return vehicle;
}

ParkingSlot* Ticket::getSlot() {
    return slot;
}

const ParkingSlot* Ticket::getSlot() const {
    return slot;
}

std::chrono::system_clock::time_point Ticket::getEntryTime() const {
    return entryTime;
}

std::chrono::system_clock::time_point Ticket::getExitTime() const {
    return exitTime;
}
