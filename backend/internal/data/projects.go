package data

import (
	"database/sql"
	"time"
)

type Project struct {
	ID           int64     `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	CreationDate time.Time `json:"creation_date"`
}

type ProjectModel struct {
	DB *sql.DB
}

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
