#ifndef VEHICLE_H
#define VEHICLE_H

#include <string>

enum class VehicleType {
    Car,
    Bike,
    Truck
};

class Vehicle {
private:
    std::string number;
    VehicleType type;

public:
    Vehicle(std::string number, VehicleType type);

    virtual int getRatePerHour() const = 0;
    virtual std::string getName() const = 0;

    VehicleType getType() const;
    const std::string& getNumber() const;

    virtual ~Vehicle() = default;
};

#endif
