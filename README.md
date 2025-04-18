# Remo - Hardware-Accelerated Remote Desktop

[![CICD](https://github.com/adidharmatoru/remo/actions/workflows/cicd.yml/badge.svg)](https://github.com/adidharmatoru/remo/actions/workflows/cicd.yml)
[![codecov](https://codecov.io/gh/adidharmatoru/remo/branch/master/graph/badge.svg)](https://codecov.io/gh/adidharmatoru/remo)
[![Docker Pulls](https://img.shields.io/docker/pulls/adidharmatoru/remo)](https://hub.docker.com/r/adidharmatoru/remo)

Remo is a hardware-accelerated remote desktop solution built with Rust and Nuxt 3. This repository contains the front-end application that provides a seamless user interface.

## Demo

Repository:
The demo repository is available [here](https://github.com/adidharmatoru/remo-windows)

Download:
Download directly from [public demo - latest release](https://github.com/adidharmatoru/remo-windows/releases/download/demo/remo.zip)

## Getting Started

To get started, follow these steps:

### Prerequisites

1. Install Node.js and npm (the package manager) on your system.
2. Create a new directory for your project and navigate to it in your terminal or command prompt.

## Installation

Run the following command to install the dependencies:

```bash
npm install
```

This will install all the necessary dependencies, including Nuxt 3, Vue.js, and other libraries required for the project.

## Development Server

To start the development server, run the following command:

```bash
npm run dev
```

This will start the server on http://localhost:3000, where you can access Remo.

## Docker Compose

You can also run Remo using Docker Compose:

```bash
docker-compose up -d
```

This will build and start the container in detached mode. The application will be available at http://localhost.

## Contributing

We welcome contributions to Remo! If you'd like to contribute, please follow these steps:

1. Fork this repository and make your changes.
2. Open a pull request with your changes.

We'll review your changes and let you know if they're accepted.

## License

Remo is licensed under the MIT License. If you have any questions about the license, please don't hesitate to reach out.
