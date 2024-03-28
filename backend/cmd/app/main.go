package main

import (
	"Typecode-Registry/internal/data"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type config struct {
	port int
	dns  string // dated name service => db connection string.
}

type application struct {
	config config
	logger *log.Logger
	models data.Models
}

func parseArgs() config {
	var cfg config

	flag.IntVar(&cfg.port, "port", 8080, "API server port")
	flag.StringVar(&cfg.dns, "db-dns", os.Getenv("TYPECODEREGISTRY_DB_DSN"), "PostgreSQL DSN")
	flag.Parse()
	return cfg
}

func main() {
	PrintHeader()

	cfg := parseArgs()
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)
	db, err := sql.Open("postgres", cfg.dns)
	if err != nil {
		logger.Fatal(err)
		return
	}

	defer func(db *sql.DB, logger *log.Logger) {
		err := db.Close()
		if err != nil {

			logger.Fatal(err)
		}
	}(db, logger)

	err = db.Ping()
	if err != nil {
		logger.Fatal(err)
	} else {
		logger.Println("database connection pool established")
	}

	app := &application{
		config: cfg,
		logger: logger,
		models: data.NewModels(db),
	}

	app.logger.Printf("API server will start on port %d", app.config.port)

	addr := fmt.Sprintf(":%d", app.config.port)

	server := &http.Server{
		Addr:         addr,
		Handler:      app.route(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	err = server.ListenAndServe()
	app.logger.Fatal(err)
}
