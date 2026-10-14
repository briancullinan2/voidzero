
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



## Project History


### 10/14/2026

![alt text](<Screenshot 2026-10-14 114608.png>) ![alt text](<Screenshot 2026-10-14 105034.png>) ![alt text](<Screenshot 2026-10-14 114557.png>)


okay, what is this crap? i think it was maybe like 8 years ago i sitting in scottsdale in my house
after removing the middle wall to make open concept and i had this idea. since quake 3 runs in a
browser, i should able to edit it in a browser also. my first attempt i was just going to commit to
github and use their Actions backend, it literally just came out at the time. i had a bunch of code
saved up for like parsing ASTs and i wrote this thing to use XPath and CSS Query selectors on those
code ASTs instead of the way i just got through doing it with mocha and babel and node istanbul
(why is it called that?). i remember making a little editor, a console, and beginning to embed git
wasm that i compiled myself with emscripten by turning off specific features i didn't know how to
use like multithreaded http requests. i was just using it with a musl/FS wrapper at the time. I
figured i would need a proxy server or github API, and then i think it stalled and i went to
redesign the proxy server and "native" wasm inputs for quake3e. i might even still have been on
ioq3 before switching my more awesome build to q3e.

shortly after i mastered the quakejs build and emscripten my friend abe asked if i could help him
start a consulting company. and i just saw this like facial expression face tracking 3D thing come
out so i thought i could use the quake 3 engine for graphics and drop in an HD face model with
skeletal muscles through md5/idm bone model system to mimic emotional reactions and make an
interactive consulting web page/tool. i called this morpheus and i was going to use it to automate
all kinds of things including chrome/selenium data capture. but at the core of that project was
supposed to be this DevTools chrome extension that could run automation scripts on the same window
that you're working in. well, chrome has a rule there is no eval, and no mid-stream code updates to
plugins listed in their store. so i thought a running workaround for that would be, since that's
the whole point of my tool is to be able to write a script and run it in DevTools, i'll just make
my chrome extension a REPL service for the DevTools API and pipe everything from my front end into
my plugin for running like a for() loop. it worked, the browser policies fully allowed it and i got
a proof of concept opening and switching tabs from button clicks on a web page that the extension
had injected its controls into. i first had that idea when i worked at swiftpage and i was going to
call it demonstrable, but i didn't get the actual REPL thing working, the earlier version i merely
worked on the little page injectable widget for monkeying around with the loaded scripts. that
project actually got sidetracked by scraping FAANG data with selenium remotely, and i ended up
putting the whole thing in an AWS service and making 5,000 connections on Linkedin after my father
told me my profile looks bad. whew, that's a lot to take in/put out.


so that's the background. here's the foreground. i've always wanted to do things like, "show me all the functions leading to an FS sink" and this tool will do exactly that with the search widget. i've made a few d3 implementations of this code graph in 2D where the force graph sorts out which nodes gravitate towards each other and minimizes imperfectly the number of overlaps between edge lines. that's cool. now i'm introducing the 3rd version of this, in 3D. i lacked many skills and now i kind of know what to ask for in regards to 3D even though my math is still weak, and obviously the tooling is stellar. i also want to be able to run any language functionally, despite APIs and see like a little stepper program highlight which parts of the program are being used while its running.

here's what the 3D view is, left click orbits, right click horizontally slides between commits, and vertically slides between "nuance", j/k, code file structures and AST, and EVERYTHING will be linked together properly.

#### more goals:

* reverse search index for searching tokens that exist in files
* search database is set up like this, FILE_DATA will contain search index cache files
* A-Z store names will contain colums like 'word', 'count', 'frequency', 'path', so it will be
slightly unnormalized word per path as the key
* AA-ZZ will be stores with the levenstien distance between all other words from all other stores,
precomputed, so i can easily add up the values to sort by relevancy.
* thats 4 tools, search, graph, reverse index, and the llm to convert my prompt to data queries
* i also wante the graph to show changes between commits, have a way to navigate between branches
and merges. and to filter down and highlight search results and connected nodes, like i can easily
see in the graph of the entire codebase everywhere that FS is used. this will make sink and bug
hunting more fun.
* the REPL tool i just wrote about. full force, any language, any environment, using litegraph and
3D to visualize it.
* test runner, same thing as repl but test dir and in 3D. matching the one i made for studysauce in
principal.
* code complexity tool, don't know anything about, maybe like that function length linter i made
and named phil-osophies. wonder where that code went. probably on that drive that died.
* workflow graph will become core for linter based events within the UI, or gitflow actions, or
make file visuals, all fresh and great use cases
* github sources will show code files as if theyve been code genned for xdoc or whatever. like the
jupyter+github view for any repo, download, manage, built in fork clone basically.
* local database will be the fileview version of github sources, instead of showing commit history
like fork the git client, local databases shows code files pretty like in the file explorer grid

