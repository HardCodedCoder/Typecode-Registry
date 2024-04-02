package main

import (
	"Typecode-Registry/internal/data"
	"bytes"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"github.com/DATA-DOG/go-sqlmock"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

type TestRoute struct {
	route  string
	method string
	status int
}

type ResponseItem struct {
	Item data.Item `json:"item"`
}

type ExpectedItemValues struct {
	Name        string
	TableName   string
	ExtensionID int64
	Typecode    int32
}

func testRouting(t *testing.T, routes []TestRoute, mux *http.ServeMux) {
	for _, tr := range routes {
		req, err := http.NewRequest(tr.method, tr.route, nil)
		if err != nil {
			t.Errorf("Error creating request: %v", err)
		}

		resp := httptest.NewRecorder()
		mux.ServeHTTP(resp, req)

		if resp.Code != tr.status {
			t.Errorf("Expected status %d for route %s, got %d", tr.status, tr.route, resp.Code)
		}
	}
}

func getResponseItem(resp *http.Response, t *testing.T) ResponseItem {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}

	var response ResponseItem
	_ = json.Unmarshal(responseBody, &response)
	_ = resp.Body.Close()

	return response
}

func checkHTTPResponse(resp *http.Response, expectedStatusCode int, t *testing.T) {
	if resp.StatusCode != expectedStatusCode {
		t.Errorf("expected status code %d, got %d", http.StatusCreated, resp.StatusCode)
	}
}

func sendMockHTTPRequest(serverURL, endpoint string, body interface{}, t *testing.T) *http.Response {
	itemReq, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}

	resp, err := http.Post(fmt.Sprintf("%s%s", serverURL, endpoint), "application/json", bytes.NewBuffer(itemReq))
	if err != nil {
		t.Fatal(err)
	}

	return resp
}

func checkResponseValues(response ResponseItem, expected ExpectedItemValues, t *testing.T) {
	if response.Item.Name != expected.Name {
		t.Errorf("expected name to be %s, got %s", expected.Name, response.Item.Name)
	}
	if response.Item.TableName != expected.TableName {
		t.Errorf("expected table name to be %s, got %s", expected.TableName, response.Item.TableName)
	}
	if response.Item.ExtensionID != expected.ExtensionID {
		t.Errorf("expected extension id to be %d, got %d", expected.ExtensionID, response.Item.ExtensionID)
	}
	if response.Item.Typecode != expected.Typecode {
		t.Errorf("expected typecode to be %d, got %d", expected.Typecode, response.Item.Typecode)
	}
}

