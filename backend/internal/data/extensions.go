package data

import (
	"database/sql"
	"encoding/json"
	"errors"
	"time"
)

// NullInt64 Helper type to handle nullable int32 values.
type NullInt64 struct {
	sql.NullInt64
}

// MarshalJSON returns the JSON encoding of the NullInt64.
func (v NullInt64) MarshalJSON() ([]byte, error) {
	if v.Valid {
		return json.Marshal(v.Int64)
	} else {
		return json.Marshal(nil)
	}
}

// Extension represents an extension in the database.
type Extension struct {
	ID           int64     `json:"id"`
	ProjectID    NullInt64 `json:"project_id,omitempty"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Scope        string    `json:"scope"`
	CreationDate time.Time `json:"creation_date"`
	ItemCount    int       `json:"item_count,omitempty"`
}

// ExtensionModel wraps the database connection pool.
type ExtensionModel struct {
	DB *sql.DB
}

// Read retrieves an extension with the specified ID from the database.
// It returns a pointer to an Extension struct and an error.
// If an error occurs during the database query or while scanning the row, it will return the error.
func (e ExtensionModel) Read(id int64) (*Extension, error) {
	if id < 1 {
		return nil, errors.New("record not found")
	}

	query := `
		SELECT e.id, e.project_id, e.name, e.description, e.scope, e.creation_date, COUNT(i.id) AS item_count
		FROM extension e
		LEFT JOIN item i ON e.id = i.extension_id
		WHERE e.id = $1
		GROUP BY e.id`

	var extension Extension

	err := e.DB.QueryRow(query, id).Scan(
		&extension.ID,
		&extension.ProjectID,
		&extension.Name,
		&extension.Description,
		&extension.Scope,
		&extension.CreationDate,
		&extension.ItemCount, // Hier fügst du das neue Feld hinzu
	)

	if err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return nil, errors.New("record not found")
		default:
			return nil, err
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
func (e ExtensionModel) ReadAll(scope ...string) ([]*Extension, error) {
	var query string
	var rows *sql.Rows
	var err error

	if len(scope) > 0 && scope[0] != "" {
		query = `
            SELECT e.id, e.project_id, e.name, e.description, e.scope, e.creation_date, COUNT(i.id) AS item_count
            FROM extension e
            LEFT JOIN item i ON e.id = i.extension_id
            WHERE LOWER(e.scope) = LOWER($1)
            GROUP BY e.id
            ORDER BY e.id`
		rows, err = e.DB.Query(query, scope[0])
	} else {
		query = `
            SELECT e.id, e.project_id, e.name, e.description, e.scope, e.creation_date, COUNT(i.id) AS item_count
            FROM extension e
            LEFT JOIN item i ON e.id = i.extension_id
            GROUP BY e.id
            ORDER BY e.id`
		rows, err = e.DB.Query(query)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var extensions []*Extension
	for rows.Next() {
		var extension Extension
		err = rows.Scan(
			&extension.ID,
			&extension.ProjectID,
			&extension.Name,
			&extension.Description,
			&extension.Scope,
			&extension.CreationDate,
			&extension.ItemCount)

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

func (e ExtensionModel) Insert(d *Extension) error {
	query := `
		INSERT INTO extension (name, description, scope, project_id)
		VALUES ($1, $2, $3, $4)
		RETURNING id, creation_date`

	args := []interface{}{d.Name, d.Description, d.Scope, d.ProjectID}
	return e.DB.QueryRow(query, args...).Scan(&d.ID, &d.CreationDate)
}

func (e ExtensionModel) Update(d *Extension, altName, altDescription string) error {
	query := `
        UPDATE extension
        SET name = COALESCE(NULLIF($1, ''), name), 
            description = $2
        WHERE id = $3`

	args := []interface{}{altName, altDescription, d.ID}
	result, err := e.DB.Exec(query, args...)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("no record found")
	}

	return nil
}

// Delete removes an extension with the specified ID from the database.
// It returns an error if the deletion fails or if no record is found with the given ID.
//
// Parameters:
// id (int64): The ID of the extension to delete.
//
// Returns:
// error: An error that will be nil if the deletion was successful, or an error message if failed.
func (e ExtensionModel) Delete(id int64) error {
	query := `DELETE FROM extension WHERE id = $1`

	result, err := e.DB.Exec(query, id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("no record found")
	}

	return nil
}
