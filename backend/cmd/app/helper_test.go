package main

import (
	"Typecode-Registry/internal/data"
	"bytes"
	"database/sql"
	"fmt"
	"github.com/rs/zerolog"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

func TestGetFunctionNameToReturnCorrectFunctionName(t *testing.T) {
	expectedName := "TestGetFunctionNameToReturnCorrectFunctionName"
	name := GetFunctionName()
	if name != expectedName {
		t.Errorf("Expected function name to be %s, got %s", expectedName, name)
	}
}

func TestWriteJSONReturnsErrorWhenEmptyEnvelopePassed(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	app := &application{
		logger: &logger,
	}

	headers := make(http.Header)
	headers.Set("Location", fmt.Sprintf("/items/%d", 1))
	err := app.writeJSON(httptest.NewRecorder(), http.StatusOK, envelope{"unserializable": func() {}}, make(map[string][]string))
	if err == nil {
		t.Fatal("expected json MarshalIndent to fail because of empty envelope!")
	}
}

func TestReadJSONReturnsErrorIfRequestBodyContainsMultipleValues(t *testing.T) {
	app := &application{}

	body := bytes.NewBufferString(`{"key": "value"} {"key": "value2"}`)

	req := httptest.NewRequest(http.MethodPost, "/url", body)

	w := httptest.NewRecorder()

	var dst map[string]string

	err := app.readJSON(w, req, &dst)

	if err == nil {
		t.Errorf("Expected error, but none occurred")
	}
}

func TestCalculateTypecodeReturnsErrorWhenExtensionWithEmptyScopeIsPassed(t *testing.T) {
	extension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt64{NullInt64: sql.NullInt64{Int64: 2}},
		Name:         "Test-Extension",
		Description:  "Test-Description",
		Scope:        "",
		CreationDate: time.Now(),
	}

	_, err := calculateTypecode(&extension, nil)
	if err == nil {
		t.Fatal("expected error when passing extension without scope, but got none.")
	}
}

func TestCalculateTypecodeReturnsErrorWhenNotInitializedItemModelIsPassed(t *testing.T) {
	extension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt64{NullInt64: sql.NullInt64{Int64: 2}},
		Name:         "Test-Extension",
		Description:  "Test-Description",
		Scope:        "Shared",
		CreationDate: time.Now(),
	}

	_, err := calculateTypecode(&extension, nil)
	if err == nil {
		t.Fatal("expected error when passing extension without scope, but got none.")
	}
}

func TestCalculateTypecodePanicsWhenCalledWithHybrisScope(t *testing.T) {
	defer func() {
		if r := recover(); r == nil {
			t.Errorf("Function did not panic although expected.")
		} else {
			if r != "not implemented" {
				t.Errorf("Expected Panic-Message was '%v', got '%v'", "not implemented", r)
			}
		}
	}()

	extension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt64{NullInt64: sql.NullInt64{Int64: 1}},
		Name:         "Test-Name",
		Description:  "Test-Description",
		Scope:        "Hybris",
		CreationDate: time.Now(),
	}

	itemModel := data.ItemModel{DB: nil}
	_, _ = calculateTypecode(&extension, &itemModel)
}

func TestCalculateTypecodeReturnsNegativeTypecodeWhenInvalidScopeIsPassed(t *testing.T) {
	extension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt64{NullInt64: sql.NullInt64{Int64: 1}},
		Name:         "Test-Name",
		Description:  "Test-Description",
		Scope:        "Test-Scope",
		CreationDate: time.Now(),
	}

	itemModel := data.ItemModel{DB: nil}
	typecode, err := calculateTypecode(&extension, &itemModel)

	if typecode != -1 {
		t.Fatalf("Expected typecode -1, got %d", typecode)
	}

	if err == nil {
		t.Fatalf("Expected error but got none!")
	}
}
