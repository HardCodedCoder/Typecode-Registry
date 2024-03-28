package main

import (
	"os"
	"testing"
)

func TestIfArgumentsAreParsed(t *testing.T) {
	// arrange step
	originalArgs := os.Args
	defer func() { os.Args = originalArgs }() // Reset the arguments.

	os.Args = []string{"cmd", "-port", "9090", "-db-dns", "test_dsn"}
	cfg := parseArgs()
	if cfg.port != 9090 {
		t.Errorf("Expected port to be 9090, got %d", cfg.port)
	}

	if cfg.dns != "test_dsn" {
		t.Errorf("Expected dns to be test_dsn, got %s", cfg.dns)
	}
}