func TestCallingExtensionsRoutePassingInvalidScopeReturnsStatusBadRequest(t *testing.T) {
	app := application{
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/extensions/Invalid-Scope")
	if err != nil {
		t.Fatal(err)
	}

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status code %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestSendingNotExistingExtensionIDReturnsStatusNotFound(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	itemReq := ItemRequest{Name: "Test-Name", TableName: "Test-Table-Name", ExtensionId: 1}

	args := []driver.Value{itemReq.ExtensionId}
	returnRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"}) // no rows added
	mockReadExtensionByIDQuery(mock, args, returnRows)

	app := application{
		models: data.NewModels(db),
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	server := httptest.NewServer(app.route())
	defer server.Close()

	resp := sendMockHTTPRequest(
		server.URL,
		"/items",
		itemReq,
		t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal("The expectations of the database were not met!")
	}

	_ = db.Close()

	checkHTTPResponse(resp, http.StatusNotFound, t)

	responseItem := getResponseItem(resp, t)
	expectedResponseItem := ResponseItem{}
	if responseItem != expectedResponseItem {
		t.Fatalf("Expected nil response item, got %v", responseItem)
	}

}

func TestEmptyRequestBodyFieldsReturnStatusBadRequest(t *testing.T) {
	app := application{
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	server := httptest.NewServer(app.route())
	defer server.Close()

	resp := sendMockHTTPRequest(
		server.URL,
		"/items",
		ItemRequest{},
		t)

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status code %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestSendingRequestWithInvalidRequestBodyReturnsStatusBadRequest(t *testing.T) {
	app := application{
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	server := httptest.NewServer(app.route())
	defer server.Close()

	type FaultyRequestBody struct {
		Name      string
		TableName string
		Dummy     string
	}

	resp := sendMockHTTPRequest(
		server.URL,
		"/items",
		FaultyRequestBody{Name: "Test-Name", TableName: "Test-Table-Name", Dummy: "Dummy"},
		t)

	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected status code %d, got %d", http.StatusBadRequest, resp.StatusCode)
	}
}

func TestProjectsRouteReturnsAllProjects(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	projects := []data.Project{
		{ID: 1, Name: "Test-Project-1", Description: "Test-Description-1", CreationDate: time.Now()},
		{ID: 2, Name: "Test-Project-2", Description: "Test-Description-2", CreationDate: time.Now()},
	}

	returnRows := sqlmock.NewRows([]string{"id", "name", "description", "creation_date"}).
		AddRow(projects[0].ID, projects[0].Name, projects[0].Description, projects[0].CreationDate).
		AddRow(projects[1].ID, projects[1].Name, projects[1].Description, projects[1].CreationDate)
	mockReadAllProjectsQuery(mock, returnRows)

	app := application{
		models: data.NewModels(db),
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/projects")
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusOK, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestExtensionsRouteGetsAllExtensionsByScope(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	extensions := []data.Extension{
		{ID: 1, Name: "Test-Extension-1", Description: "Test-Description-1", Scope: "Project", CreationDate: time.Now()},
		{ID: 3, Name: "Test-Extension-3", Description: "Test-Description-3", Scope: "Project", CreationDate: time.Now()},
	}

	const scope = "Project"
	returnRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"}).
		AddRow(extensions[0].ID, extensions[0].ProjectID.Int32, extensions[0].Name, extensions[0].Description, extensions[0].Scope, extensions[0].CreationDate).
		AddRow(extensions[1].ID, extensions[1].ProjectID.Int32, extensions[1].Name, extensions[1].Description, extensions[1].Scope, extensions[1].CreationDate)
	mockReadAllExtensionsQuery(mock, scope, returnRows)

	app := application{
		models: data.NewModels(db),
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/extensions" + "/" + scope)
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusOK, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}
}

func TestItemsRouteCreatesItemForProjectExtension(t *testing.T) {
	// Initialize Mock database.
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	testExtension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt32{NullInt32: sql.NullInt32{Int32: 1}},
		Name:         "Test-Extension",
		Description:  "Test-Description",
		Scope:        "Project",
		CreationDate: time.Now(),
	}

	itemRequest := ItemRequest{
		Name:        "Test-Item",
		TableName:   "Test-Item-Table",
		ExtensionId: 1,
	}

	// Mock Extension Query
	extensionArgs := []driver.Value{1}
	extensionRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"}).
		AddRow(testExtension.ID, testExtension.ProjectID.Int32, testExtension.Name, testExtension.Description, testExtension.Scope, testExtension.CreationDate)
	mockReadExtensionByIDQuery(mock, extensionArgs, extensionRows)

	// Simulate that the next free typecode is 14000 if there are no existing entries in the range.
	typecodeArgs := []driver.Value{testExtension.ProjectID.Int32, data.ScopeRanges[data.ScopeProject].Start, data.ScopeRanges[data.ScopeProject].End}
	typecodeRows := sqlmock.NewRows([]string{"next_free_typecode"}).AddRow(14000)
	mockGetNextProjectFreeTypecodeQuery(mock, typecodeArgs, typecodeRows)

	// Mock Insert Item Query
	insertArgs := []driver.Value{
		itemRequest.Name,
		itemRequest.ExtensionId,
		itemRequest.TableName,
		14000,
	}
	insertRows := sqlmock.NewRows([]string{"id", "creation_date"}).AddRow(1, time.Now())
	mockInsertItemQuery(mock, insertArgs, insertRows)

	app := application{
		models: data.NewModels(db),
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp := sendMockHTTPRequest(server.URL, "/items", itemRequest, t)

	checkHTTPResponse(resp, http.StatusCreated, t)

	expectedValues := ExpectedItemValues{
		Name:        "Test-Item",
		TableName:   "Test-Item-Table",
		ExtensionID: 1,
		Typecode:    14000,
	}

	responseItem := getResponseItem(resp, t)
	checkResponseValues(responseItem, expectedValues, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsRouteCreatesItemForSharedExtension(t *testing.T) {
	// Initialize Mock database.
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	// Mock Extension Query
	extensionArgs := []driver.Value{1}
	extensionRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"}).
		AddRow(1, sql.NullInt32{}, "Test-Extension", "Test-Description", "Shared", time.Now())
	mockReadExtensionByIDQuery(mock, extensionArgs, extensionRows)

	// Mock Typecode Query
	typecodeArgs := []driver.Value{20000, int32(^uint32(0) >> 1), "Shared"}
	typecodeRows := sqlmock.NewRows([]string{"next_free_typecode"}).AddRow(20001)
	mockTypecodeQuery(mock, typecodeArgs, typecodeRows)

	// Mock Insert Item Query
	insertArgs := []driver.Value{"Test-Item", 1, "Test-Item-Table-Name", 20001}
	insertRows := sqlmock.NewRows([]string{"id", "creation_date"}).AddRow(1, time.Now())
	mockInsertItemQuery(mock, insertArgs, insertRows)

	app := application{
		models: data.NewModels(db),
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp := sendMockHTTPRequest(
		server.URL,
		"/items",
		ItemRequest{Name: "Test-Item", TableName: "Test-Item-Table-Name", ExtensionId: 1},
		t)

	checkHTTPResponse(resp, http.StatusCreated, t)

	expectedValues := ExpectedItemValues{
		Name:        "Test-Item",
		TableName:   "Test-Item-Table-Name",
		ExtensionID: 1,
		Typecode:    20001,
	}

	responseItem := getResponseItem(resp, t)
	checkResponseValues(responseItem, expectedValues, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestReturnedServeMuxIsNotNil(t *testing.T) {
	// arrange step
	app := application{}
	mux := app.route()
	if mux == nil {
		t.Errorf("Expected ServeMux to be not nil, got nil")
	}
}

func TestIfInvalidItemsRoutesHTTPMethodsReturnMethodNotAllowed(t *testing.T) {
	app := application{}
	mux := app.route()

	testServer := httptest.NewServer(mux)
	defer testServer.Close()

	tests := []TestRoute{
		{"/items", "PUT", http.StatusMethodNotAllowed},
		{"/items", "PATCH", http.StatusMethodNotAllowed},
		{"/items", "DELETE", http.StatusMethodNotAllowed},
		{"/items", "HEAD", http.StatusMethodNotAllowed},
		{"/items", "CONNECT", http.StatusMethodNotAllowed},
		{"/items", "OPTIONS", http.StatusMethodNotAllowed},
		{"/items", "TRACE", http.StatusMethodNotAllowed},
		{"/items", "PATCH", http.StatusMethodNotAllowed},
		{"/items/1", "POST", http.StatusMethodNotAllowed},
		{"/items/1", "HEAD", http.StatusMethodNotAllowed},
		{"/items/1", "PATCH", http.StatusMethodNotAllowed},
		{"/items/1", "CONNECT", http.StatusMethodNotAllowed},
		{"/items/1", "OPTIONS", http.StatusMethodNotAllowed},
		{"/items/1", "TRACE", http.StatusMethodNotAllowed},
	}

	testRouting(t, tests, mux)
}

func TestIfHealthCheckRouteReturnsStatusCodeOk(t *testing.T) {
	app := application{
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}

	mux := app.route()

	testServer := httptest.NewServer(mux)
	defer testServer.Close()

	resp, err := http.Get(testServer.URL + "/healthcheck")
	if err != nil {
		t.Errorf("Error sending request: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("Expected status %d for route /healthcheck, got %d", http.StatusOK, resp.StatusCode)
	}
}

func TestIfHealthCheckRouteCanOnlyBeAccessedWithGetMethod(t *testing.T) {
	app := application{}
	mux := app.route()

	testServer := httptest.NewServer(mux)
	defer testServer.Close()

	routes := []TestRoute{
		{"/healthcheck", "HEAD", http.StatusMethodNotAllowed},
		{"/healthcheck", "POST", http.StatusMethodNotAllowed},
		{"/healthcheck", "PUT", http.StatusMethodNotAllowed},
		{"/healthcheck", "DELETE", http.StatusMethodNotAllowed},
		{"/healthcheck", "CONNECT", http.StatusMethodNotAllowed}, {"/healthcheck", "HEAD", http.StatusMethodNotAllowed},
		{"/healthcheck", "OPTIONS", http.StatusMethodNotAllowed},
		{"/healthcheck", "TRACE", http.StatusMethodNotAllowed},
		{"/healthcheck", "PATCH", http.StatusMethodNotAllowed},
	}

	testRouting(t, routes, mux)
}

func TestIfRootRouteReturnsNotFound(t *testing.T) {
	app := application{}
	mux := app.route()

	testServer := httptest.NewServer(mux)
	defer testServer.Close()

	resp, err := http.Get(testServer.URL + "/")
	if err != nil {
		t.Errorf("Error sending request: %v", err)
	}

	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("Expected status %d for route /, got %d", http.StatusNotFound, resp.StatusCode)
	}
}

func TestSpecificItemRouteReturnsStatusBadRequestWhenCalledWithNonIntID(t *testing.T) {
	app := application{
		logger: log.New(os.Stdout, "", log.Ldate|log.Ltime),
	}
	mux := app.route()

	testServer := httptest.NewServer(mux)
	defer testServer.Close()

	test := []TestRoute{
		{"/items/abc", "GET", http.StatusBadRequest},
		{"/items/abc", "PUT", http.StatusBadRequest},
		{"/items/abc", "DELETE", http.StatusBadRequest},
	}

	testRouting(t, test, mux)
}
