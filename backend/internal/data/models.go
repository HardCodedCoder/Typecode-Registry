package data

import "database/sql"

// Models wraps the models for the application.
// Used in the application struct to access the models from the handlers.
type Models struct {
	Items      ItemModel
	Extensions ExtensionModel
	Projects   ProjectModel
}

// NewModels creates a new Models struct and initializes the models.
func NewModels(db *sql.DB) Models {
	return Models{
		Items:      ItemModel{DB: db},
		Extensions: ExtensionModel{DB: db},
		Projects:   ProjectModel{DB: db},
	}
}
