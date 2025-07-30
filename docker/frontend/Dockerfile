# ticketing/docker/frontend/Dockerfile

FROM node:20-alpine

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Workdir where Angular app will be created
WORKDIR /app


# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER node

ENTRYPOINT ["/entrypoint.sh"]
CMD ["ng", "serve", "--host", "0.0.0.0"]