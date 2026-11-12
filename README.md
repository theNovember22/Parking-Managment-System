# Parking Management System

A console-based **Parking Management System built in C++** using Object-Oriented Programming principles.

The system supports different vehicle categories, assigns compatible parking slots, creates parking tickets, calculates parking charges, and automatically manages dynamically created vehicle objects using smart pointers.

---

## Features

- Supports **Car**, **Bike**, and **Truck**
- Creates separate parking slots for each vehicle category
- Finds the first compatible and available parking slot
- Prevents the same vehicle from being parked twice
- Generates a unique ticket for every parked vehicle
- Records vehicle entry and exit time
- Calculates parking fees based on hourly rates
- Displays available and occupied parking slots
- Automatically manages vehicle memory using `std::unique_ptr`

---

## Vehicle Rates

| Vehicle Type | Rate per Hour |
|---|---:|
| Bike | ₹20 |
| Car | ₹50 |
| Truck | ₹150 |

The bill is rounded up to the next complete hour.

For example:

```text
1 hour 10 minutes → charged for 2 hours
2 hours exactly   → charged for 2 hours
```

A minimum charge of one hour is applied.

---

## OOP Concepts Used

### 1. Encapsulation

Each class keeps its internal data private or protected and provides public methods to access or modify it safely.

For example, `ParkingSlot` controls whether a vehicle can be parked instead of allowing outside code to directly change the stored vehicle pointer.

### 2. Abstraction

`Vehicle` is an abstract base class:

```cpp
virtual int getRatePerHour() const = 0;
virtual std::string getName() const = 0;
```

A generic vehicle does not have one fixed parking rate. Therefore, every derived vehicle class must provide its own implementation.

### 3. Inheritance

The following classes inherit from `Vehicle`:

```text
Vehicle
├── Car
├── Bike
└── Truck
```

They reuse common properties such as vehicle number and type.

### 4. Runtime Polymorphism

`ParkingSlot` and `Ticket` work with a base-class pointer:

```cpp
Vehicle* vehicle;
```

This pointer can refer to a `Car`, `Bike`, or `Truck`.

Calling:

```cpp
vehicle->getRatePerHour();
```

automatically invokes the correct derived-class implementation.

### 5. Composition

`ParkingLot` contains multiple parking slots:

```cpp
std::vector<ParkingSlot> slots;
```

A parking lot is composed of parking slots.

### 6. Association

A `Ticket` stores pointers to:

```cpp
Vehicle* vehicle;
ParkingSlot* slot;
```

The ticket connects one specific vehicle with one specific parking slot.

---

## Project Architecture

```text
ParkingLot
│
├── vector<ParkingSlot>
├── activeTickets
└── activeVehicles
        │
        ▼
     Vehicle
   ┌────┼─────┐
   │    │     │
  Car  Bike  Truck
```

---

## Class Responsibilities

### `Vehicle`

Abstract base class that stores common vehicle information.

Responsibilities:

- Store vehicle number
- Store vehicle category
- Provide a common interface for rate and name
- Enable runtime polymorphism

---

### `Car`, `Bike`, and `Truck`

Derived classes that provide vehicle-specific behaviour.

Each class overrides:

```cpp
getRatePerHour()
getName()
```

---

### `ParkingSlot`

Represents one physical parking space.

Responsibilities:

- Store slot ID
- Store the supported vehicle type
- Check whether the slot is available
- Check vehicle compatibility
- Park a vehicle
- Remove a vehicle

A slot is considered available when:

```cpp
parkedVehicle == nullptr
```

---

### `Ticket`

Represents one active parking transaction.

Responsibilities:

- Store ticket ID
- Store the parked vehicle
- Store the assigned slot
- Record entry time
- Record exit time
- Calculate the parking bill

---

### `ParkingLot`

Acts as the main manager of the system.

Responsibilities:

- Add parking slots
- Find a compatible available slot
- Park vehicles
- Create tickets
- Handle vehicle exit
- Calculate bills
- Display available and occupied slots
- Manage vehicle ownership

---

## Data Structures Used

### Vector

```cpp
std::vector<ParkingSlot> slots;
```

Used to store all parking slots and iterate through them when searching for an available slot.

### Unordered Map for Tickets

```cpp
std::unordered_map<std::string, Ticket> activeTickets;
```

Maps a vehicle number to its active parking ticket.

Example:

```text
"RJ22" → Ticket
```

### Unordered Map for Vehicles

```cpp
std::unordered_map<std::string, std::unique_ptr<Vehicle>> activeVehicles;
```

Stores and owns the actual `Car`, `Bike`, or `Truck` object.

Example:

```text
"RJ22" → unique_ptr → Car object
```

---

## Why Smart Pointers Are Used

Vehicles are created dynamically:

```cpp
std::make_unique<Car>("RJ22")
```

The parking lot stores them using:

```cpp
std::unique_ptr<Vehicle>
```

This provides exclusive ownership and automatically deletes the object when it is removed from the map.

