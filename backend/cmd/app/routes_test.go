package main

import (
	"Typecode-Registry/internal/data"
	"bytes"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"github.com/DATA-DOG/go-sqlmock"
	"github.com/rs/zerolog"
	"io"
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

type ResponseItems struct {
	Items []data.Item `json:"items"`
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

func getResponseItems(resp *http.Response, t *testing.T) ResponseItems {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}

	var items ResponseItems
	_ = json.Unmarshal(responseBody, &items)
	_ = resp.Body.Close()

	return items
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

func TestCreateItemReturnsInternalServerErrorWhenInsertFails(t *testing.T) {
	// Create a new mock database connection
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	testExtension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt32{NullInt32: sql.NullInt32{Int32: 1}},
		Name:         "Test-Extension",
		Description:  "Test-Description",
		Scope:        "Shared",
		CreationDate: time.Now(),
	}

	// Create a new ItemRequest
	itemReq := ItemRequest{
		Name:        "Test Item",
		TableName:   "Test Table",
		ExtensionId: 1,
	}

	args := []driver.Value{itemReq.ExtensionId}
	returnRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"}).AddRow(testExtension.ID, testExtension.ProjectID.Int32, testExtension.Name, testExtension.Description, testExtension.Scope, testExtension.CreationDate)
	mockReadExtensionByIDQuery(mock, args, returnRows)

	// Mock Typecode Query
	typecodeArgs := []driver.Value{20000, int32(^uint32(0) >> 1), "Shared"}
	typecodeRows := sqlmock.NewRows([]string{"next_free_typecode"}).AddRow(20000)
	mockTypecodeQuery(mock, typecodeArgs, typecodeRows)

	insertArgs := []driver.Value{
		itemReq.Name,
		itemReq.ExtensionId,
		itemReq.TableName,
		20000,
	}

	mockInsertItemQueryToReturnError(mock, insertArgs)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp := sendMockHTTPRequest(server.URL, "/items", itemReq, t)

	checkHTTPResponse(resp, http.StatusInternalServerError, t)

	responseItem := getResponseItem(resp, t)
	expectedResponseItem := ResponseItem{}
	if responseItem != expectedResponseItem {
		t.Fatalf("Expected nil response item, got %v", responseItem)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestCreateItemRoutesReturnsStatusInternalServerErrorWhenScopeSharedRangeEndIsReached(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	testExtension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt32{NullInt32: sql.NullInt32{Int32: 1}},
		Name:         "Test-Extension",
		Description:  "Test-Description",
		Scope:        "Shared",
		CreationDate: time.Now(),
	}

	// Create a new ItemRequest
	itemReq := ItemRequest{
		Name:        "Test Item",
		TableName:   "Test Table",
		ExtensionId: 1,
	}

	args := []driver.Value{itemReq.ExtensionId}
	returnRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"}).AddRow(testExtension.ID, testExtension.ProjectID.Int32, testExtension.Name, testExtension.Description, testExtension.Scope, testExtension.CreationDate)
	mockReadExtensionByIDQuery(mock, args, returnRows)

	// Mock Typecode Query
	typecodeArgs := []driver.Value{20000, int32(^uint32(0) >> 1), "Shared"}
	typecodeRows := sqlmock.NewRows([]string{"next_free_typecode"}).AddRow(data.ScopeRanges[data.ScopeShared].End)
	mockTypecodeQuery(mock, typecodeArgs, typecodeRows)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
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

	checkHTTPResponse(resp, http.StatusInternalServerError, t)

	responseItem := getResponseItem(resp, t)
	expectedResponseItem := ResponseItem{}
	if responseItem != expectedResponseItem {
		t.Fatalf("Expected nil response item, got %v", responseItem)
	}
}

func TestCallingExtensionsRoutePassingInvalidScopeReturnsStatusBadRequest(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	app := &application{
		logger: &logger,
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
	returnRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"})
	mockReadExtensionByIDQuery(mock, args, returnRows)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
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
	logger := zerolog.New(os.Stdout)

	app := &application{
		logger: &logger,
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
	logger := zerolog.New(os.Stdout)

	app := &application{
		logger: &logger,
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

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
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

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
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

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
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

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
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
	logger := zerolog.New(os.Stdout)

	app := &application{
		logger: &logger,
	}

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
		{"/items/details", "PUT", http.StatusMethodNotAllowed},
		{"/items/details", "PATCH", http.StatusMethodNotAllowed},
		{"/items/details", "DELETE", http.StatusMethodNotAllowed},
		{"/items/details", "HEAD", http.StatusMethodNotAllowed},
		{"/items/details", "CONNECT", http.StatusMethodNotAllowed},
		{"/items/details", "OPTIONS", http.StatusMethodNotAllowed},
		{"/items/details", "TRACE", http.StatusMethodNotAllowed},
	}

	testRouting(t, tests, mux)
}

func TestIfHealthCheckRouteReturnsStatusCodeOk(t *testing.T) {
	logger := zerolog.New(os.Stdout)

	app := &application{
		logger: &logger,
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
	logger := zerolog.New(os.Stdout)

	app := &application{
		logger: &logger,
	}

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
	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		logger: &logger,
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

func TestItemRouteReturnsAllItems(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	testItems := []data.Item{
		{ID: 1, Name: "Test-Item-1", TableName: "Test-Table-1", ExtensionID: 10000, Typecode: 1, CreationDate: time.Now()},
		{ID: 2, Name: "Test-Item-2", TableName: "Test-Table-2", ExtensionID: 10001, Typecode: 1, CreationDate: time.Now()},
	}

	returnRows := sqlmock.NewRows([]string{"id", "name", "table_name", "typecode", "extension_id", "creation_date"}).
		AddRow(testItems[0].ID, testItems[0].Name, testItems[0].TableName, testItems[0].Typecode, testItems[0].ExtensionID, testItems[0].CreationDate).
		AddRow(testItems[1].ID, testItems[1].Name, testItems[1].TableName, testItems[1].Typecode, testItems[1].ExtensionID, testItems[1].CreationDate)
	mockReadAllItemsQuery(mock, returnRows)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
	}
	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/items")
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusOK, t)

	responseItem := getResponseItems(resp, t)
	for i, item := range responseItem.Items {
		if item.ID != testItems[i].ID ||
			item.Name != testItems[i].Name ||
			item.TableName != testItems[i].TableName ||
			item.ExtensionID != testItems[i].ExtensionID ||
			item.Typecode != testItems[i].Typecode ||
			!item.CreationDate.Equal(testItems[i].CreationDate) {
			t.Errorf("Expected item to be %v, got %v", testItems[i], item)
		}
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemRouteReturnsStatusInternalServerErrorWhenDatabaseReturnsError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	mockReadAllItemsQueryReturnsError(mock)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
	}
	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/items")
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusInternalServerError, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestProjectRouteReturnsStatusInternalServerErrorWhenDatabaseReturnsError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	mockReadAllProjectsQueryReturnsError(mock)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/projects")
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusInternalServerError, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsDetailsRouteReturnsAllItemsDetails(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	itemsDetails := []data.ItemDetail{
		{Scope: "Shared", Project: "Test-Project-1", Extension: "Test-Extension-1", ItemName: "Test-Item-1", ItemTableName: "Test-Table-1", Typecode: 1},
		{Scope: "Shared", Project: "Test-Project-2", Extension: "Test-Extension-2", ItemName: "Test-Item-2", ItemTableName: "Test-Table-2", Typecode: 2},
	}

	returnRows := sqlmock.NewRows([]string{"scope", "project", "extension", "name", "table_name", "typecode"}).
		AddRow(itemsDetails[0].Scope, itemsDetails[0].Project, itemsDetails[0].Extension, itemsDetails[0].ItemName, itemsDetails[0].ItemTableName, itemsDetails[0].Typecode).
		AddRow(itemsDetails[1].Scope, itemsDetails[1].Project, itemsDetails[1].Extension, itemsDetails[1].ItemName, itemsDetails[1].ItemTableName, itemsDetails[1].Typecode)

	mockReadAllItemsDetailsQuery(mock, returnRows)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/items/details")
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusOK, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsDetailsRouteReturnsInternalServerErrorWhenDatabaseReturnsError(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
	}

	mockReadAllItemsDetailsQueryReturnsError(mock)

	logger := zerolog.New(os.Stdout)

	// Create a new application with the mock ItemModel
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
	}

	// Mock HTTP Request
	server := httptest.NewServer(app.route())
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/items/details")
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusInternalServerError, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}
