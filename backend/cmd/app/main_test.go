package main

import (
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"os"
	"testing"
)

func TestIfArgumentsAreParsed(t *testing.T) {
	// arrange step
	originalArgs := os.Args
	defer func() { os.Args = originalArgs }() // Reset the arguments.

	os.Args = []string{"cmd", "-port", "9090", "-db-dns", "test_dsn", "-loglevel", "info"}
	cfg := parseArgs()
	if cfg.port != 9090 {
		t.Errorf("Expected port to be 9090, got %d", cfg.port)
	}

	if cfg.dns != "test_dsn" {
		t.Errorf("Expected dns to be test_dsn, got %s", cfg.dns)
	}

	if cfg.loglevel != "info" {
		t.Errorf("Expected loglevel to be info, got %s", cfg.loglevel)
	}
}

func TestIfLoggerIsInitialized(t *testing.T) {
	// arrange step
	cfg := config{
		loglevel: "info",
	}
	logger := createLogger(getLevelFromString(cfg.loglevel))
	if logger.GetLevel() != 1 {
		t.Errorf("Expected logger level to be 0, got %d", logger.GetLevel())
	}
}

func TestGetLevelFromString(t *testing.T) {
	testCases := map[string]zerolog.Level{
		"debug": zerolog.DebugLevel,
		"info":  zerolog.InfoLevel,
		"warn":  zerolog.WarnLevel,
		"error": zerolog.ErrorLevel,
		"fatal": zerolog.FatalLevel,
		"panic": zerolog.PanicLevel,
		"other": zerolog.InfoLevel, // default case
	}

	for levelStr, expectedLevel := range testCases {
		t.Run(levelStr, func(t *testing.T) {
			actualLevel := getLevelFromString(levelStr)
			assert.Equal(t, expectedLevel, actualLevel)
		})
	}
}
