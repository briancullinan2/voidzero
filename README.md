
# Void Zero

**Void Zero** (`briancullinan2/Void Zero`) is a 3D meta-programming IDE and browser execution environment that combines a WebAssembly-powered rendering core with a modular layout framework, code editing environment, and custom network tunneling protocols.

By marrying a modified WebAssembly engine with TypeScript, Lumino UI docking windows, WebSockets, and SOCKS5 proxy routing, Void Zero allows developers to visualize code in 3D, automate browser interactions, and securely stream local directories or network interfaces directly through browser tabs.

---

## Key Features

* **3D Spatial Code Visualization:** Integrates a WebAssembly-compiled 3D engine (Quake 3 base) directly into the browser viewport to map source structures, metrics, and execution states in 3D space.
* **Dockable Lumino/Ace Editor Interface:** Features a desktop-grade UI using Lumino window docking, hosting multi-tab code editors, live command REPLs, and virtual file trees.
* **PASTA Attribute Metaprogramming:** Uses *Programming with Attributes and Syntax Tree Analysis* (PASTA) to decorate code with meta-directives (`@Template`, `@Framework`) for cross-language generation.
* **Browser-to-Local Network Tunneling:** Supports WebSocket-to-SOCKS5 reverse proxy bridges, enabling Cloudflare Tunnel configurations and browser-based local directory sharing without manual open ports.
* **Quine & Self-Hosting Capabilities:** Includes virtualized file systems and in-memory compilation pipelines that allow the environment to edit, recompile, and inspect its own runtime.

---

## System Requirements

* **Browser:** Chrome/Chromium (v100+) with WebAssembly, WebGL 2.0, and SharedArrayBuffer support.
* **Build Tooling:** WASI SDK (for C/C++ compilation), Node.js, Webpack, TypeScript compiler.
* **Extensions (Optional):** Custom Void Zero Chrome DevTools Extension for automated DOM and network interception.

---

## Core Architecture

Void Zero relies on a three-tiered layout:

1. **Presentation Layer:** Built with TypeScript and Lumino, handling split viewports, Ace editor instances, file tree navigation, and WebGL context mounting.
2. **Execution & Engine Layer:** A C-compiled engine compiled via WASI SDK into WebAssembly (`sys_main.c`) communicating across a JavaScript wrapper bridge (`sys_web.js`).
3. **Network & Proxy Bridge:** Manages WebSocket connections, SOCKS5 proxy layers, and Cloudflare CNAME tunnel routes to mirror local host directories into remote browser tabs.

