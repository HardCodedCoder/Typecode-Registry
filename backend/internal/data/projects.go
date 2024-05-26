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
