package data

import (
	"database/sql"
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

func (pm ProjectModel) ReadProjectName(id int64, projectName *string) error {
	query := `SELECT name FROM project WHERE id = $1`
	return pm.DB.QueryRow(query, id).Scan(projectName)
}
