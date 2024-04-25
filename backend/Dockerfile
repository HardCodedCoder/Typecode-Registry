# Start with the official Golang image to build the binary.
FROM golang:1.22 as builder

# Set the Current Working Directory inside the container
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# Copy the source code into the container
COPY . .

# Build the Go app
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o myserver cmd/app/*.go

# Start a new stage from scratch
FROM alpine:3.19

# Install CA certificates for secure communications
RUN apk --no-cache add ca-certificates=20240226-r0

WORKDIR /root/

# Copy the Pre-built binary file from the previous stage
COPY --from=builder /app/myserver .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable
CMD ["./myserver"]