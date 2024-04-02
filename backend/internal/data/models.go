package data

import "database/sql"

type Models struct {
	Items      ItemModel
	Extensions ExtensionModel
	Projects   ProjectModel
}

func NewModels(db *sql.DB) Models {
	return Models{
		Items:      ItemModel{DB: db},
		Extensions: ExtensionModel{DB: db},
		Projects:   ProjectModel{DB: db},
	}
}
