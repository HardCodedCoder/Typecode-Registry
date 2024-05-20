package main

import (
	"Typecode-Registry/internal/data"
	"bytes"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"github.com/DATA-DOG/go-sqlmock"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"
	"time"
)

func setupUpdateTest(mock sqlmock.Sqlmock, app *application, item data.Item, result driver.Result, err error) (*httptest.ResponseRecorder, sqlmock.Sqlmock) {
	body, _ := json.Marshal(item)
	req, _ := http.NewRequest(http.MethodPut, "/items/1", bytes.NewBuffer(body))
	resp := httptest.NewRecorder()

	query := `UPDATE item
    SET name = $1, table_name = $2
    WHERE id = $3
    AND (name != $1 OR table_name != $2)`
	exec := mock.ExpectExec(regexp.QuoteMeta(query)).WithArgs(item.Name, item.TableName, item.ID)
	if result != nil {
		exec.WillReturnResult(result)
	} else if err != nil {
		exec.WillReturnError(err)
	}

	app.updateItem(resp, req)
	return resp, mock
}

func setupExtensionsMock(mock sqlmock.Sqlmock, scope string) {
	extensions := []data.Extension{
		{ID: 1, Name: "Test-Extension-1", Description: "Test-Description-1", Scope: "Project", CreationDate: time.Now(), ItemCount: 1},
		{ID: 3, Name: "Test-Extension-3", Description: "Test-Description-3", Scope: "Project", CreationDate: time.Now(), ItemCount: 2},
	}

	returnRows := sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date", "item_count"}).
		AddRow(extensions[0].ID, extensions[0].ProjectID.Int64, extensions[0].Name, extensions[0].Description, extensions[0].Scope, extensions[0].CreationDate, extensions[0].ItemCount).
		AddRow(extensions[1].ID, extensions[1].ProjectID.Int64, extensions[1].Name, extensions[1].Description, extensions[1].Scope, extensions[1].CreationDate, extensions[1].ItemCount)
	mockReadAllExtensionsQuery(mock, scope, returnRows)
}

func setupExtensionMock(mock sqlmock.Sqlmock, id int64, projectId sql.NullInt64, scope, name, description string, itemCount int, returnRow bool) {
	extensionArgs := []driver.Value{id}
	var extensionRows *sqlmock.Rows
	if returnRow {
		extensionRows = sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date", "item_count"}).
			AddRow(id, projectId, name, description, scope, time.Now(), itemCount)
	} else {
		extensionRows = sqlmock.NewRows([]string{"id", "project_id", "name", "description", "scope", "creation_date", "item_count"})
	}

	mockReadExtensionByIDQuery(mock, extensionArgs, extensionRows)
}

func setupTypecodeMock(mock sqlmock.Sqlmock, scope string, lastTypecode, nextTypecode int32) {
	typecodeArgs := []driver.Value{lastTypecode, int32(^uint32(0) >> 1), scope}
	typecodeRows := sqlmock.NewRows([]string{"next_free_typecode"}).AddRow(nextTypecode)
	mockTypecodeQuery(mock, typecodeArgs, typecodeRows)
}

func setupNextFreeTypecodeMock(mock sqlmock.Sqlmock, projectId int64, scopeLowRange, scopeHighRange, nextTypecode int32) {
	typecodeArgs := []driver.Value{projectId, scopeLowRange, scopeHighRange}
	typecodeRows := sqlmock.NewRows([]string{"next_free_typecode"}).AddRow(nextTypecode)
	mockGetNextProjectFreeTypecodeQuery(mock, typecodeArgs, typecodeRows)
}

func setupInsertItemMock(mock sqlmock.Sqlmock, name string, extensionID int64, tableName string, typecode int32) {
	insertArgs := []driver.Value{name, extensionID, tableName, typecode}
	insertRows := sqlmock.NewRows([]string{"id", "creation_date"}).AddRow(1, time.Now())
	mockInsertItemQuery(mock, insertArgs, insertRows)
}

func mockHTTPGetRequest(app *application, t *testing.T, path string, status int) {
	server := setupHTTPServer(app)
	defer server.Close()

	resp, err := http.Get("http://" + server.Listener.Addr().String() + path)
	if err != nil {
		t.Fatal(err)
	}

	checkHTTPResponse(resp, status, t)
}

func mockDeleteItemExecution(mock sqlmock.Sqlmock, id int, lastInsertID int64, rowsAffected int64) {
	query := regexp.QuoteMeta(`DELETE FROM item WHERE id = $1`)
	mock.ExpectExec(query).WithArgs(id).WillReturnResult(sqlmock.NewResult(lastInsertID, rowsAffected))
}

