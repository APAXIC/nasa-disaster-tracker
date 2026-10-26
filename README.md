# EONET Watch

**EONET Watch** is a full-stack web application for exploring and monitoring natural events around the world. It combines NASA's Earth Observatory Natural Event Tracker (EONET) data with an interactive map, location-based searches, and personal monitoring tools. Visitors can browse events without an account, while registered users can create watch zones and manage notifications.

The project was developed to explore full-stack application architecture, third-party API integration, geospatial data processing, and deployment. It brings together a React interface, an Express REST API, scheduled data synchronization, PostgreSQL with PostGIS, and containerized backend development.

**Live application:** [EONET Watch](https://nasa-disaster-tracker-1.onrender.com/)

## Features

### Event Exploration

- **Interactive world map:** Explore natural events geographically using Leaflet, with map layers and event markers.
- **NASA EONET integration:** Retrieve natural event data from NASA's EONET API through the backend.
- **Event details:** View event descriptions, categories, dates, locations, and available magnitude or geometry information.
- **Category-based exploration:** Browse events across different types of natural phenomena.
- **Nearby event search:** Find events within a selected radius of a geographic location using PostGIS spatial queries.
- **Event statistics:** View summaries of the events available in the application.

### Personal Monitoring

- **User accounts:** Register, sign in, and sign out.
- **Token-based authentication:** Authenticate API requests using JWT access tokens and refresh-token handling.
- **Watch zones:** Create and manage geographic areas of interest to monitor nearby events.
- **Notifications:** Access notifications associated with monitored events and watch zones.

### Interface and Data Updates

- **Responsive interface:** Navigate the map, sidebar, event information, and account controls across screen sizes.
- **Light and dark themes:** Switch between two interface themes.
- **Scheduled synchronization:** The backend periodically fetches EONET data to keep the local event database updated.
- **Persistent storage:** Store event information and user-specific data in PostgreSQL.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | JavaScript, React, Vite, Tailwind CSS |
| Mapping | Leaflet |
| Backend | Node.js, Express.js |
| Database | PostgreSQL, PostGIS |
| Database access and migrations | Knex.js |
| Authentication | JWT, HTTP-only cookies for refresh-token handling |
| External data | NASA EONET API |
| Scheduled tasks | node-cron |
| Containerization | Docker, Docker Compose |
| Deployment | Render (frontend and backend), Neon (PostgreSQL) |

## How It Works

EONET Watch separates the user interface, API logic, and persistent data storage:

1. **React frontend** renders the map and application controls, requests event data, and provides authenticated monitoring features.
2. **Express API** exposes endpoints for events, authentication, watch zones, and notifications. Controllers handle HTTP requests while services contain reusable application and data-access logic.
3. **EONET synchronization** fetches data from NASA's public API on a schedule (every two hours in the current backend configuration) and updates the local database.
4. **PostgreSQL and PostGIS** store events and their geographic information. Spatial queries make it possible to search for events within a specified distance of a point.
5. **Authentication and user data** allow registered users to maintain their own watch zones and access related notifications.

### Geospatial Event Data

Event records include descriptive metadata and geographic information. PostGIS functions are used to retrieve coordinates and calculate distances between events and search locations. The API also provides event categories and available historical geometry information for map display and event details.

### Deployment

The frontend is deployed as a static site on Render, while the Express backend runs as a separate web service. The production PostgreSQL database is hosted on Neon. Docker Compose is used for local development with the API and a PostGIS-enabled PostgreSQL container.

> **Note:** The application uses free hosting services, so the first request after a period of inactivity may take longer while the backend starts up.

## Possible Future Improvements

- **Country filtering:** Filter events by one or more countries to focus on specific regions.
- **Address-based nearby search:** Search for an address or place name, convert it to coordinates using a geocoding service (such as Google Maps Geocoding API), and find events within a chosen radius.
- **Advanced filters:** Combine event category, date range, status, and location filters.
- **Watch-zone customization:** Add more options for notification preferences and monitoring criteria.
- **Historical analysis:** Expand visualizations of event trends and changes over time.
- **Improved notifications:** Introduce additional delivery options and more granular alert settings.

## Author

- **Andrii Vus**  
  GitHub:  https://github.com/APAXIC  
  LinkedIn:  https://www.linkedin.com/in/andrii-vus/  
  Email:  irishardron@gmail.com

## Data Source

Natural event information is sourced from [NASA EONET](https://eonet.gsfc.nasa.gov/). Event availability, detail, and update frequency depend on the source data.
