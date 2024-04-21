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

type ResponseItemDetail struct {
	Detail data.ItemDetail `json:"detail"`
}

type ResponseDetails struct {
	Details []data.ItemDetail `json:"details"`
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

func getResponse(resp *http.Response, result interface{}, t *testing.T) {
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}

	_ = json.Unmarshal(responseBody, result)
	err = resp.Body.Close()

	if err != nil {
		t.Fatal(err)
	}
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

func setupMockAndApp(t *testing.T) (*sql.DB, sqlmock.Sqlmock, *application) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Error initializing mock db: %s", err)
	}

	logger := zerolog.New(os.Stdout)
	app := &application{
		models: data.NewModels(db),
		logger: &logger,
	}
	return db, mock, app
}

func setupHTTPServer(app *application) *httptest.Server {
	return httptest.NewServer(app.route())
}

func testHTTPResponse(t *testing.T, resp *http.Response, expectedStatusCode int) {
	if resp.StatusCode != expectedStatusCode {
		t.Errorf("Expected status code %d, got %d", expectedStatusCode, resp.StatusCode)
	}
}

func getAndTestHTTPResponse(t *testing.T, server *httptest.Server, endpoint string, expectedStatusCode int) *http.Response {
	resp, err := http.Get(server.URL + endpoint)
	if err != nil {
		t.Fatalf("Failed to make GET request: %s", err)
	}
	testHTTPResponse(t, resp, expectedStatusCode)
	return resp
}

func deleteAndTestHTTPResponse(t *testing.T, server *httptest.Server, endpoint string, expectedStatusCode int) *http.Response {
	req, err := http.NewRequest(http.MethodDelete, server.URL+endpoint, nil)
	if err != nil {
		t.Fatalf("Failed to create DELETE request: %s", err)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("Failed to make DELETE request")
	}

	testHTTPResponse(t, resp, expectedStatusCode)
	return resp
}

func decodeHTTPResponse(t *testing.T, resp *http.Response, target interface{}) {
	if err := json.NewDecoder(resp.Body).Decode(target); err != nil {
		t.Fatalf("Failed to decode response: %s", err)
	}

	_ = resp.Body.Close()
}

func TestCreateItemReturnsInternalServerErrorWhenInsertFails(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	testExtension := data.Extension{
		ID:           1,
		ProjectID:    data.NullInt32{NullInt32: sql.NullInt32{Int32: 1}},
		Name:         "Test-Extension",
		Description:  "Test-Description",
		Scope:        "Shared",
		CreationDate: time.Now(),
	}

	itemReq := ItemRequest{
		Name:        "Test Item",
		TableName:   "Test Table",
		ExtensionId: 1,
	}

	setupExtensionMock(mock, itemReq.ExtensionId, sql.NullInt32{Int32: testExtension.ProjectID.Int32, Valid: true}, testExtension.Scope, testExtension.Name, testExtension.Description, true)
	setupTypecodeMock(mock, "Shared", data.ScopeRanges[data.ScopeShared].Start, data.ScopeRanges[data.ScopeShared].Start)

	insertArgs := []driver.Value{
		itemReq.Name,
		itemReq.ExtensionId,
		itemReq.TableName,
		20000,
	}

	mockInsertItemQueryToReturnError(mock, insertArgs)

	// Mock HTTP Request
	server := setupHTTPServer(app)
	defer server.Close()

	resp := sendMockHTTPRequest(server.URL, "/items", itemReq, t)

	checkHTTPResponse(resp, http.StatusInternalServerError, t)

	var responseItem ResponseItem
	getResponse(resp, &responseItem, t)
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
	db, mock, app := setupMockAndApp(t)

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

	setupExtensionMock(mock, itemReq.ExtensionId, sql.NullInt32{Int32: testExtension.ProjectID.Int32, Valid: true}, testExtension.Scope, testExtension.Name, testExtension.Description, true)
	setupTypecodeMock(mock, "Shared", data.ScopeRanges[data.ScopeShared].Start, data.ScopeRanges[data.ScopeShared].End)

	server := setupHTTPServer(app)
	defer server.Close()

	resp := sendMockHTTPRequest(
		server.URL,
		"/items",
		itemReq,
		t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal("The expectations of the database were not met!")
	}

	checkHTTPResponse(resp, http.StatusInternalServerError, t)

	var responseItem ResponseItem
	getResponse(resp, &responseItem, t)
	expectedResponseItem := ResponseItem{}
	if responseItem != expectedResponseItem {
		t.Fatalf("Expected nil response item, got %v", responseItem)
	}

	_ = db.Close()
}

func TestCallingExtensionsRoutePassingInvalidScopeReturnsStatusBadRequest(t *testing.T) {
	_, _, app := setupMockAndApp(t)

	server := setupHTTPServer(app)
	defer server.Close()

	_ = getAndTestHTTPResponse(t, server, "/extensions/invalid", http.StatusBadRequest)
}

