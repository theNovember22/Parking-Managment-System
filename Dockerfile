FROM ubuntu:24.04 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN g++ -std=c++17 -O2 -pthread -Iinclude -DASIO_STANDALONE -Wno-deprecated-literal-operator \
    Vehicle.cpp ParkingSlot.cpp Ticket.cpp ParkingLot.cpp server.cpp -o server

FROM ubuntu:24.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    libstdc++6 \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/frontend ./frontend

ENV PORT=8080
EXPOSE 8080

CMD ["./server"]
