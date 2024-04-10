# Typecode Registry

[![codecov](https://codecov.io/gh/HardCodedCoder/Typecode-Registry/graph/badge.svg?token=99U8FRKVD7)](https://codecov.io/gh/HardCodedCoder/Typecode-Registry)
[![Go Backend CI](https://github.com/HardCodedCoder/Typecode-Registry/actions/workflows/go.yml/badge.svg?branch=main)](https://github.com/HardCodedCoder/Typecode-Registry/actions/workflows/go.yml)
[![Angular Frontend CI](https://github.com/HardCodedCoder/Typecode-Registry/actions/workflows/angular.yml/badge.svg?branch=main)](https://github.com/HardCodedCoder/Typecode-Registry/actions/workflows/angular.yml)

## Overview
The Typecode Registry is a web application developed for NETCONOMY for SAP Commerce projects, ensuring unique Typecode assignments across projects and extensions. It streamlines developers' workflows by providing conflict-free Typecodes, crucial for SAP Commerce's internal type management.

The application is developed by Students of the FH Burgenland `Software Engineering und vernetzte Systeme` program.

## Features
- **Web Service**: Accessible as a web service, ensuring broad compatibility and easy integration.
- **OAuth 2.0 Authentication**: Secures user sessions and data access through Microsoft Entra ID.
- **Automated User and Project Management**: Supports programmatic user assignments to projects with distinct admin roles.
- **Type Management**: Enables both manual and automated (via `items.xml`) Type registrations.
- **Scope-Based Typecode Generation**: Generates Typecodes within specified number ranges based on the Type's scope.
- **Advanced Filtering and Sorting**: Offers robust search capabilities within the Type registry.
- **RESTful API Backend**: Facilitates automation and frontend interaction, developed in Golang.
- **SPA Frontend**: Delivers a seamless user experience through a Single-Page Application developed in Angular.
- **PostgreSQL Database**: Leverages PostgreSQL for data storage, ensuring reliability and performance.

## Getting Started

### Prerequisites
- **Golang**: Ensure you have Golang installed for backend development. Visit [Golang's official site](https://golang.org/dl/) for download and installation instructions.
- **Node.js and npm**: Required for Angular frontend development. Download and install from [Node.js official website](https://nodejs.org/).
- **Angular CLI**: Install Angular CLI via npm with `npm install -g @angular/cli`.
- **PostgreSQL**: Ensure PostgreSQL is installed and running for your database needs. Installation guides can be found on the [PostgreSQL official website](https://www.postgresql.org/download/).

### Backend Setup (Golang)
1. **Clone the Repository**: Clone the project repository to your local machine.

 ```bash
 git clone https://github.com/yourproject/typecode-registry.git
 cd typecode-registry/backend
```

2. **Configure the Environment**: Configure your local environment variables for database connections and any other necessary settings. This typically involves setting up a `.env` file or exporting environment variables directly. For Golang backend development, environment variables like `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are essential for PostgreSQL connections.

3. **Install Dependencies**: Navigate to the backend directory and install the required Golang modules to ensure all dependencies are up to date.

   
 ```bash
 go mod tidy
```

4. **Run the Backend**: To start the backend server, run the main application file. First, ensure you're in the backend directory. Then execute the `go run` command with the path to your server's main file. This action initiates the server, making it listen for requests on the configured port.

 Navigate to your project's backend directory:
 ```bash
 cd path/to/your/backend
```

5. ***Start the Server***:


```bash
go run main.go
```

Watch for console output indicating that the server is running, typically something like "Server listening on port 8080". This confirms that your backend service is up and operational.

### Frontend Setup (Angular)

1. **Navigate to the Frontend Directory**: Change to the directory where your Angular project is located. This is where you will run commands related to Angular CLI and manage your frontend application.

   `cd path/to/typecode-registry/frontend`

2. **Install Dependencies**: The next step is to install the dependencies required by your Angular project. This step ensures all necessary libraries and frameworks specified in your `package.json` are available for development and build processes.

   `npm install`

3. **Environment Configuration**: Set up your Angular application to communicate with the backend by configuring the `environment.ts` file. This file is located under the `src/environments` directory. You will need to specify the backend API URL among other configurations that might be required for your application to run properly.

In `src/environments/environment.ts`, you might have something like:

 ```typescript
 export const environment = {
   production: false,
   apiUrl: 'http://localhost:8080/api'
 };
```

4. **Run the Frontend Development Server**: Fire up your Angular application by starting the Angular development server. The ng serve command compiles the application and launches it in a browser.

```bash
ng serve
```

5. **Access the Application**: With the server running, open your web browser to 'http://localhost:4200' to view the frontend application. It should now be communicating with your backend, allowing you to interact with the full stack of your project.
