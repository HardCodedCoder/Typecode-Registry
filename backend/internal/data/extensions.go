package data

import (
	"database/sql"
	"errors"
	"time"
)

type Extension struct {
	ID           int64         `json:"id"`
	ProjectID    sql.NullInt32 `json:"project_id"`
	Name         string        `json:"name"`
	Description  string        `json:"description"`
	Scope        string        `json:"scope"`
	CreationDate time.Time     `json:"creation_date"`
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