func setupReadProjectNameMock(mock sqlmock.Sqlmock, id int64, name string) {
	query := regexp.QuoteMeta(`SELECT name FROM project WHERE id = $1`)
	mock.ExpectQuery(query).WithArgs(id).WillReturnRows(sqlmock.NewRows([]string{"name"}).AddRow(name))
}

func mockReadExtensionByIDQuery(mock sqlmock.Sqlmock, args []driver.Value, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`
	   	SELECT e.id, e.project_id, e.name, e.description, e.scope, e.creation_date, COUNT(i.id) AS item_count
		FROM extension e
		LEFT JOIN item i ON e.id = i.extension_id
		WHERE e.id = $1
		GROUP BY e.id`)
	mock.ExpectQuery(query).WithArgs(args...).WillReturnRows(returnRows)
}

func mockReadAllExtensionsQuery(mock sqlmock.Sqlmock, scope string, returnRows *sqlmock.Rows) {
	var query string
	if len(scope) == 0 {
		query = regexp.QuoteMeta(`
		SELECT e.id, e.project_id, e.name, e.description, e.scope, e.creation_date, COUNT(i.id) AS item_count
		FROM extension e
		LEFT JOIN item i ON e.id = i.extension_id
		GROUP BY e.id
		ORDER BY e.id`)
		if returnRows != nil {
			mock.ExpectQuery(query).WillReturnRows(returnRows)
		} else {
			mock.ExpectQuery(query).WillReturnError(errors.New("mock error"))
		}
	} else {
		query = regexp.QuoteMeta(`
		SELECT e.id, e.project_id, e.name, e.description, e.scope, e.creation_date, COUNT(i.id) AS item_count
		FROM extension e
		LEFT JOIN item i ON e.id = i.extension_id
		WHERE LOWER(e.scope) = LOWER($1)
		GROUP BY e.id
		ORDER BY e.id`)
		if returnRows != nil {
			mock.ExpectQuery(query).WithArgs(scope).WillReturnRows(returnRows)
		} else {
			mock.ExpectQuery(query).WillReturnError(errors.New("mock error"))
		}
	}
}

func mockReadAllItemsQuery(mock sqlmock.Sqlmock, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`SELECT item.id,
	    extension.scope, 
       COALESCE(project.name, '-') AS project_name,
       item.name, 
       item.table_name,
       extension.id, 
       item.typecode,
	   item.creation_date
	FROM item
	JOIN extension ON item.extension_id = extension.id
	LEFT JOIN project ON extension.project_id = project.id`)

	mock.ExpectQuery(query).WillReturnRows(returnRows)
}

func mockReadAllItemsQueryReturnsError(mock sqlmock.Sqlmock) {
	query := regexp.QuoteMeta(`SELECT item.id,
	    extension.scope, 
       COALESCE(project.name, '-') AS project_name,
       item.name, 
       item.table_name,
       extension.id, 
       item.typecode,
	   item.creation_date
	FROM item
	JOIN extension ON item.extension_id = extension.id
	LEFT JOIN project ON extension.project_id = project.id`)

	mock.ExpectQuery(query).WillReturnError(errors.New("mock error"))
}

func mockReadAllProjectsQuery(mock sqlmock.Sqlmock, rows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`SELECT * FROM project ORDER BY id`)
	mock.ExpectQuery(query).WillReturnRows(rows)
}

func mockReadAllProjectsQueryReturnsError(mock sqlmock.Sqlmock) {
	query := regexp.QuoteMeta(`SELECT * FROM project ORDER BY id`)
	mock.ExpectQuery(query).WillReturnError(errors.New("mock error"))
}

func mockTypecodeQuery(mock sqlmock.Sqlmock, args []driver.Value, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`
	    SELECT MIN(e.min_typecode + 1)
	    FROM (
	        SELECT typecode AS min_typecode
	        FROM item
	        WHERE extension_id IN (SELECT id FROM extension WHERE scope = $3)
	        AND typecode >= $1 AND typecode < $2
	        ORDER BY typecode
	    ) AS e
	    WHERE NOT EXISTS (
	        SELECT 1
	        FROM item
	        WHERE typecode = e.min_typecode + 1
	        AND extension_id IN (SELECT id FROM extension WHERE scope = $3)
	    )
	    AND e.min_typecode + 1 <= $2`)
	mock.ExpectQuery(query).WithArgs(args...).WillReturnRows(returnRows)
}

