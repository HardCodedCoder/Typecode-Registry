package main

import (
	"Typecode-Registry/internal/data"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
)

// ItemRequest is the request object for creating a new item.
// Helper struct to parse the JSON request body.
type ItemRequest struct {
	Name        string `json:"name"`
	TableName   string `json:"table_name"`
	ExtensionId int64  `json:"extension_id"`
}

// healthcheck is a simple handler to check if the service is up and running.
// TODO: Add more checks to ensure the service is healthy.
func (app *application) healthcheck(w http.ResponseWriter, r *http.Request) {
	app.logger.Debug().Msg(fmt.Sprintf("Handling %s %s route", r.Method, r.URL.Path))
	if r.Method != http.MethodGet {
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
		return
	}

	w.WriteHeader(http.StatusOK)
	_, err := w.Write([]byte("Service is up and running!"))
	if err != nil {
		app.logger.Err(err)
	}
}

// getProjectsHandler handles the /projects route and calls the appropriate handler based on the request method.
// It handles GET requests. Other requests will return a 405 Method Not Allowed.
func (app *application) getProjectsHandler(w http.ResponseWriter, r *http.Request) {
	app.logger.Debug().Msg(fmt.Sprintf("Handling %s %s route", r.Method, r.URL.Path))
	switch r.Method {
	case http.MethodGet:
		app.getProjects(w)
	default:
		app.logger.Error().Msg(fmt.Sprintf("%s not allowed on route %s ", r.Method, r.URL.Path))
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (app *application) getItemsHandler(w http.ResponseWriter, r *http.Request) {
	app.logger.Debug().Msg(fmt.Sprintf("Handling %s %s route", r.Method, r.URL.Path))
	switch r.Method {
	case http.MethodGet:
		app.getItems(w)
	case http.MethodPost:
		app.createItem(w, r)
	default:
		app.logger.Error().Msg(fmt.Sprintf("%s not allowed on route %s ", r.Method, r.URL.Path))
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (app *application) getItemHandler(w http.ResponseWriter, r *http.Request) {
	app.logger.Debug().Msg(fmt.Sprintf("Handling %s %s route", r.Method, r.URL.Path))
	switch r.Method {
	case http.MethodGet:
		app.getItem(w, r)
	case http.MethodPut:
		app.updateItem(w, r)
	case http.MethodDelete:
		app.deleteItem(w, r)
	default:
		app.logger.Error().Msg(fmt.Sprintf("%s not allowed on route %s ", r.Method, r.URL.Path))
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

func (app *application) getItems(w http.ResponseWriter) {
	itemDetails, err := app.models.Items.ReadItems()
	if err != nil {
		app.logger.Error().Msg(fmt.Sprintf("Error fetching item details from database: %s", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"items": itemDetails}, nil)
	if err != nil {
		app.logger.Err(err)
		http.Error(w, "error while trying to write item details to http response!", http.StatusInternalServerError)
		return
	}
}

// getItem handles the GET request for a specific item detail.
// It extracts the item ID from the URL and returns the details of the item with that ID.
// If the ID is not a valid integer, it returns a 400 Bad Request.
// If the item with the specified ID is not found, it returns a 404 Not Found.
func (app *application) getItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/items/"):]
	idInt, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		app.logger.Warn().Msg(fmt.Sprintf("Bad Request in %s using id %s",
			GetFunctionName(),
			id))
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	item, err := app.models.Items.ReadItem(idInt)
	if err != nil {
		app.logger.Err(err)
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, fmt.Sprintf("no item detail with id %d found", idInt), http.StatusNotFound)
		} else {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"item": item}, nil)
	if err != nil {
		app.logger.Err(err)
		http.Error(w, "error while trying to write item detail to http response!", http.StatusInternalServerError)
		return
	}
}

// updateItem handles the PUT request for a specific item.
// It extracts the item ID from the URL and updates the details of the item with that ID.
// If the ID is not a valid integer, it returns a 400 Bad Request.
// TODO: finish implementation of the updateItem handler and update documentation
func (app *application) updateItem(w http.ResponseWriter, r *http.Request) {
	panic("not implemented")
}

// deleteItem handles the DELETE request for a specific item.
// It extracts the item ID from the URL and deletes the item with that ID.
// If the ID is not a valid integer, it returns a 400 Bad Request.
// When the item is successfully deleted, it returns a 204 No Content status.
func (app *application) deleteItem(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/items/"):]
	idInt, err := strconv.ParseInt(id, 10, 64)
	if err != nil {
		app.logger.Warn().Msg(fmt.Sprintf("Bad Request in %s using id %s",
			GetFunctionName(),
			id))
		http.Error(w, "Bad Request", http.StatusBadRequest)
	}

	err = app.models.Items.DeleteItem(idInt)
	if err != nil {
		app.logger.Err(err)
		http.Error(w, "error during deleting the requested item, no rows affected.", http.StatusInternalServerError)
	}

	w.WriteHeader(http.StatusNoContent)
}

// createItem handles the POST request to create a new item.
// It reads the JSON request body, validates the input, and creates a new item in the database.
//   - If the request body is not a valid JSON object or the input is invalid, it returns a 400 Bad Request.
//   - If the extension ID in the request does not match any extension record, it returns a 400 Bad Request.
//   - If the item is successfully created, it returns a 201 Created status with the item details in the response body.
//   - If there is an error while inserting the item into the database, it returns a 500 Internal Server Error.
func (app *application) createItem(w http.ResponseWriter, r *http.Request) {
	var itemReq ItemRequest
	err := app.readJSON(w, r, &itemReq)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusBadRequest), http.StatusBadRequest)
		return
	}

	app.logger.Debug().Msg(fmt.Sprintf("Item request: %v received", itemReq))
	if itemReq.Name == "" || itemReq.TableName == "" || itemReq.ExtensionId < 1 {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		app.logger.Error().Msg(fmt.Sprintf("Bad Request: Invalid item create request with data: %v", itemReq))
		return
	}

	extension, err := app.models.Extensions.Read(itemReq.ExtensionId)
	if err != nil {
		msg := fmt.Sprintf("could not find extension with id %d in database", itemReq.ExtensionId)
		http.Error(w, msg, http.StatusNotFound)
		app.logger.Error().Msg(msg)
		return
	}

	typecode, err := calculateTypecode(extension, &app.models.Items)
	if err != nil {
		http.Error(w, "Internal Server Error during calculation of typecode", http.StatusInternalServerError)
		app.logger.Error().Msg(fmt.Sprintf("Error while calculating typecode for scope: %s", extension.Scope))
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
		app.logger.Err(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	item.Scope = extension.Scope
	if item.Scope == data.ScopeProject && extension.ProjectID.Valid {
		err = app.models.Projects.ReadProjectName(int64(extension.ProjectID.Int32), &item.Project)
		if err != nil {
			app.logger.Err(err)
			http.Error(w,
				fmt.Sprintf("error while reading project with id %d %v", extension.ProjectID.Int32, err),
				http.StatusInternalServerError)
			return
		}
	}

	headers := make(http.Header)
	headers.Set("Location", fmt.Sprintf("/items/%d", item.ID))

	err = app.writeJSON(w, http.StatusCreated, envelope{"item": item}, headers)
	if err != nil {
		app.logger.Err(err)
		http.Error(w, "error while trying to write item to http response.", http.StatusInternalServerError)
		return
	}
}

// getExtensionsHandler handles the /extensions route and calls the appropriate handler based on the request method.
// It handles GET requests. Other requests will return a 405 Method Not Allowed.
func (app *application) getExtensionsHandler(w http.ResponseWriter, r *http.Request) {
	app.logger.Debug().Msg(fmt.Sprintf("Handling %s %s route", r.Method, r.URL.Path))
	switch r.Method {
	case http.MethodGet:
		app.getExtensions(w, r)
	default:
		http.Error(w, http.StatusText(http.StatusMethodNotAllowed), http.StatusMethodNotAllowed)
	}
}

// getExtensions handles the GET request for all extensions with the specified scope.
// It reads the scope from the URL and returns all extensions with that scope.
// If the scope is not valid, it returns a 400 Bad Request.
// If there are no extensions with the specified scope, it returns a 404 Not Found.
func (app *application) getExtensions(w http.ResponseWriter, r *http.Request) {
	scope := r.URL.Path[len("/extensions/"):]

	if scope != "Project" && scope != "Shared" {
		app.logger.Warn().Msg(
			fmt.Sprintf("Invalid scope: %s | responding with %s", scope, http.StatusText(http.StatusBadRequest)),
		)
		http.Error(w, "Invalid scope", http.StatusBadRequest)
		return
	}

	extensions, err := app.models.Extensions.ReadAll(scope)
	if err != nil {
		app.logger.Err(err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"extensions": extensions}, nil)

	if err != nil {
		http.Error(w, fmt.Sprintf("error while trying to write extensions to http response. error: %s", err), http.StatusInternalServerError)
		app.logger.Err(err)
		return
	}
}

// getProjects handles the GET request for all projects.
// It returns all projects stored in the database.
// If there are no projects in the database, it returns a 404 Not Found.
// If there is an error while reading the projects from the database, it returns a 500 Internal Server Error.
func (app *application) getProjects(w http.ResponseWriter) {
	projects, err := app.models.Projects.ReadAll()
	if err != nil {
		app.logger.Error().Msg(fmt.Sprintf("Error while trying to read project records from database: %s", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	err = app.writeJSON(w, http.StatusOK, envelope{"projects": projects}, nil)
	if err != nil {
		msg := fmt.Sprintf("Error while trying to write projects to http response. error: %s", err)
		app.logger.Error().Msg(msg)
		http.Error(w, msg, http.StatusInternalServerError)
		return
	}
}
