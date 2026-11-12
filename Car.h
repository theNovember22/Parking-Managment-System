#ifndef CAR_H
#define CAR_H

#include "Vehicle.h"

#include <string>
#include <utility>

class Car : public Vehicle {
public:
    explicit Car(std::string number)
        : Vehicle(std::move(number), VehicleType::Car) {
    }

    int getRatePerHour() const override {
        return 50;
    }

    std::string getName() const override {
        return "Car";
    }
};

#endif
