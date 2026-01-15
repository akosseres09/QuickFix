# QuickFix - The Ultimate Ticket Management Solution

QuickFix is a powerful and user-friendly ticket management system designed to streamline your customer support process. Whether you're a small business or a large enterprise, QuickFix provides the tools you need to efficiently manage and resolve customer issues.

## Setup Instructions

In order to get QuickFix up and running on your local machine, please make sure you have the following prerequisites installed:

- Docker
- Git
- An IDE or text editor of your choice

### 1. **Clone the Repository**

```bash
git clone https://github.com/akosseres09/QuickFix.git
```

### 2. **Initialize Docker configuration**

```bash
cd QuickFix/docker
cp .env.example .env
```

And add your own values where <YOUR_VALUE> is indicated.

### 3. **Build and Start Containers**

```bash
docker-compose up --build -d
```

### 4. **Initialize Backend**

Access the backend container via `Docker Desktop` or by running:

```bash
docker exec -it <backend_container_name> /bin/sh
```

Then, run the following commands inside the container:

```bash
composer install
php init
```

### 5. **Access the Application**

To access the QuickFix application, open your web browser and navigate to:

- http://localhost:4200 to access the frontend interface.
- [api.quickfix.test](http://api.quickfix.test) to access the backend API.
  - If you can not reach the backend API, add the following line to your hosts (`/etc/hosts` on Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows) file:
  ```
  127.0.0.1 api.quickfix.test
  ```
