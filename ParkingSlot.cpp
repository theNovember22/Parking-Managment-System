#include "ParkingSlot.h"

ParkingSlot::ParkingSlot(int slotId, VehicleType slotType)
    : slotId(slotId), slotType(slotType), parkedVehicle(nullptr) {
}

bool ParkingSlot::isAvailable() const {
    return parkedVehicle == nullptr;
}

bool ParkingSlot::canPark(const Vehicle* vehicle) const {
    return vehicle != nullptr &&
           isAvailable() &&
           vehicle->getType() == slotType;
}

bool ParkingSlot::parkVehicle(Vehicle* vehicle) {
    if (!canPark(vehicle)) {
        return false;
    }

    parkedVehicle = vehicle;
    return true;
}

Vehicle* ParkingSlot::removeVehicle() {
    Vehicle* removedVehicle = parkedVehicle;
    parkedVehicle = nullptr;
    return removedVehicle;
}

int ParkingSlot::getSlotId() const {
    return slotId;
}

VehicleType ParkingSlot::getSlotType() const {
    return slotType;
}

Vehicle* ParkingSlot::getVehicle() {
    return parkedVehicle;
}

const Vehicle* ParkingSlot::getVehicle() const {
    return parkedVehicle;
}
