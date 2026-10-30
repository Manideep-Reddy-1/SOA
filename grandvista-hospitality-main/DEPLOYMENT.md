# Deploy GrandVista

The frontend is hosted on Netlify and the Spring Boot services are designed to
run as separate Railway services. Only the API Gateway should have a public
domain. Eureka and the four business services should use Railway private
networking.

## 1. Push the repository to GitHub

Push this project to a GitHub repository that Railway can access. Do not commit
`.env` files, database passwords, admin passwords, or JWT secrets.

## 2. Create the Railway project and database

1. Create a Railway project from the GitHub repository.
2. Add a Railway MySQL service and wait until it is healthy.
3. Add one service from the same repository for each module:
   `eureka-server`, `auth-service`, `room-service`, `booking-service`,
   `payment-service`, and `api-gateway`.
4. For every Java service, use the repository root as the build context and set
   its Dockerfile path to `/<module>/Dockerfile`. These Dockerfiles build the
   selected Maven module and its dependencies from the root `pom.xml`.
5. Enable Railway private networking for all six Java services. Create a
   public domain only for `api-gateway`.

Deploy Eureka first. Once Railway assigns its private domain, set
`EUREKA_SERVER_URL` on the other five Java services to
`http://<EUREKA_PRIVATE_DOMAIN>:<EUREKA_PORT>/eureka/`. Use Railway's variable
references for the Eureka service's private domain and `PORT`, rather than
copying a public URL. Set `EUREKA_INSTANCE_HOSTNAME` on each Java service to
that service's own private domain and set `EUREKA_PREFER_IP_ADDRESS=false`.

## 3. Configure MySQL-backed services

On `auth-service`, `room-service`, `booking-service`, and `payment-service`,
reference the MySQL service's Railway variables and set:

```text
DATABASE_URL=jdbc:mysql://<MYSQLHOST>:<MYSQLPORT>/<MYSQLDATABASE>
DATABASE_USERNAME=<MYSQLUSER>
DATABASE_PASSWORD=<MYSQLPASSWORD>
DATABASE_DRIVER_CLASS_NAME=com.mysql.cj.jdbc.Driver
HIBERNATE_DIALECT=org.hibernate.dialect.MySQLDialect
SPRING_H2_CONSOLE_ENABLED=false
EUREKA_SERVER_URL=http://<EUREKA_PRIVATE_DOMAIN>:<EUREKA_PORT>/eureka/
EUREKA_INSTANCE_HOSTNAME=<THIS_SERVICE_PRIVATE_DOMAIN>
EUREKA_PREFER_IP_ADDRESS=false
```

Use Railway's cross-service variable references for the MySQL and Eureka
values. These four services can share the Railway MySQL database; each service
owns separate tables.

Set `SPRING_PROFILES_ACTIVE=prod` on `auth-service` and `api-gateway`. Generate
a strong random `JWT_SECRET` and set the exact same value on both services. On
`auth-service`, also set `INITIAL_ADMIN_EMAIL` and a unique
`INITIAL_ADMIN_PASSWORD` of at least 12 characters. The local demo accounts
are disabled in the `prod` profile, and public registration only creates
regular users.

On `api-gateway`, set:

```text
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://lucky-brioche-900438.netlify.app
```

Railway supplies each service's `PORT`; the Spring services now bind to it.
Deploy and wait for Eureka, Auth, Room, Booking, and Payment to become healthy
before deploying the gateway. The gateway uses Eureka to route requests to the
private services.

## 4. Connect Netlify to the gateway

In the Netlify site's build settings, set:

- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Environment variable:** `VITE_API_BASE_URL` to the public HTTPS URL of the
  Railway API Gateway

Trigger a new Netlify deploy after adding the variable. The frontend's
`public/_redirects` file handles direct navigation and refreshes for React
routes. Production builds no longer fall back to the visitor's `localhost`;
they show an explicit configuration error until the API URL is set.

## Run again after reopening VS Code

The local app is not started just by opening VS Code. From the repository,
choose **Terminal > Run Task > Start GrandVista Hospitality**, or run
`.\start-grandvista.ps1`. Keep the service terminal windows open while using
the local app. The startup script checks service health before starting each
process, so running the task again will reuse healthy services instead of
launching duplicates; it reports an error if a port is occupied by an
unhealthy process. The Maven launcher now resolves Maven from `MAVEN_HOME`,
`PATH`, or the current user's standard Maven tools directory rather than a
machine-specific absolute path.
