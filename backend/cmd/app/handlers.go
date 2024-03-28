package main

import (
	"Typecode-Registry/internal/data"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

type ItemRequest struct {
	Name        string `json:"name"`
	TableName   string `json:"tablename"`
	ExtensionId int64  `json:"extension_id"`
}

func (app *application) healthcheck(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	w.WriteHeader(http.StatusOK)
	_, err := w.Write([]byte("Service is up and running!"))
	if err != nil {
		app.logger.Fatal(err)
	}
}

func (app *application) getCreateItemsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:

	case http.MethodPost:
		app.createItem(w, r)
	default:
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (app *application) getUpdateDeleteItemsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		app.getItem(w, r)
	case http.MethodPut:
		app.updateItem(w, r)
	case http.MethodDelete:
		app.deleteItem(w, r)
	default:
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (app *application) getItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/items/"):]
	idInt, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		app.logger.Printf("WARNING: Bad Request in %s using id %s",
			GetFunctionName(),
			id)
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	_, _ = fmt.Fprintf(w, "Display the details of item with ID: %d", idInt)
}

func (app *application) updateItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/items/"):]
	idInt, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		app.logger.Printf("WARNING: Bad Request in %s using id %s",
			GetFunctionName(),
			id)
		http.Error(w, "Bad Request", http.StatusBadRequest)
	}

	_, _ = fmt.Fprintf(w, "Update the details of item with ID: %d", idInt)
}

func (app *application) deleteItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/items/"):]
	idInt, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		app.logger.Printf("WARNING: Bad Request in %s using id %s",
			GetFunctionName(),
			id)
		http.Error(w, "Bad Request", http.StatusBadRequest)
	}

	_, _ = fmt.Fprintf(w, "Delete the details of item with ID: %d", idInt)
}

func (app *application) createItem(w http.ResponseWriter, r *http.Request) {
	var itemReq ItemRequest
	err := app.readJSON(w, r, &itemReq)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	if itemReq.Name == "" || itemReq.TableName == "" || itemReq.ExtensionId < 1 {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		app.logger.Printf("Bad Request: Invalid item create request with data: %v", itemReq)
		return
	}

	extension, err := app.models.Extensions.Read(itemReq.ExtensionId)
	if err != nil {
		msg := fmt.Sprintf("could not find extension with id %d in database", itemReq.ExtensionId)
		http.Error(w, msg, http.StatusNotFound)
		app.logger.Printf(msg)
		return
	}

	typecode, err := calculateTypecode(extension, &app.models.Items)
	if err != nil {
		http.Error(w, "Internal Server Error during calculation of typecode", http.StatusInternalServerError)
		app.logger.Printf(fmt.Sprintf("Error while calculating typecode for scope: %s", extension.Scope))
		return
	}

	item := &data.Item{
		Name:        itemReq.Name,
		TableName:   itemReq.TableName,
		ExtensionID: itemReq.ExtensionId,
		Typecode:    typecode,
	}

	err = app.models.Items.Insert(item)
	if err != nil {
		app.logger.Println(err)
		if strings.Contains(err.Error(), "foreign key constraint") {
			http.Error(w, "Invalid extension_id: No matching extension record found", http.StatusBadRequest)
		} else {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}

	headers := make(http.Header)
	headers.Set("Location", fmt.Sprintf("/items/%d", item.ID))

	err = app.writeJSON(w, http.StatusCreated, envelope{"item": item}, headers)
	if err != nil {
		app.logger.Println(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}
