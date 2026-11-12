#ifndef BIKE_H
#define BIKE_H

#include "Vehicle.h"

#include <string>
#include <utility>

class Bike : public Vehicle {
public:
    explicit Bike(std::string number)
        : Vehicle(std::move(number), VehicleType::Bike) {
    }

    int getRatePerHour() const override {
        return 20;
    }

    std::string getName() const override {
        return "Bike";
    }
};

#endif
