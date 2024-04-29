package main

import (
	"Typecode-Registry/internal/data"
	"database/sql"
	"flag"
	"fmt"
	"github.com/rs/zerolog"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

// config holds the configuration for the application.
type config struct {
	port     int
	dns      string // dated name service => db connection string.
	loglevel string
}

// application holds the application-wide dependencies.
type application struct {
	config config
	logger *zerolog.Logger
	models data.Models
}

// parseArgs parses the command-line arguments and returns the configuration.
func parseArgs() config {
	var cfg config

	flag.IntVar(&cfg.port, "port", 8080, "API server port")
	flag.StringVar(&cfg.dns, "db-dns", os.Getenv("TYPECODEREGISTRY_DB_DSN"), "PostgreSQL DSN")
	flag.StringVar(&cfg.loglevel, "loglevel", "info", "Log level (debug, info, warn, error, fatal, panic)")
	flag.Parse()
	return cfg
}

func getLevelFromString(levelStr string) zerolog.Level {
	switch strings.ToLower(levelStr) {
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	case "panic":
		return zerolog.PanicLevel
	default:
		return zerolog.InfoLevel
	}
}

func createLogger(level zerolog.Level) zerolog.Logger {
	colorReset := "\033[0m"

	colorRed := "\033[31m"
	colorGreen := "\033[32m"
	colorYellow := "\033[33m"
	colorBlue := "\033[34m"
	colorMagenta := "\033[35m"
	colorCyan := "\033[36m"
	colorWhite := "\033[37m"

	return zerolog.New(zerolog.ConsoleWriter{
		Out:        os.Stderr,
		TimeFormat: time.RFC3339,
		FormatLevel: func(i interface{}) string {
			var levelColor string
			switch strings.ToLower(fmt.Sprintf("%s", i)) {
			case "debug":
				levelColor = colorCyan
			case "info":
				levelColor = colorGreen
			case "warn":
				levelColor = colorYellow
			case "error":
				levelColor = colorRed
			case "fatal":
				levelColor = colorMagenta
			case "panic":
				levelColor = colorWhite
			default:
				levelColor = colorBlue
			}
			return fmt.Sprintf("%s%s%s", levelColor, strings.ToUpper(fmt.Sprintf("[%s]", i)), colorReset)
		},
		FormatMessage: func(i interface{}) string {
			return fmt.Sprintf("> %s", i)
		},
		FormatCaller: func(i interface{}) string {
			return filepath.Base(fmt.Sprintf("%s", i))
		},
		PartsExclude: []string{
			zerolog.TimestampFieldName,
		},
	}).
		Level(level).
		With().
		Timestamp().
		Caller().
		Logger()
}

// main is the entry point of the application.
func main() {
	PrintHeader()

	cfg := parseArgs()
	logger := createLogger(getLevelFromString(cfg.loglevel))

	logger.Debug().Msg("opening connection to database...")

	db, err := sql.Open("postgres", cfg.dns)
	if err != nil {
		logger.Err(err)
		return
	}

	defer func(db *sql.DB, logger2 zerolog.Logger) {
		err := db.Close()
		if err != nil {
			logger.Err(err)
		}
	}(db, logger)

	logger.Debug().Msg("pinging database...")
	err = db.Ping()
	if err != nil {
		logger.Err(err)
	} else {
		logger.Info().Msg("database connection pool established")
	}

	app := &application{
		config: cfg,
		logger: &logger,
		models: data.NewModels(db),
	}

	app.logger.Info().Msg(fmt.Sprintf("API server will start on port %d", app.config.port))

	addr := fmt.Sprintf(":%d", app.config.port)

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Allow all origins
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Content-Type", "Content-Length", "Accept-Encoding", "X-CSRF-Token", "Authorization"},
	})

	handler := c.Handler(app.route())
	server := &http.Server{
		Addr:         addr,
		Handler:      handler,
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	app.logger.Info().Msg("API server is up and running")

	err = server.ListenAndServe()
	app.logger.Err(err)
}
