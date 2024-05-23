package main

import (
	"Typecode-Registry/internal/data"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"runtime"
	"strings"

	"github.com/common-nighthawk/go-figure"
)

// Allows to define a name for json object which makes parsing easier for receiver of the data.
type envelope map[string]any

// GetFunctionName returns the name of the function that calls it.
//
//	Returns: A string containing only the function name without the package name.
func GetFunctionName() string {
	pc, _, _, _ := runtime.Caller(1)
	fullName := runtime.FuncForPC(pc).Name()
	idxLastPeriod := strings.LastIndex(fullName, ".")

	// Return fullName if there is no period in the string.
	if idxLastPeriod == -1 {
		return fullName
	}

	return fullName[idxLastPeriod+1:]
}

// PrintHeader prints the header of the application.
// Uses the go-figure package to print the header.
func PrintHeader() {
	fmt.Println()
	figure.NewFigure("Typecode-Registry", "banner3-D", true).Print()
	fmt.Println()
}

// readJson reads the JSON object from the request body and decodes it into the dst interface.
// It also checks if the request body only contains a single JSON object.
// Returns: An error if the request body cannot be read or if the body contains more than one JSON object.
func (app *application) readJSON(w http.ResponseWriter, r *http.Request, dst any) error {
	// Set the maximum size of the request body to 1MB. Security measure to prevent DoS attacks.
	maxBytes := 1_048_576
	// Create new Reader which limits the size of the request body which can be read from the body.
	r.Body = http.MaxBytesReader(w, r.Body, int64(maxBytes))

	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		return err
	}

	// Ensure that the request body only contains a single JSON object.
	err := dec.Decode(&struct{}{})
	if err != io.EOF {
		return errors.New("body must only contain a single JSON object")
	}

	return nil
}

// writeJSON is a utility method of the application struct that facilitates the process of sending data to the client.
// It takes in a http.ResponseWriter, a status code, a map of data, and a set of headers.
// The primary function of this method is to convert the provided data into a format that can be easily consumed by the client.
// This is achieved by marshalling the data into JSON format. The marshalled data is then written to the HTTP response.
// The method also handles setting the appropriate headers and status code for the response.
// In case of any errors during this process, such as an error during marshalling or writing to the response, the method returns the error.
// If the process completes successfully without any errors, the method returns nil.
func (app *application) writeJSON(w http.ResponseWriter, status int, data envelope, headers http.Header) error {
	js, err := json.MarshalIndent(data, "", "\t")
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		app.logger.Printf("Error occurred during writing json data. Err: %v", err)
		return err
	}

	js = append(js, '\n')

	app.logger.Debug().Msg(fmt.Sprintf("Sending the following data to client: %s", string(js)))

	for key, value := range headers {
		w.Header()[key] = value
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, err = w.Write(js)
	if err != nil {
		return err
	}

	return nil
}

// calculateTypecode determines the next available typecode for a given scope.
// This function is crucial for ensuring that each item within a specific scope receives a unique typecode.
// Currently, it supports 'data.ScopeHybris', 'data.ScopeShared' and 'data.ScopeProject'
// to find the next free typecode within the defined range.
//
// Parameters:
//   - scope: The scope for which the typecode is being calculated. The scope determines the range and rules
//     used for calculating the typecode.
//   - itemModel: An instance of data.ItemModel used for database operations, specifically to find the next
//     available typecode. This parameter must not be nil.
//
// Returns:
// - int32: The calculated typecode. If no typecode is available or an error occurs, -1 is returned.
// - error: An error object describing what went wrong. In case of an error, the typecode is -1.
//
// Error cases:
//   - If 'scope' is empty, the function returns an error since a scope is required.
//   - If 'itemModel' is nil and the scope is 'data.ScopeShared', the function returns an error since
//     'itemModel' is required to calculate the next free typecode in this case.
//   - If the next free typecode cannot be found because the end of the range is reached, the function returns an error.
//
// Example usage:
// typecode, err := calculateTypecode(data.ScopeShared, itemModel)
//
//	if err != nil {
//	    log.Fatalf("Error calculating typecode: %s", err)
//	}
//
// fmt.Printf("The next free typecode is: %d\n", typecode)
//
// Note: This function relies on the correct configuration of 'data.ScopeRanges' and assumes that
// database indexes for the 'item' table are optimized to maximize the performance of the query to determine
// the next free typecode.
func calculateTypecode(extension *data.Extension, itemModel *data.ItemModel) (int32, error) {
	if extension.Scope == "" {
		return -1, errors.New("cannot calculate typecode with an empty scope")
	}

	if itemModel == nil {
		return -1, errors.New(fmt.Sprintf("itemModel mustn't be nil when scope is %s", extension.Scope))
	}

	switch extension.Scope {
	case data.ScopeHybris:
		panic("not implemented")
	case data.ScopeShared:
		nextFreeTypecode, err := itemModel.GetNextSharedFreeTypecode(
			extension.Scope,
			data.ScopeRanges[data.ScopeShared].Start,
			data.ScopeRanges[data.ScopeShared].End)

		if err != nil {
			return -1, err
		}

		if !nextFreeTypecode.Valid {
			return data.ScopeRanges[data.ScopeShared].Start, nil
		}

		if nextFreeTypecode.Int32 == data.ScopeRanges[data.ScopeShared].End {
			return -1, errors.New("cannot create new typecode as max int32 already reached")
		}

		return nextFreeTypecode.Int32, nil
	case data.ScopeProject:
		nextFreeTypecode, err := itemModel.GetNextProjectFreeTypeCode(
			extension.ProjectID.Int64,
			data.ScopeRanges[data.ScopeProject].Start,
			data.ScopeRanges[data.ScopeProject].End)

		return nextFreeTypecode.Int32, err
	default:
		return -1, fmt.Errorf("scope %s non valid", extension.Scope)
	}
}
