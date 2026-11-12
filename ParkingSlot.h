#ifndef PARKING_SLOT_H
#define PARKING_SLOT_H

#include "Vehicle.h"

class ParkingSlot {
private:
    int slotId;
    VehicleType slotType;
    Vehicle* parkedVehicle;

public:
    ParkingSlot(int slotId, VehicleType slotType);

    bool isAvailable() const;
    bool canPark(const Vehicle* vehicle) const;
    bool parkVehicle(Vehicle* vehicle);
    Vehicle* removeVehicle();

    int getSlotId() const;
    VehicleType getSlotType() const;

    Vehicle* getVehicle();
    const Vehicle* getVehicle() const;
};

#endif
