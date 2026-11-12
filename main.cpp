#include "Bike.h"
#include "Car.h"
#include "ParkingLot.h"
#include "Truck.h"

#include <memory>

int main() {
    ParkingLot lot;

    // Add all slots before parking vehicles so pointers to vector elements
    // remain stable for this simple project.
    lot.addSlot(1, VehicleType::Car);
    lot.addSlot(2, VehicleType::Car);
    lot.addSlot(3, VehicleType::Bike);
    lot.addSlot(4, VehicleType::Truck);

    lot.parkVehicle(std::make_unique<Car>("RJ22"));
    lot.parkVehicle(std::make_unique<Bike>("RJ01"));
    lot.parkVehicle(std::make_unique<Truck>("UP15"));

    lot.displayAvailableSlots();
    lot.displayOccupiedSlots();

    lot.exitVehicle("RJ22");

    lot.displayAvailableSlots();
    lot.displayOccupiedSlots();

    return 0;
}
