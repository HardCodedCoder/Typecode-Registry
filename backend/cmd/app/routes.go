package main

import "net/http"

func (app *application) route() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/", http.NotFound)
	mux.HandleFunc("/healthcheck", app.healthcheck)
	mux.HandleFunc("/items", app.getCreateItemsHandler)
	mux.HandleFunc("/items/", app.getUpdateDeleteItemsHandler)
	return mux
}
