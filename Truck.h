#ifndef TRUCK_H
#define TRUCK_H

#include "Vehicle.h"

#include <string>
#include <utility>

class Truck : public Vehicle {
public:
    explicit Truck(std::string number)
        : Vehicle(std::move(number), VehicleType::Truck) {
    }

    int getRatePerHour() const override {
        return 150;
    }

    std::string getName() const override {
        return "Truck";
    }
};

#endif
