package data

import (
	"database/sql"
	"errors"
	"time"
)

// Project represents a project in the database.
type Project struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	CreationDate time.Time `json:"creation_date"`
}

// ProjectModel wraps the database connection pool.
type ProjectModel struct {
	DB *sql.DB
}

// ReadAll retrieves all projects from the database.
// It returns a slice of pointers to Project structs and an error.
// If an error occurs during the database query or while scanning the rows, it will return the error.
func (pm ProjectModel) ReadAll() (projects []*Project, err error) {
	query := `SELECT * FROM project ORDER BY id`

	rows, err := pm.DB.Query(query)

	if err != nil {
		return nil, err
	}

	projects = []*Project{}

	for rows.Next() {
		var project Project

		err = rows.Scan(
			&project.ID,
			&project.Name,
			&project.Description,
			&project.CreationDate,
		)

		projects = append(projects, &project)
	}

	if err != nil {
		return nil, err
	}

	return projects, nil
}

// ReadProjectName retrieves the name of a project from the database based on the provided project ID.
// It takes an ID and a pointer to a string where the project name will be stored.
//
// Parameters:
// - id: The ID of the project whose name is to be retrieved.
// - projectName: A pointer to a string where the retrieved project name will be stored.
//
// Returns:
func (pm ProjectModel) ReadProjectName(id int64, projectName *string) error {
	query := `SELECT name FROM project WHERE id = $1`
	return pm.DB.QueryRow(query, id).Scan(projectName)
}

// Insert adds a new project to the database.
// It takes a Project struct as input and returns an error if the SQL query or scan fails.
// The function executes an INSERT statement to add the project's name and description
// to the 'project' table. It then scans the returned id and creation_date into the
// provided Project struct.
func (pm ProjectModel) Insert(project *Project) error {
	query := `INSERT INTO project (name, description)
		VALUES ($1, $2)
		RETURNING id, creation_date`

	args := []interface{}{project.Name, project.Description}

	return pm.DB.QueryRow(query, args...).Scan(&project.ID, &project.CreationDate)
}

// Update modifies the name and description of a project in the database.
// If the provided altName is an empty string, the existing name in the database is retained.
// The description is always updated to the provided altDescription.
//
// Parameters:
// - d: A pointer to the Project struct containing the ID of the project to be updated.
// - altName: The new name for the project. If this is an empty string, the name is not changed.
// - altDescription: The new description for the project.
//
// Returns:
// - error: An error if the update operation fails or if no record is found with the given ID.
func (pm ProjectModel) Update(d *Project, altName, altDescription string) error {
	query := `
        UPDATE project
        SET name = COALESCE(NULLIF($1, ''), name), 
            description = $2
        WHERE id = $3`

	args := []interface{}{altName, altDescription, d.ID}
	result, err := pm.DB.Exec(query, args...)
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

// Read retrieves a project from the database based on the provided project ID.
// It returns a pointer to a Project struct and an error.
// If an error occurs during the database query or while scanning the row, it will return the error.
func (pm ProjectModel) Read(id int64) (*Project, error) {
	query := `SELECT id, name, description, creation_date FROM project WHERE id = $1`

	var project Project
	err := pm.DB.QueryRow(query, id).Scan(
		&project.ID,
		&project.Name,
		&project.Description,
		&project.CreationDate,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("no record found")
		}
		return nil, err
	}

	return &project, nil
}

// DeleteExtensionsByProjectID deletes all extensions associated with a given project ID.
func (pm ProjectModel) DeleteExtensionsByProjectID(projectID int64) error {
	query := `DELETE FROM extension WHERE project_id = $1`
	_, err := pm.DB.Exec(query, projectID)
	return err
}

func (pm ProjectModel) Delete(id int64, itemModel ItemModel) error {
	tx, err := pm.DB.Begin()
	if err != nil {
		return err
	}

	// Retrieve all extension IDs for the project
	query := `SELECT id FROM extension WHERE project_id = $1`
	rows, err := tx.Query(query, id)
	if err != nil {
		tx.Rollback()
		return err
	}
	defer rows.Close()

	var extensionIDs []int64
	for rows.Next() {
		var extensionID int64
		if err := rows.Scan(&extensionID); err != nil {
			tx.Rollback()
			return err
		}
		extensionIDs = append(extensionIDs, extensionID)
	}

	// Delete all items for each extension
	for _, extensionID := range extensionIDs {
		if err := itemModel.DeleteItemsByExtension(extensionID); err != nil {
			tx.Rollback()
			return err
		}
	}

	// Delete all extensions for the project
	if err := pm.DeleteExtensionsByProjectID(id); err != nil {
		tx.Rollback()
		return err
	}

	// Delete the project itself
	query = `DELETE FROM project WHERE id = $1`
	_, err = tx.Exec(query, id)
	if err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}
