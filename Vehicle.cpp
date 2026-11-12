#include "Vehicle.h"

#include <utility>

Vehicle::Vehicle(std::string number, VehicleType type)
    : number(std::move(number)), type(type) {
}

VehicleType Vehicle::getType() const {
    return type;
}

const std::string& Vehicle::getNumber() const {
    return number;
}
