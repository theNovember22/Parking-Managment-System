#ifndef TICKET_H
#define TICKET_H

#include "ParkingSlot.h"
#include "Vehicle.h"

#include <chrono>

class Ticket {
private:
    int ticketId;
    Vehicle* vehicle;
    ParkingSlot* slot;

    std::chrono::system_clock::time_point entryTime;
    std::chrono::system_clock::time_point exitTime;

public:
    Ticket(int ticketId, Vehicle* vehicle, ParkingSlot* slot);

    void closeTicket();
    int calculateBill() const;

    int getTicketId() const;

    Vehicle* getVehicle();
    const Vehicle* getVehicle() const;

    ParkingSlot* getSlot();
    const ParkingSlot* getSlot() const;

    std::chrono::system_clock::time_point getEntryTime() const;
    std::chrono::system_clock::time_point getExitTime() const;
};

#endif
