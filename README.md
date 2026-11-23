# ORF 401 Lab 5

A teaching lab for the eCommerce course module **Beyond HTTP**. The code base demonstrates how event-driven integrations can pair reliable TCP control channels with lightweight UDP broadcasts to keep remote clients up to date.

## Run it in the browser

A JavaScript port of the lab runs entirely in the browser and installs as an offline PWA:
<https://princetonuniversity.github.io/ORF-401-BeyondHTTP/>. It simulates the TCP registration and UDP broadcasts,
with adjustable packet loss and a packet log. See [`web/README.md`](web/README.md).

## Project Layout
- `Lab5/` - Swing/AWT client that displays live gate assignments for two partner airlines. It registers itself over TCP and listens for UDP notifications.
- `Lab5_Server/` - Server-side utilities that track subscribed listeners, play back CSV-based destination data, and broadcast periodic updates.
- `web/` - Browser (PWA) version of the lab, deployed to GitHub Pages.

## Architecture Highlights
- **Registration handshake (TCP 8189):** Clients announce their IP and UDP port via `GateInformationBoard.Register()`. The server records each listener in a simple in-memory table and acknowledges with `HELLO`.
- **Status fan-out (UDP 51000+):** `GateReporter` threads synthesize gate changes and fire multicast-style datagrams (`AIRLINE,DEST,SEAT,#,GATE,#`). Clients update their boards on receipt.
- **Interfaces:** All UI code uses Java AWT (`Frame`, `TextArea`, `Canvas`), keeping the lab self-contained and platform-portable.

## Prerequisites
- Java Development Kit (JDK) 8 or later (older AWT APIs generate deprecation warnings on newer JDKs but still run).
- Optional: PNG assets referenced by `Logo` (e.g., `carmoncar.png`, `vanderides.png`). Provide your own images or adjust filenames as needed.

## Quick Start
1. **Compile**
   ```bash
   # Server-side classes
   cd Lab5_Server
   javac *.java

   # Client-side classes
   cd ../Lab5
   javac *.java
   ```
2. **Run the server** (one per airline/port)
   ```bash
   cd ../Lab5_Server
   java GateReportingSystem CarmonCar
   ```
   - The argument seeds the airline name embedded in outbound messages.
   - Server listens for registrations on TCP 8189 and sends UDP bursts from an ephemeral port.
3. **Run the client**
   ```bash
   cd ../Lab5
   java GateKeeper
   ```
   - `GateKeeper` launches two boards (one per airline). Adjust hard-coded IP addresses (e.g., set to `127.0.0.1`) to match your local setup.

> **Note:** When running everything locally, update `GateKeeper` to use your machine's IP and align UDP port numbers (`51000`, `51001`, etc.) with those emitted by the servers you start.

## Testing & Exploration Ideas
- Switch to localhost networking and observe messages in Wireshark to highlight TCP vs. UDP behavior.
- Add a third airline by cloning the `GateInformationBoard` and launching another `GateReportingSystem` instance on a new UDP port.
- Extend `GateReporter` to read real schedule data or integrate with a RESTful feed, then compare the push model with polling over HTTP.

## Educational Themes
- Moving "beyond HTTP" by showcasing lighter-weight protocols for real-time updates.
- Managing stateful subscriptions without heavy infrastructure (simple socket registry).
- Understanding the trade-offs between delivery guarantees (TCP) and latency (UDP).

## Attribution
Original materials prepared for Princeton University's ORF 401 eCommerce course module on distributed systems. Folder names and class structure align with the Lab 5 assignment.