func mockInsertItemQuery(mock sqlmock.Sqlmock, args []driver.Value, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(
		`INSERT INTO item (name, extension_id, table_name, typecode)
		VALUES ($1, $2, $3, $4)
		RETURNING id, creation_date`)
	mock.ExpectQuery(query).WithArgs(args...).WillReturnRows(returnRows)
}

func mockInsertItemQueryToReturnError(mock sqlmock.Sqlmock, args []driver.Value) {
	query := regexp.QuoteMeta(`
		INSERT INTO item (name, extension_id, table_name, typecode)
		VALUES ($1, $2, $3, $4)
		RETURNING id, creation_date`)
	mock.ExpectQuery(query).WithArgs(args...).WillReturnError(errors.New("mock error"))
}

func mockReadItemDetailByItemIdQuery(mock sqlmock.Sqlmock, id int64, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`SELECT item.id,
	    extension.scope, 
       COALESCE(project.name, '-') AS project_name,
       item.name, 
       item.table_name,
       extension.id, 
       item.typecode,
	   item.creation_date
	FROM item
	JOIN extension ON item.extension_id = extension.id
	LEFT JOIN project ON extension.project_id = project.id
	WHERE item.id = $1`)
	mock.ExpectQuery(query).WithArgs(id).WillReturnRows(returnRows)
}

func mockReadItemByItemIdNoRowsFound(mock sqlmock.Sqlmock, id int64) {
	query := regexp.QuoteMeta(`SELECT item.id,
	    extension.scope, 
       COALESCE(project.name, '-') AS project_name,
       item.name, 
       item.table_name,
       extension.id, 
       item.typecode,
	   item.creation_date
	FROM item
	JOIN extension ON item.extension_id = extension.id
	LEFT JOIN project ON extension.project_id = project.id
	WHERE item.id = $1`)
	mock.ExpectQuery(query).WithArgs(id).WillReturnError(sql.ErrNoRows)
}

func mockGetNextProjectFreeTypecodeQuery(mock sqlmock.Sqlmock, args []driver.Value, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`
		WITH 
		typecode_range AS (
			-- Generate a series of numbers between $2 and $3, representing all possible typecodes
			-- within the desired range. $2 and $3 are placeholders for the start and end of the range,
			-- cast to INTEGER to ensure the correct data type is used (needed by the db driver)
			SELECT generate_series($2::INTEGER, $3::INTEGER) AS typecode
		),
		used_typecodes AS (
			-- Select all typecodes from the 'item' table that are within the specified project ($1)
			-- and also within the specified range ($2 to $3). This subquery identifies all typecodes
			-- already used in the given project and range.
			SELECT item.typecode
			FROM item
			JOIN extension ON item.extension_id = extension.id -- Join with 'extension' to link items to projects
			WHERE extension.project_id = $1 -- Filter to the specified project ID
			AND item.typecode BETWEEN $2::INTEGER AND $3::INTEGER -- Filter to the specified range
		)
		-- Select the minimum typecode from the generated series that isn't already used.
		-- This step finds the first "gap" or unused typecode in the range for the project.
		SELECT MIN(typecode_range.typecode) AS next_free_typecode
		FROM typecode_range
		LEFT JOIN used_typecodes ON typecode_range.typecode = used_typecodes.typecode -- Left join to find unused typecodes
		WHERE used_typecodes.typecode IS NULL; -- Filter to only consider typecodes not present in 'used_typecodes'
	`)
	mock.ExpectQuery(query).WithArgs(args...).WillReturnRows(returnRows)
}

func mockReadProjectNameReturnsError(mock sqlmock.Sqlmock, id int64) {
	query := regexp.QuoteMeta(`SELECT name FROM project WHERE id = $1`)
	mock.ExpectQuery(query).WithArgs(id).WillReturnError(errors.New("mock error"))
}

func mockUpdateExtensionQuery(mock sqlmock.Sqlmock, name, description string, id int64) {
	query := regexp.QuoteMeta(`
        UPDATE extension
        SET name = COALESCE(NULLIF($1, ''), name), 
            description = $2
        WHERE id = $3`)
	mock.ExpectExec(query).WithArgs(name, description, id).WillReturnResult(sqlmock.NewResult(1, 1))
}

func mockReadExtensionByIDQueryReturnsError(mock sqlmock.Sqlmock, id int64, err error) {
	query := regexp.QuoteMeta(`
       	SELECT e.id, e.project_id, e.name, e.description, e.scope, e.creation_date, COUNT(i.id) AS item_count
        FROM extension e
        LEFT JOIN item i ON e.id = i.extension_id
        WHERE e.id = $1
        GROUP BY e.id`)
	mock.ExpectQuery(query).WithArgs(id).WillReturnError(err)
}