### High-Level System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      Browser Client (Frontend UI)                      │
 │                                                                        │
 │  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
 │  │   Lumino Workspace    │  │   Ace Editor    │  │ 3D WebGL Canvas  │  │
 │  │ (Docking & Layouts)   │  │ (Code Views)    │  │  (WASM Engine)   │  │
 │  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
 └──────────────┼───────────────────────┼────────────────────┼────────────┘
                │                       │                    │
 ┌──────────────▼───────────────────────▼────────────────────▼────────────┐
 │                      JS Bridge & Systems Layer                         │
 │                                                                        │
 │   ┌───────────────────────┐ ┌───────────────────┐ ┌────────────────┐   │
 │   │ PASTA Attribute Engine│ │ Virtual File Sys  │ │ Network Bridge │   │
 │   │  (components/repl/*)  │ │ (Memory Storage)  │ │ (SOCKS5/Tunnel)│   │
 │   └───────────────────────┘ └───────────────────┘ └───────┬────────┘   │
 └───────────────────────────────────────────────────────────┼────────────┘
                                                             │
 ┌───────────────────────────────────────────────────────────▼────────────┐
 │                     WebAssembly Core & Backend                         │
 │                                                                        │
 │   ┌───────────────────────┐           ┌────────────────────────────┐   │
 │   │  WASI Runtime Engine  │           │  Cloudflare / WebSocket    │   │
 │   │  (sys_main.c)         │           │  Reverse Proxy Host        │   │
 │   └───────────────────────┘           └────────────────────────────┘   │
 └────────────────────────────────────────────────────────────────────────┘

```

---

## Key Components

### WebAssembly Engine

The WASM core delivers high-performance 3D rendering and state calculation within the browser environment. Compiled using the WASI SDK, it communicates directly with JavaScript runtime bridges:

* `engine/wasm/sys_main.c`: Contains core engine entry points, runtime loops, and state management.
* `engine/wasm/sys_web.js`: Serves as the system interface layer, providing implementations for memory mapping, system calls, file I/O, and WebGL context bindings.

### Frontend & Lumino UI System

The visual layer leverages **Lumino** layout containers to create a flexible, dockable IDE experience:

* **3D Game Viewport:** Mounts WebGL contexts directly inside Lumino panel widgets.
* **Code Editor:** Integrates Ace Editor instances featuring custom syntax highlighting and live syntax tree bindings.
* **Virtual File System Explorer:** Navigates in-memory and proxied local filesystems seamlessly.

### PASTA Attribute System

Located in `components/repl/attrib.js`, **PASTA** (*Programming with Attributes and Syntax Tree Analysis*) allows metaprogramming via source annotations:

* Code is decorated with attributes such as `@Template` or `@Framework`.
* The attribute system parses code syntax trees and applies dynamic code transformations, generation, and cross-compilation without modifying underlying language spec.

### Networking & Tunnel Layer

Void Zero bridges isolated browser environments with external networks using dynamic tunneling logic:

* **WebSocket-to-SOCKS5:** Wraps raw socket connections within WebSockets to bypass browser socket restrictions.
* **Directory Sharing:** Maps local directories across browser instances using reverse-proxy connections and Cloudflare tunnel endpoints.

---

## Build & Tooling Systems

The system uses a unified build pipeline orchestrated via standard build scripts and compiler configurations:

| File / Log Target | Description |
| --- | --- |
| `Makefile` | Controls the compilation of C sources via WASI SDK into target WebAssembly binaries. |
| `index.html` | Application bootstrapping shell, loading base scripts, styles, and WASM loaders. |
| `.vscode/targets.log` | Defines build target mappings for WASM, TypeScript, and Webpack passes. |
| `.vscode/dryrun.log` | Debug execution log tracking WASI SDK compilation flags and symbol outputs. |

---

## Technology Stack

| Component | Technology | Description |
| --- | --- | --- |
| **3D Engine** | Quake 3 Engine (WASM Port) | Modified C engine compiled to WebAssembly for spatial code visualization. |
| **UI Framework** | Lumino + TypeScript | Window management framework providing dockable, split-screen panel layouts. |
| **Code Editor** | Ace Editor | Embedded text editor with live syntax analysis and attribute highlighting. |
| **Toolchain** | WASI SDK + Webpack | Toolchain compiling C/C++ to WebAssembly and bundling TypeScript modules. |
| **Metaprogramming** | PASTA Engine | Custom attribute-based system processing syntax trees and templates. |
| **Networking** | WebSockets / SOCKS5 | Transport layer for Cloudflare tunneling and local folder sync over HTTP/WS. |

---

## System Integration & Workflow

1. **Bootstrapping:** `index.html` initializes the Lumino UI layout, and instantiates the WASM module via `sys_web.js`.
2. **File System Mount:** The Virtual File System (VFS) mounts internal assets alongside optional remote directories bound through WebSockets.
3. **Execution & Editing:** The Ace editor syncs code with the PASTA processor. Modifying attributes immediately updates active metaprogramming targets or updates visual elements in the 3D WebGL viewport.
4. **Proxy Sync:** Network traffic or local folder requests route through configured SOCKS5 proxies or Cloudflare tunnel endpoints, giving the client full access to external or local development spaces.

---

## Primary Use Cases

* **Spatial Code Analysis:** Render software architectures, dependency graphs, and code metrics in an interactive 3D spatial world.
* **Metaprogramming & Templating:** Rapidly prototype across languages using PASTA attribute rules and live code generation pipelines.
* **In-Browser Local Directory Sharing:** Expose local development files to isolated browser environments securely using WebSockets and Cloudflare tunnels.
* **Interactive Learning & REPLs:** Experiment with low-level WASM systems, custom layouts, and real-time execution in a self-contained browser workspace.
