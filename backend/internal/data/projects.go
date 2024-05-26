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
