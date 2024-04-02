package data

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"
)

type NullInt32 struct {
	sql.NullInt32
}

func (v NullInt32) MarshalJSON() ([]byte, error) {
	if v.Valid {
		return json.Marshal(v.Int32)
	} else {
		return json.Marshal(nil)
	}
}

type Extension struct {
	ID           int64     `json:"id"`
	ProjectID    NullInt32 `json:"project_id,omitempty"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Scope        string    `json:"scope"`
	CreationDate time.Time `json:"creation_date"`
}

type ExtensionModel struct {
	DB *sql.DB
}

func (e ExtensionModel) Read(id int64) (*Extension, error) {
	if id < 1 {
		return nil, errors.New("record not found")
	}

	query := `
		SELECT id, project_id, name, description, scope, creation_date
		FROM extension
		WHERE id = $1`

	var extension Extension

	err := e.DB.QueryRow(query, id).Scan(
		&extension.ID,
		&extension.ProjectID,
		&extension.Name,
		&extension.Description,
		&extension.Scope,
		&extension.CreationDate,
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, errors.New("record not found")
		}
	}

	return &extension, nil
}

// ReadAll retrieves all extensions with the specified scope from the database.
// It returns a slice of pointers to Extension structs and an error.
// If an error occurs during the database query or while scanning the rows, it will return the error.
// If no error occurs, it returns the slice of extensions and a nil error.
//
// The function first prepares the SQL query to select all extensions with the specified scope.
// It then executes the query using the DB field of the ExtensionModel receiver.
//
// After all rows have been processed, the function checks for any error that occurred during the iteration.
// If an error occurred, it returns the error. Otherwise, it returns the slice of extensions and a nil error.
//
// The rows returned by the query are always closed before the function returns, regardless of whether an error occurred.
//
// Parameters:
// scope (string): The scope of the extensions to retrieve.
//
// Returns:
// []*Extension: A slice of pointers to the retrieved Extension structs.
// error: An error that will be nil if no errors occurred.
func (e ExtensionModel) ReadAll(scope string) (extensions []*Extension, err error) {
	query := `
		SELECT * FROM extension
		WHERE scope = $1
		ORDER BY id`
	extensions = nil

	rows, err := e.DB.Query(query, scope)
	if err != nil {
		return nil, err
	}

	defer func(rows *sql.Rows) {
		_ = rows.Close()
	}(rows)

	extensions = []*Extension{}

	for rows.Next() {
		var extension Extension

		err = rows.Scan(
			&extension.ID,
			&extension.ProjectID,
			&extension.Name,
			&extension.Description,
			&extension.Scope,
			&extension.CreationDate)

		if err != nil {
			return nil, err
		}

		extensions = append(extensions, &extension)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return extensions, nil
}