func TestSendingNotExistingExtensionIDReturnsStatusNotFound(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	itemReq := ItemRequest{Name: "Test-Name", TableName: "Test-Table-Name", ExtensionId: 1}

	setupExtensionMock(mock, 1, sql.NullInt32{}, "dummy", "dummy", "dummy", false)

	server := setupHTTPServer(app)
	defer server.Close()

	resp := sendMockHTTPRequest(
		server.URL,
		"/items",
		itemReq,
		t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal("The expectations of the database were not met!")
	}

	checkHTTPResponse(resp, http.StatusNotFound, t)

	var responseItem ResponseItem
	getResponse(resp, &responseItem, t)

	expectedResponseItem := ResponseItem{}
	if responseItem != expectedResponseItem {
		t.Fatalf("Expected nil response item, got %v", responseItem)
	}

	_ = db.Close()
}

func TestEmptyRequestBodyFieldsReturnStatusBadRequest(t *testing.T) {
	_, _, app := setupMockAndApp(t)

	server := setupHTTPServer(app)
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
	_, _, app := setupMockAndApp(t)

	server := setupHTTPServer(app)
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
	db, mock, app := setupMockAndApp(t)

	projects := []data.Project{
		{ID: 1, Name: "Test-Project-1", Description: "Test-Description-1", CreationDate: time.Now()},
		{ID: 2, Name: "Test-Project-2", Description: "Test-Description-2", CreationDate: time.Now()},
	}

	returnRows := sqlmock.NewRows([]string{"id", "name", "description", "creation_date"}).
		AddRow(projects[0].ID, projects[0].Name, projects[0].Description, projects[0].CreationDate).
		AddRow(projects[1].ID, projects[1].Name, projects[1].Description, projects[1].CreationDate)
	mockReadAllProjectsQuery(mock, returnRows)

	// Mock HTTP Request
	server := setupHTTPServer(app)
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/projects")
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusOK, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestExtensionsRouteGetsAllExtensionsByScope(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	extensions := []data.Extension{
		{ID: 1, Name: "Test-Extension-1", Description: "Test-Description-1", Scope: "Project", CreationDate: time.Now()},
		{ID: 3, Name: "Test-Extension-3", Description: "Test-Description-3", Scope: "Project", CreationDate: time.Now()},
	}

	const scope = "Project"
	returnRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date"}).
		AddRow(extensions[0].ID, extensions[0].ProjectID.Int32, extensions[0].Name, extensions[0].Description, extensions[0].Scope, extensions[0].CreationDate).
		AddRow(extensions[1].ID, extensions[1].ProjectID.Int32, extensions[1].Name, extensions[1].Description, extensions[1].Scope, extensions[1].CreationDate)
	mockReadAllExtensionsQuery(mock, scope, returnRows)

	// Mock HTTP Request
	server := setupHTTPServer(app)
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + "/extensions" + "/" + scope)
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, http.StatusOK, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsRouteCreatesItemForProjectExtension(t *testing.T) {
	// Initialize Mock database.
	db, mock, app := setupMockAndApp(t)

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

	setupExtensionMock(mock, testExtension.ID, sql.NullInt32{Int32: testExtension.ProjectID.Int32, Valid: true}, testExtension.Scope, testExtension.Name, testExtension.Description, true)
	setupNextFreeTypecodeMock(mock, testExtension.ProjectID.Int32, data.ScopeRanges[data.ScopeProject].Start, data.ScopeRanges[data.ScopeProject].End, 14000)
	setupInsertItemMock(mock, itemRequest.Name, testExtension.ID, itemRequest.TableName, 14000)

	// Mock HTTP Request
	server := setupHTTPServer(app)
	defer server.Close()

	resp := sendMockHTTPRequest(server.URL, "/items", itemRequest, t)

	checkHTTPResponse(resp, http.StatusCreated, t)

	expectedValues := ExpectedItemValues{
		Name:        "Test-Item",
		TableName:   "Test-Item-Table",
		ExtensionID: 1,
		Typecode:    14000,
	}

	var responseItem ResponseItem
	getResponse(resp, &responseItem, t)
	checkResponseValues(responseItem, expectedValues, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsRouteCreatesItemForSharedExtension(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	setupExtensionMock(mock, 1, sql.NullInt32{}, "Shared", "Test-Extension", "Test-Description", true)
	setupTypecodeMock(mock, "Shared", 20000, 20001)
	setupInsertItemMock(mock, "Test-Item", 1, "Test-Item-Table-Name", 20001)

	server := setupHTTPServer(app)
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

	var responseItem ResponseItem
	getResponse(resp, &responseItem, t)
	checkResponseValues(responseItem, expectedValues, t)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestReturnedServeMuxIsNotNil(t *testing.T) {
	app := application{}
	mux := app.route()
	if mux == nil {
		t.Errorf("Expected ServeMux to be not nil, got nil")
	}
}

func TestIfInvalidRoutesHTTPMethodsReturnMethodNotAllowed(t *testing.T) {
	_, _, app := setupMockAndApp(t)
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
		{"/healthcheck", "HEAD", http.StatusMethodNotAllowed},
		{"/healthcheck", "POST", http.StatusMethodNotAllowed},
		{"/healthcheck", "PUT", http.StatusMethodNotAllowed},
		{"/healthcheck", "DELETE", http.StatusMethodNotAllowed},
		{"/healthcheck", "CONNECT", http.StatusMethodNotAllowed},
		{"/healthcheck", "HEAD", http.StatusMethodNotAllowed},
		{"/healthcheck", "OPTIONS", http.StatusMethodNotAllowed},
		{"/healthcheck", "TRACE", http.StatusMethodNotAllowed},
		{"/healthcheck", "PATCH", http.StatusMethodNotAllowed},
		{"/projects", "HEAD", http.StatusMethodNotAllowed},
		{"/projects", "POST", http.StatusMethodNotAllowed},
		{"/projects", "PUT", http.StatusMethodNotAllowed},
		{"/projects", "DELETE", http.StatusMethodNotAllowed},
		{"/projects", "CONNECT", http.StatusMethodNotAllowed},
		{"/projects", "HEAD", http.StatusMethodNotAllowed},
		{"/projects", "OPTIONS", http.StatusMethodNotAllowed},
		{"/projects", "TRACE", http.StatusMethodNotAllowed},
		{"/projects", "PATCH", http.StatusMethodNotAllowed},
		{"/items/details/1", "PUT", http.StatusMethodNotAllowed},
		{"/items/details/1", "PATCH", http.StatusMethodNotAllowed},
		{"/items/details/1", "DELETE", http.StatusMethodNotAllowed},
		{"/items/details/1", "HEAD", http.StatusMethodNotAllowed},
		{"/items/details/1", "CONNECT", http.StatusMethodNotAllowed},
		{"/items/details/1", "OPTIONS", http.StatusMethodNotAllowed},
		{"/items/details/1", "TRACE", http.StatusMethodNotAllowed},
	}

	testRouting(t, tests, mux)
}

func TestIfHealthCheckRouteReturnsStatusCodeOk(t *testing.T) {
	_, _, app := setupMockAndApp(t)
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
	_, _, app := setupMockAndApp(t)
	mux := app.route()

	testServer := httptest.NewServer(mux)
	defer testServer.Close()

	test := []TestRoute{
		{"/items/abc", "GET", http.StatusBadRequest},
		{"/items/abc", "PUT", http.StatusBadRequest},
		{"/items/abc", "DELETE", http.StatusBadRequest},
		{"/items/details/abc", "GET", http.StatusBadRequest},
	}

	testRouting(t, test, mux)
}

func TestItemRouteReturnsAllItems(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	testItems := []data.Item{
		{ID: 1, Name: "Test-Item-1", TableName: "Test-Table-1", ExtensionID: 10000, Typecode: 1, CreationDate: time.Now()},
		{ID: 2, Name: "Test-Item-2", TableName: "Test-Table-2", ExtensionID: 10001, Typecode: 1, CreationDate: time.Now()},
	}

	returnRows := sqlmock.NewRows([]string{"id", "name", "table_name", "typecode", "extension_id", "creation_date"}).
		AddRow(testItems[0].ID, testItems[0].Name, testItems[0].TableName, testItems[0].Typecode, testItems[0].ExtensionID, testItems[0].CreationDate).
		AddRow(testItems[1].ID, testItems[1].Name, testItems[1].TableName, testItems[1].Typecode, testItems[1].ExtensionID, testItems[1].CreationDate)
	mockReadAllItemsQuery(mock, returnRows)

	server := setupHTTPServer(app)
	defer server.Close()

	resp := getAndTestHTTPResponse(t, server, "/items", http.StatusOK)

	var responseItems ResponseItems
	getResponse(resp, &responseItems, t)
	for i, item := range responseItems.Items {
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
	db, mock, app := setupMockAndApp(t)

	mockReadAllItemsQueryReturnsError(mock)

	// Mock HTTP Request
	server := setupHTTPServer(app)
	defer server.Close()

	_ = getAndTestHTTPResponse(t, server, "/items", http.StatusInternalServerError)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestProjectRouteReturnsStatusInternalServerErrorWhenDatabaseReturnsError(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	mockReadAllProjectsQueryReturnsError(mock)

	server := setupHTTPServer(app)
	defer server.Close()

	_ = getAndTestHTTPResponse(t, server, "/projects", http.StatusInternalServerError)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsDetailsRouteReturnsAllItemsDetails(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	itemsDetails := []data.ItemDetail{
		{Scope: "Shared", Project: "-", Extension: "Test-Extension-1", ItemName: "Test-Item-1", ItemTableName: "Test-Table-1", Typecode: 1},
		{Scope: "Project", Project: "Test-Project-1", Extension: "Test-Extension-2", ItemName: "Test-Item-2", ItemTableName: "Test-Table-2", Typecode: 2},
	}

	returnRows := sqlmock.NewRows([]string{"scope", "project", "extension", "name", "table_name", "typecode"}).
		AddRow(itemsDetails[0].Scope, itemsDetails[0].Project, itemsDetails[0].Extension, itemsDetails[0].ItemName, itemsDetails[0].ItemTableName, itemsDetails[0].Typecode).
		AddRow(itemsDetails[1].Scope, itemsDetails[1].Project, itemsDetails[1].Extension, itemsDetails[1].ItemName, itemsDetails[1].ItemTableName, itemsDetails[1].Typecode)

	mockReadAllItemsDetailsQuery(mock, returnRows)

	server := setupHTTPServer(app)
	defer server.Close()

	resp := getAndTestHTTPResponse(t, server, "/items/details", http.StatusOK)

	var responseDetails ResponseDetails
	decodeHTTPResponse(t, resp, &responseDetails)

	for i, itemDetail := range responseDetails.Details {
		if itemDetail != itemsDetails[i] {
			t.Errorf("Expected item detail to be %v, got %v", itemsDetails[i], itemDetail)
		}
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsDetailsRouteReturnsInternalServerErrorWhenDatabaseReturnsError(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	mockReadAllItemsDetailsQueryReturnsError(mock)

	server := setupHTTPServer(app)
	defer server.Close()

	_ = getAndTestHTTPResponse(t, server, "/items/details", http.StatusInternalServerError)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsDetailRouteReturnsSpecificItemDetailById(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	itemDetail := data.ItemDetail{
		Scope:         "Shared",
		Project:       "-",
		Extension:     "Test-Extension-1",
		ItemName:      "Test-Item-1",
		ItemTableName: "Test-Table-1",
		Typecode:      1,
	}

	returnRow := sqlmock.NewRows([]string{"scope", "project", "extension", "name", "table_name", "typecode"}).AddRow(
		itemDetail.Scope, itemDetail.Project, itemDetail.Extension, itemDetail.ItemName, itemDetail.ItemTableName, itemDetail.Typecode)
	mockReadItemDetailByItemIdQuery(mock, 1, returnRow)

	server := setupHTTPServer(app)
	defer server.Close()

	resp := getAndTestHTTPResponse(t, server, "/items/details/1", http.StatusOK)

	var responseItemDetail ResponseItemDetail
	decodeHTTPResponse(t, resp, &responseItemDetail)

	if responseItemDetail.Detail != itemDetail {
		t.Errorf("Expected item detail to be %v, got %v", itemDetail, responseItemDetail.Detail)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsDetailRouteIdReturnsStatusNotFoundWhenItemDetailDoesNotExist(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	mockReadItemDetailByItemIdNoRowsFound(mock, 1)

	server := setupHTTPServer(app)
	defer server.Close()

	_ = getAndTestHTTPResponse(t, server, "/items/details/1", http.StatusNotFound)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestItemsDetailRouteIdReturnsStatusInternalServerErrorWhenDatabaseReturnsError(t *testing.T) {
	db, mock, app := setupMockAndApp(t)

	mockReadItemDetailByItemIdReturnsError(mock, 1)

	// Mock HTTP Request
	server := setupHTTPServer(app)
	defer server.Close()

	_ = getAndTestHTTPResponse(t, server, "/items/details/1", http.StatusInternalServerError)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestIfItemsRouteHTTPDeleteRequestDeletesItemInDatabase(t *testing.T) {
	db, mock, app := setupMockAndApp(t)
	dummyItemId := 1

	mockDeleteItemExecution(mock, dummyItemId, 0, 1)

	server := setupHTTPServer(app)
	defer server.Close()

	_ = deleteAndTestHTTPResponse(t, server, fmt.Sprintf("/items/%d", dummyItemId), http.StatusNoContent)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}

func TestIfNoRowDeletedStatusInternalServerErrorIsReturned(t *testing.T) {
	db, mock, app := setupMockAndApp(t)
	dummyItemId := 1

	mockDeleteItemExecution(mock, dummyItemId, 0, 0)

	server := setupHTTPServer(app)
	defer server.Close()

	_ = deleteAndTestHTTPResponse(t, server, fmt.Sprintf("/items/%d", dummyItemId), http.StatusInternalServerError)

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("there were unfulfilled expectations: %s", err)
	}

	_ = db.Close()
}