Ownership is transferred using:

```cpp
std::move(vehicle)
```

This avoids manual `new` and `delete` operations and prevents memory leaks.

---

## Parking Flow

```text
Vehicle enters
      │
      ▼
ParkingLot::parkVehicle()
      │
      ▼
Check whether vehicle is already parked
      │
      ▼
Find a compatible available slot
      │
      ▼
Park vehicle in the slot
      │
      ▼
Store the vehicle object
      │
      ▼
Create and store a ticket
```

---

## Exit Flow

```text
Vehicle number entered
      │
      ▼
Find active ticket
      │
      ▼
Record exit time
      │
      ▼
Calculate bill
      │
      ▼
Remove vehicle from slot
      │
      ▼
Delete ticket record
      │
      ▼
Delete owned vehicle object automatically
```

---

## Project Structure

```text
Parking-Management-System/
│
├── Vehicle.h
├── Vehicle.cpp
│
├── Car.h
├── Bike.h
├── Truck.h
│
├── ParkingSlot.h
├── ParkingSlot.cpp
│
├── Ticket.h
├── Ticket.cpp
│
├── ParkingLot.h
├── ParkingLot.cpp
│
├── main.cpp
├── CMakeLists.txt
├── .gitignore
└── README.md
```

---

## Build Instructions

### Requirements

- C++17 compatible compiler
- MinGW/GCC, Clang, or MSVC

### Compile using g++

Run this command inside the project folder:

```bash
g++ -std=c++17 main.cpp Vehicle.cpp ParkingSlot.cpp Ticket.cpp ParkingLot.cpp -o parking
```

### Run on Windows PowerShell

```powershell
.\parking.exe
```

### Run on Linux or macOS

```bash
./parking
```

---

## Sample Usage

```cpp
ParkingLot lot;

lot.addSlot(1, VehicleType::Car);
lot.addSlot(2, VehicleType::Car);
lot.addSlot(3, VehicleType::Bike);
lot.addSlot(4, VehicleType::Truck);

lot.parkVehicle(std::make_unique<Car>("RJ22"));
lot.parkVehicle(std::make_unique<Bike>("RJ01"));
lot.parkVehicle(std::make_unique<Truck>("UP15"));
```

---

## Sample Output

```text
Car parked in slot 1
Bike parked in slot 3
Truck parked in slot 4

Available Slots:
Slot 2 is available

Occupied Slots:
Slot 1 occupied by Car RJ22
Slot 3 occupied by Bike RJ01
Slot 4 occupied by Truck UP15

Vehicle RJ22 exited.
Bill: Rs. 50

Available Slots:
Slot 1 is available
Slot 2 is available
```

---

## Billing Logic

The billing function performs the following steps:

```text
1. Select exit time or current time
2. Calculate parking duration in seconds
3. Convert seconds to hours
4. Round upward using ceil()
5. Apply a minimum charge of one hour
6. Multiply by the vehicle's hourly rate
```

Core calculation:

```cpp
int hours = std::max(
    1,
    static_cast<int>(
        std::ceil(seconds / 3600.0)
    )
);

return hours * vehicle->getRatePerHour();
```

---

## Time Complexity

| Operation | Complexity |
|---|---:|
| Find available slot | `O(n)` |
| Find active ticket | Average `O(1)` |
| Find active vehicle | Average `O(1)` |
| Display all slots | `O(n)` |

Here, `n` is the total number of parking slots.

---

## Current Limitations

This is a learning-focused console application. It currently does not include:

- Permanent database storage
- User authentication
- Online slot reservation
- Multiple parking floors
- Different billing slabs
- Graphical user interface
- Thread safety for simultaneous entries
- Payment gateway integration

---

## Possible Future Improvements

- Add multiple parking floors
- Add VIP and electric vehicle slots
- Add reservation support
- Store ticket history in a database
- Add date-based and slab-based billing
- Add a graphical or web-based interface
- Use a better slot-allocation strategy
- Add unit tests
- Add persistent storage using files or SQL

---

## Interview Explanation

A concise explanation of the project:

> I developed a console-based Parking Management System in C++ using Object-Oriented Programming. `Vehicle` is an abstract base class, while `Car`, `Bike`, and `Truck` inherit from it and define their own hourly rates. `ParkingSlot` represents one physical slot and validates vehicle compatibility. `Ticket` stores the vehicle, assigned slot, entry time, exit time, and calculates the bill. `ParkingLot` coordinates the entire system, manages active tickets, owns dynamically created vehicles using `unique_ptr`, and handles parking and exit operations.

---

## Key Learning Outcomes

This project helped me understand:

- Abstract classes
- Pure virtual functions
- Function overriding
- Runtime polymorphism
- Constructor initialization lists
- Header and source file separation
- Raw pointers versus smart pointers
- Ownership using `std::unique_ptr`
- Ownership transfer using `std::move`
- STL containers
- Object relationships in OOP
- Class invariants and validation

---

## Author

**B Bhargav**

GitHub: `theNovember22`
