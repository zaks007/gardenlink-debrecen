# GardenSpace Backend - Spring Boot

## Overview
This is the Spring Boot backend scaffold for the GardenSpace Community Garden platform.

## Project Structure
```
backend/
├── src/main/java/com/gardenspace/
│   ├── GardenSpaceApplication.java    # Main Spring Boot application
│   ├── controllers/                    # REST API controllers
│   │   ├── GardenController.java
│   │   ├── BookingController.java
│   │   └── UserController.java
│   ├── models/                         # Entity classes
│   │   ├── Garden.java
│   │   ├── Booking.java
│   │   └── User.java
│   ├── repositories/                   # JPA repositories
│   │   ├── GardenRepository.java
│   │   ├── BookingRepository.java
│   │   └── UserRepository.java
│   └── services/                       # Business logic
│       ├── GardenService.java
│       ├── BookingService.java
│       └── UserService.java
├── src/main/resources/
│   └── application.properties          # Spring Boot configuration
└── pom.xml                             # Maven dependencies
```

## API Endpoints

### Gardens
- `GET /api/gardens` - List all gardens
- `GET /api/gardens/{id}` - Get garden by ID
- `POST /api/gardens` - Create new garden (Admin only)
- `PUT /api/gardens/{id}` - Update garden (Admin only)
- `DELETE /api/gardens/{id}` - Delete garden (Admin only)

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Cancel booking

### Users
- `GET /api/users/{id}` - Get user profile
- `GET /api/users/{id}/gardens` - Get gardens owned by user
- `PUT /api/users/{id}` - Update user profile

## Database Schema (from Supabase)

### gardens
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Garden name |
| description | TEXT | Garden description |
| address | TEXT | Physical address |
| latitude | NUMERIC | GPS latitude |
| longitude | NUMERIC | GPS longitude |
| total_plots | INTEGER | Total available plots |
| available_plots | INTEGER | Currently available plots |
| base_price_per_month | NUMERIC | Price in Ft (Hungarian Forints) |
| size_sqm | NUMERIC | Size in square meters |
| amenities | TEXT[] | Array of amenities |
| images | TEXT[] | Array of image URLs |
| owner_id | UUID | Reference to user |

### bookings
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to user |
| garden_id | UUID | Reference to garden |
| start_date | DATE | Booking start |
| end_date | DATE | Booking end |
| duration_months | INTEGER | Duration (1-12 months) |
| total_price | NUMERIC | Total price in Ft |
| status | TEXT | pending/confirmed/cancelled |
| payment_method | TEXT | Last 4 digits of card |

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (same as auth.users) |
| full_name | TEXT | User's display name |
| email | TEXT | User's email |
| avatar_url | TEXT | Profile picture URL |

## Setup Instructions

1. **Prerequisites**
   - Java 17 or higher
   - Maven 3.6+
   - PostgreSQL (or use H2 for development)

2. **Configure Database**
   Update `src/main/resources/application.properties`:
   ```properties
   # For Supabase PostgreSQL
   spring.datasource.url=jdbc:postgresql://db.uezasabzfgfamqruimds.supabase.co:5432/postgres
   spring.datasource.username=postgres
   spring.datasource.password=YOUR_DB_PASSWORD
   
   # Or use H2 for local development
   # spring.datasource.url=jdbc:h2:mem:gardenspace
   # spring.h2.console.enabled=true
   ```

3. **Run the Application**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

4. **Access the API**
   - Base URL: `http://localhost:8080/api`
   - H2 Console (if enabled): `http://localhost:8080/h2-console`

## CORS Configuration
CORS is pre-configured to allow requests from:
- `http://localhost:8080` (Vite dev server)
- `https://*.lovable.app` (Production)

## Notes for Backend Team
- The frontend currently uses Supabase directly for data access
- Backend APIs can be integrated by updating the frontend's API calls
- All prices are in Hungarian Forints (Ft)
- User authentication is handled by Supabase Auth
