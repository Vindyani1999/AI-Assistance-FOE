# Stage 1: Build React App
FROM node:20 as build

WORKDIR /app
COPY package*.json ./
RUN npm install

# Build-time environment variables (React needs these before build)
ARG REACT_APP_AUTH_URL
ARG REACT_APP_GUIDENCE_URL
ARG REACT_APP_PLANNER_URL
ARG REACT_APP_HBA_URL
ARG REACT_APP_API_URL
ARG REACT_APP_URL

# Export them so React build can access them
ENV REACT_APP_AUTH_URL=$REACT_APP_AUTH_URL
ENV REACT_APP_GUIDENCE_URL=$REACT_APP_GUIDENCE_URL
ENV REACT_APP_PLANNER_URL=$REACT_APP_PLANNER_URL
ENV REACT_APP_HBA_URL=$REACT_APP_HBA_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_URL=$REACT_APP_URL

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
