package main

import "net/http"

func (app *application) route() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", http.NotFound)
	mux.HandleFunc("/healthcheck", app.healthcheck)
	mux.HandleFunc("/items", app.getCreateItemsHandler)
	mux.HandleFunc("/items/", app.getUpdateDeleteItemsHandler)
	mux.HandleFunc("/extensions/", app.getExtensionsHandler)
	mux.HandleFunc("/projects", app.getProjectsHandler)
	return mux
}
