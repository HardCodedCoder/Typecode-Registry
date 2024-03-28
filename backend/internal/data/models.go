package data

import "database/sql"

type Models struct {
	Items      ItemModel
	Extensions ExtensionModel
}

func NewModels(db *sql.DB) Models {
	return Models{
		Items:      ItemModel{DB: db},
		Extensions: ExtensionModel{DB: db},
	}
}
