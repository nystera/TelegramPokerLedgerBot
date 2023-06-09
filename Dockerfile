# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=19.8.1
FROM node:${NODE_VERSION}-slim as base

LABEL fly_launch_runtime="NodeJS"

# NodeJS app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ARG YARN_VERSION=1.22.19
RUN command -v yarn >/dev/null 2>&1 || npm install -g yarn@$YARN_VERSION; \
    if yarn --version | grep -qvi "^$YARN_VERSION"; then npm install -g yarn@$YARN_VERSION; fi
# Logs that yarn install is successful here
RUN echo "Yarn version: $(yarn --version)"

# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential 

# Install node modules
COPY package.json yarn.lock ./
RUN yarn install --production=false --frozen-lockfile

# Copy application code
COPY . .

# Builds the application
RUN yarn run build
#  Check if the build by echoing if /dist exists
RUN echo "Build complete: $(ls -l /app/dist)"

# Remove development dependencies
RUN yarn install --production=true --frozen-lockfile

# Final stage for app image
FROM base as final

# Copy built application and node_modules (with production dependencies only)
COPY --from=build /app/dist /app/dist
COPY --from=build /app/node_modules /app/node_modules
COPY package.json yarn.lock ./

# Start the server by default, this can be overwritten at runtime
CMD [ "yarn", "run", "start" ]
