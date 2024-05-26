package data

import (
	"database/sql"
	"errors"
	"time"
)

// Item represents detailed information about an item, including relevant
// data about its associated extension and project. It is used to structure the
// data retrieved from the database. /items/1
type Item struct {
	ID           int64     `json:"id"`
	Scope        string    `json:"scope"`
	Project      string    `json:"project"`
	Name         string    `json:"name"`
	TableName    string    `json:"table_name"`
	ExtensionID  int64     `json:"extension_id"`
	Typecode     int32     `json:"typecode"`
	CreationDate time.Time `json:"creation_date"`
}

// ItemModel wraps the database connection pool.
type ItemModel struct {
	DB *sql.DB
	Tx *sql.Tx
}

// Insert adds a new item to the database.
// It returns an error if the SQL query or scan fails.
func (i *ItemModel) Insert(item *Item) error {
	query := `INSERT INTO item (name, extension_id, table_name, typecode)
		VALUES ($1, $2, $3, $4)
		RETURNING id, creation_date`

	args := []interface{}{item.Name, item.ExtensionID, item.TableName, item.Typecode}

	if i.Tx != nil {
		return i.Tx.QueryRow(query, args...).Scan(&item.ID, &item.CreationDate)
	}

	return i.DB.QueryRow(query, args...).Scan(&item.ID, &item.CreationDate)
}

// ReadItems executes a SQL query to retrieve detailed information about items.
// The information includes the scope of the extension, the name of the project,
// the name of the extension, the name of the item, the table name of the item, and
// the type code of the item. The method returns a slice of ItemDetail and an error.
// On success, the slice contains the queried item details. If an error occurs during
// the query execution or while reading the results, the corresponding error is returned.
func (i *ItemModel) ReadItems() ([]Item, error) {
	query := `SELECT item.id,
	    extension.scope, 
       COALESCE(project.name, '-') AS project_name,
       item.name, 
       item.table_name,
       extension.id, 
       item.typecode,
	   item.creation_date
	FROM item
	JOIN extension ON item.extension_id = extension.id
	LEFT JOIN project ON extension.project_id = project.id`

	rows, err := i.DB.Query(query)
	if err != nil {
		return nil, err
	}

	var items []Item

	for rows.Next() {
		var item Item
		err = rows.Scan(&item.ID, &item.Scope, &item.Project, &item.Name, &item.TableName, &item.ExtensionID, &item.Typecode, &item.CreationDate)
		items = append(items, item)
	}

	if err != nil {
		return nil, err
	}

	err = rows.Close()

	return items, err
}

// GetNextSharedFreeTypecode returns the next available typecode for a given scope within a specified range.
// It returns a sql.NullInt32 and an error.
// If an error occurs during the database query or while scanning the row, it will return the error.
func (i *ItemModel) GetNextSharedFreeTypecode(scope string, rangeStart int32, rangeEnd int32) (sql.NullInt32, error) {
	query := `
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
		AND e.min_typecode + 1 <= $2;
    `

	var nextFreeTypecode sql.NullInt32
	err := i.DB.QueryRow(query, rangeStart, rangeEnd, scope).Scan(&nextFreeTypecode)
	return nextFreeTypecode, err
}

// GetNextProjectFreeTypeCode returns the next available typecode for a given project within a specified range.
// It returns a sql.NullInt32 and an error.
// If an error occurs during the database query or while scanning the row, it will return the error.
func (i *ItemModel) GetNextProjectFreeTypeCode(projectId int64, rangeStart, rangeEnd int32) (sql.NullInt32, error) {
	query := `
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
	`

	var nextFreeTypecode sql.NullInt32
	err := i.DB.QueryRow(query, projectId, rangeStart, rangeEnd).Scan(&nextFreeTypecode)
	return nextFreeTypecode, err
}

func (i *ItemModel) ReadItem(id int64) (Item, error) {
	query := `SELECT item.id,
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
	WHERE item.id = $1`

	var item Item
	err := i.DB.QueryRow(query, id).Scan(&item.ID, &item.Scope, &item.Project, &item.Name, &item.TableName, &item.ExtensionID, &item.Typecode, &item.CreationDate)
	return item, err
}

func (i *ItemModel) DeleteItem(id int64) error {
	query := `DELETE FROM item WHERE id = $1`
	result, err := i.DB.Exec(query, id)
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

// UpdateItem updates an existing item in the database.
// It returns an error if the SQL query fails.
func (i *ItemModel) UpdateItem(d *Item) error {
	query := `UPDATE item
	SET name = $1, table_name = $2
	WHERE id = $3
	AND (name != $1 OR table_name != $2)`
	_, err := i.DB.Exec(query, d.Name, d.TableName, d.ID)
	return err
}

func (i *ItemModel) BeginTransaction() error {
	tx, err := i.DB.Begin()
	if err != nil {
		return err
	}
	i.Tx = tx
	return nil
}

func (i *ItemModel) Rollback() error {
	if i.Tx != nil {
		err := i.Tx.Rollback()
		if err != nil {
			return err
		}
		i.Tx = nil
	}
	return nil
}

func (i *ItemModel) CommitTransaction() error {
	if i.Tx != nil {
		err := i.Tx.Commit()
		if err != nil {
			return err
		}
		i.Tx = nil
	}
	return nil
}

func (i *ItemModel) DeleteItemsByExtension(extensionID int64) error {
	query := `DELETE FROM item WHERE extension_id = $1`
	_, err := i.DB.Exec(query, extensionID)
	return err
}
