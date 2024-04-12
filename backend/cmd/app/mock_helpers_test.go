package main

import (
	"database/sql/driver"
	"errors"
	"github.com/DATA-DOG/go-sqlmock"
	"regexp"
)

func mockReadExtensionByIDQuery(mock sqlmock.Sqlmock, args []driver.Value, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`
	    SELECT id, project_id, name, description, scope, creation_date
	    FROM extension
	    WHERE id = $1`)
	mock.ExpectQuery(query).WithArgs(args...).WillReturnRows(returnRows)
}

func mockReadAllExtensionsQuery(mock sqlmock.Sqlmock, scope string, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`
	    SELECT * FROM extension
		WHERE scope = $1
		ORDER BY id`)

	mock.ExpectQuery(query).WithArgs(scope).WillReturnRows(returnRows)
}

func mockReadAllItemsQuery(mock sqlmock.Sqlmock, returnRows *sqlmock.Rows) {
	query := regexp.QuoteMeta(`
		SELECT id, name, table_name, typecode, extension_id, creation_date
		FROM item
		ORDER BY id`)

	mock.ExpectQuery(query).WillReturnRows(returnRows)
}

func mockReadAllItemsQueryReturnsError(mock sqlmock.Sqlmock) {
	query := regexp.QuoteMeta(`
		SELECT id, name, table_name, typecode, extension_id, creation_date
		FROM item
		ORDER BY id`)

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
	query := regexp.QuoteMeta(`
		INSERT INTO item (name, extension_id, table_name, typecode) 
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
