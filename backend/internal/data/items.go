package data

import (
	"database/sql"
	"time"
)

// Item represents an item in the database.
type Item struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	TableName    string    `json:"table_name"`
	Typecode     int32     `json:"typecode"`
	ExtensionID  int64     `json:"extension_id"`
	CreationDate time.Time `json:"creation_date"`
}

// ItemDetail represents detailed information about an item, including relevant
// data about its associated extension and project. It is used to structure the
// data retrieved from the database.
type ItemDetail struct {
	Scope         string `json:"scope"`
	Project       string `json:"project"`
	Extension     string `json:"extension"`
	ItemName      string `json:"item_name"`
	ItemTableName string `json:"item_table_name"`
	Typecode      int32  `json:"typecode"`
}

// ItemModel wraps the database connection pool.
type ItemModel struct {
	DB *sql.DB
}

// Insert adds a new item to the database.
// It returns an error if the SQL query or scan fails.
func (i ItemModel) Insert(item *Item) error {
	query := `
		INSERT INTO item (name, extension_id, table_name, typecode)
		VALUES ($1, $2, $3, $4)
		RETURNING id, creation_date`

	args := []interface{}{item.Name, item.ExtensionID, item.TableName, item.Typecode}
	return i.DB.QueryRow(query, args...).Scan(&item.ID, &item.CreationDate)
}

// GetNextSharedFreeTypecode returns the next available typecode for a given scope within a specified range.
// It returns a sql.NullInt32 and an error.
// If an error occurs during the database query or while scanning the row, it will return the error.
func (i ItemModel) GetNextSharedFreeTypecode(scope string, rangeStart int32, rangeEnd int32) (sql.NullInt32, error) {
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
func (i ItemModel) GetNextProjectFreeTypeCode(projectId int32, rangeStart, rangeEnd int32) (sql.NullInt32, error) {
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

// ReadAll returns all items from the database.
// It returns a slice of items and an error.
// If an error occurs during the database query or while scanning the rows, it will return the error.
func (i ItemModel) ReadAll() ([]Item, error) {
	query := `
		SELECT id, name, table_name, typecode, extension_id, creation_date
		FROM item
		ORDER BY id`

	rows, err := i.DB.Query(query)
	if err != nil {
		return nil, err
	}

	var items []Item

	for rows.Next() {
		var item Item
		err = rows.Scan(&item.ID, &item.Name, &item.TableName, &item.Typecode, &item.ExtensionID, &item.CreationDate)
		items = append(items, item)
	}

	if err != nil {
		return nil, err
	}

	err = rows.Close()

	return items, err
}

// ReadItemDetails executes a SQL query to retrieve detailed information about items.
// The information includes the scope of the extension, the name of the project,
// the name of the extension, the name of the item, the table name of the item, and
// the type code of the item. The method returns a slice of ItemDetail and an error.
// On success, the slice contains the queried item details. If an error occurs during
// the query execution or while reading the results, the corresponding error is returned.
func (i ItemModel) ReadItemDetails() ([]ItemDetail, error) {
	query := `
	SELECT extension.scope, 
       COALESCE(project.name, '-') AS project_name,
       extension.name, 
       item.name, 
       item.table_name, 
       item.typecode 
	FROM item
	JOIN extension ON item.extension_id = extension.id
	LEFT JOIN project ON extension.project_id = project.id`

	rows, err := i.DB.Query(query)
	if err != nil {
		return nil, err
	}

	var itemDetails []ItemDetail

	for rows.Next() {
		var itemDetail ItemDetail
		err = rows.Scan(&itemDetail.Scope, &itemDetail.Project, &itemDetail.Extension, &itemDetail.ItemName, &itemDetail.ItemTableName, &itemDetail.Typecode)
		itemDetails = append(itemDetails, itemDetail)
	}

	if err != nil {
		return nil, err
	}

	err = rows.Close()

	return itemDetails, err
}

func (i ItemModel) ReadItemDetail(id int64) (ItemDetail, error) {
	query := `
	SELECT extension.scope, 
	   COALESCE(project.name, '-') AS project_name,
	   extension.name, 
	   item.name, 
	   item.table_name, 
	   item.typecode 
	FROM item
	JOIN extension ON item.extension_id = extension.id
	LEFT JOIN project ON extension.project_id = project.id
	WHERE item.id = $1`

	var itemDetail ItemDetail
	err := i.DB.QueryRow(query, id).Scan(&itemDetail.Scope, &itemDetail.Project, &itemDetail.Extension, &itemDetail.ItemName, &itemDetail.ItemTableName, &itemDetail.Typecode)
	return itemDetail, err
}
