# ReelSeat — BookMyShow Replica

A deterministic cinema-booking demonstration built with Vite/React, Express, and persistent SQLite.

## Demo journey
1. Enter any 10+ digit mobile number and verify with OTP `1234`.
2. Select a backend-seeded film and offered theatre.
3. Press **Select Seats** to apply `A1`, `A2`, `A3` at Rs. 450.
4. Choose Card or UPI (dummy fields are never sent or stored), press Pay, and wait exactly two seconds.
5. The backend saves the booking transactionally and the confirmation page renders its response.

## Run locally
```sh
cd backend && npm install && npm start
cd frontend && npm install && npm run dev
```
The Vite server proxies `/api` to port 3000.

## Tests and build
```sh
cd backend && node node_modules/vitest/vitest.mjs run
cd frontend && node node_modules/vitest/vitest.mjs run
cd frontend && node node_modules/vite/bin/vite.js build
```

## Containers
```sh
docker compose up --build -d
```
The frontend is served on `http://localhost:8080`; SQLite persists in the named `booking_data` volume. For production, inject a unique JWT secret and mount durable external storage for the single SQLite writer.
