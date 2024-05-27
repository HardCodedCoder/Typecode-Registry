import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import {
  ExtensionAPIResponse,
  ExtensionRequest,
  ExtensionsAPIResponse,
  ExtensionUpdateRequest,
} from './interfaces/extensionRequest';
import {
  ProjectAPIResponse,
  ProjectRequest,
  ProjectsAPIResponse,
  ProjectUpdateRequest,
} from './interfaces/project';
import { ItemAPIResponse, ItemsAPIResponse } from './interfaces/items';
import { ItemRequest, UpdateItemRequest } from './interfaces/requests';
import { environment } from '../../environments/environment';
import { HttpStatusCode } from './interfaces/http-status-codes';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private apiUrl = environment.backendUrl;
  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Fetches all items from the backend.
   *
   * This method sends an HTTP GET request to the backend to retrieve all items.
   * The endpoint it hits is `${this.apiUrl}/items`, where `this.apiUrl` is the base URL of the backend.
   *
   * If the request is successful, it returns an Observable that emits an `ItemsAPIResponse`.
   * The `ItemsAPIResponse` is an object that contains an array of items.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default `ItemsAPIResponse` object.
   * The default `ItemsAPIResponse` object is `{ items: [] }`, which represents an empty list of items.
   *
   * @returns An Observable of `ItemsAPIResponse`. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  getItems(): Observable<ItemsAPIResponse> {
    return this.http.get<ItemsAPIResponse>(`${this.apiUrl}/items`).pipe(
      tap(_ => console.log(`fetched items`)),
      catchError(
        this.handleError<ItemsAPIResponse>('getItems', {
          items: [],
        })
      )
    );
  }

  /**
   * Sends a request to the backend to create a new item.
   *
   * This method sends an HTTP POST request to the backend to create a new item. The item details are passed in the `itemRequest` parameter.
   * The endpoint it hits is `${this.apiUrl}/items`, where `this.apiUrl` is the base URL of the backend.
   *
   * If the request is successful, it returns an Observable that emits an `ItemAPIResponse`.
   * The `ItemAPIResponse` is an object that contains the details of the created item.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default `ItemAPIResponse` object.
   * The default `ItemAPIResponse` object is an empty item object.
   *
   * @param itemRequest - The details of the item to create. This should be an object that conforms to the `ItemRequest` interface.
   * @returns An Observable of `ItemAPIResponse`. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  sendCreateItemRequest(itemRequest: ItemRequest): Observable<ItemAPIResponse> {
    return this.http
      .post<ItemAPIResponse>(`${this.apiUrl}/items`, itemRequest)
      .pipe(
        tap(_ => console.log(`created item with name ${itemRequest.name}`)),
        catchError(
          this.handleError<ItemAPIResponse>('sendCreateItemRequest', {
            item: {
              id: 0,
              scope: '',
              project: '',
              name: '',
              typecode: 0,
              table_name: '',
              extension_id: 0,
              creation_date: new Date(),
            },
          })
        )
      );
  }

  sendCreateExtensionRequest(
    extensionRequest: ExtensionRequest
  ): Observable<ExtensionAPIResponse> {
    return this.http
      .post<ExtensionAPIResponse>(`${this.apiUrl}/extensions`, extensionRequest)
      .pipe(
        catchError(
          this.handleError<ExtensionAPIResponse>('sendCreateExtensionRequest', {
            extension: {
              id: 0,
              project_id: 0,
              name: '',
              scope: '',
              description: '',
              creation_date: new Date(),
            },
          })
        )
      );
  }

  /**
     Deletes an item from the backend.

     This method sends an HTTP DELETE request to the backend to delete an item. The item to delete is identified by the id parameter.
     The endpoint it hits is ${this.apiUrl}/items/${id}, where this.apiUrl is the base URL of the backend and id is the ID of the item to delete.

     If the request is successful and the item is deleted, it logs a message to the console.

     If the request fails, it will trigger the handleError method. This method logs the error and returns an Observable that emits a default object.
     The default object is { details: [] }.

     @param id - The ID of the item to delete.
     @returns An Observable of any. Subscribe to this Observable to get the data when the request succeeds or fails.
     */
  deleteItem(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/items/${id}`, { observe: 'response' })
      .pipe(
        tap(response => {
          if (response.status === 204) {
            console.log(`Deleted item with id: ${id}`);
          }
        }),
        catchError(this.handleError('deleteItem', { items: [] }))
      );
  }

  /**
   * Deletes an extension from the backend.
   *
   * This method sends an HTTP DELETE request to the backend to delete an extension. The extension to delete is identified by the `id` parameter.
   * The endpoint it hits is `${this.apiUrl}/extensions/${id}`, where `this.apiUrl` is the base URL of the backend and `id` is the ID of the extension to delete.
   *
   * If the request is successful, it returns an Observable that emits the HTTP response.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default object.
   * The default object is `{ details: [] }`.
   *
   * @param id - The ID of the extension to delete.
   * @returns An Observable of any. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  deleteExtension(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/extensions/${id}`, {
      observe: 'response',
    });
  }

  /*
   * Updates an item in the backend.
   * This method sends an HTTP PUT request to the backend to update an item. The item to update is identified by the id parameter.
   * The endpoint it hits is ${this.apiUrl}/items/${id}, where this.apiUrl is the base URL of the backend and id is the ID of the item to update.
   */
  updateItem(id: number, updateRequest: UpdateItemRequest): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/items/${id}`, updateRequest, { observe: 'response' })
      .pipe(
        tap(response => {
          if (response.status === 204) {
            console.log(`Updated item with id: ${id}`);
          }
        }),
        catchError(this.handleError('updateItem', { items: [] }))
      );
  }

  /**
   * Fetches all extensions of a given scope from the backend.
   *
   * This method sends an HTTP GET request to the backend to retrieve all extensions of a specific scope.
   * The endpoint it hits is `${this.apiUrl}/extensions/${scope}`, where `this.apiUrl` is the base URL of the backend and `scope` is the scope of the extensions to fetch.
   *
   * If the request is successful, it returns an Observable that emits an `ExtensionsAPIResponse`.
   * The `ExtensionsAPIResponse` is an object that contains an array of extensions.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default `ExtensionsAPIResponse` object.
   * The default `ExtensionsAPIResponse` object is `{ extensions: [] }`, which represents an empty list of extensions.
   *
   * @param scope - The scope of the extensions to fetch. This can be 'Shared' or 'Project'.
   * @returns An Observable of `ExtensionsAPIResponse`. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  getExtensions(scope: string = ''): Observable<ExtensionsAPIResponse> {
    let endpoint: string;
    if (scope === '') endpoint = `${this.apiUrl}/extensions`;
    else endpoint = `${this.apiUrl}/extensions/${scope}`;
    return this.http.get<ExtensionsAPIResponse>(endpoint).pipe(
      tap(_ => console.log(`fetched extensions of scope ${scope}`)),
      catchError(
        this.handleError<ExtensionsAPIResponse>('getExtensions', {
          extensions: [],
        })
      )
    );
  }

  /**
   * Fetches all projects from the backend.
   *
   * This method sends an HTTP GET request to the backend to retrieve all projects.
   * The endpoint it hits is `${this.apiUrl}/projects`, where `this.apiUrl` is the base URL of the backend.
   *
   * If the request is successful, it returns an Observable that emits a `ProjectsAPIResponse`.
   * The `ProjectsAPIResponse` is an object that contains an array of projects.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default `ProjectsAPIResponse` object.
   * The default `ProjectsAPIResponse` object is `{ projects: [] }`, which represents an empty list of projects.
   *
   * @returns An Observable of `ProjectsAPIResponse`. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  getProjects(): Observable<ProjectsAPIResponse> {
    return this.http
      .get<ProjectsAPIResponse>(`${this.apiUrl}/projects`)
      .pipe(
        catchError(
          this.handleError<ProjectsAPIResponse>('getProjects', { projects: [] })
        )
      );
  }

  /**
   * Updates an extension in the backend.
   *
   * This method sends an HTTP PUT request to the backend to update an extension. The extension to update is identified by the `id` parameter.
   * The endpoint it hits is `${this.apiUrl}/extensions/${id}`, where `this.apiUrl` is the base URL of the backend and `id` is the ID of the extension to update.
   *
   * If the request is successful and the extension is updated, it logs a message to the console.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default object.
   * The default object is `{ items: [] }`.
   *
   * @param id - The ID of the extension to update.
   * @param data - The updated data for the extension. This should be an object that conforms to the `UpdateExtensionFormData` interface.
   * @returns An Observable of any. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  updateExtension(id: number, data: ExtensionUpdateRequest): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/extensions/${id}`, data, { observe: 'response' })
      .pipe(
        tap(response => {
          if (response.status === 204) {
            console.log(`Updated extension with id: ${id}`);
          }
        }),
        catchError(this.handleError('updateExtension', { extensions: [] }))
      );
  }

  /**
   * Handles an HTTP operation that failed and lets the app continue.
   * Logs the error to the console and redirects to a corresponding error route.
   *
   * @see https://angular.io/tutorial/tour-of-heroes/toh-pt6 for more information.
   *
   * @param operation - Name of the operation that failed.
   * @param result - Optional value to return as the Observable result.
   * @returns An Observable of the result type T, which defaults to the provided result or an empty value of type T.
   */
  private handleError<T>(operation: string = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      console.log(`${operation} failed: ${error.message}`);

      if (Object.values(HttpStatusCode).includes(error.status.toString())) {
        this.router.navigate([`/error/${error.status}`]);
      } else {
        this.router.navigate([`/error/520`]);
      }

      return of(result as T);
    };
  }

  /**
   * Sends a request to the backend to create a new project.
   *
   * This method sends an HTTP POST request to the backend to create a new project. The project details are passed in the `projectRequest` parameter.
   * The endpoint it hits is `${this.apiUrl}/projects`, where `this.apiUrl` is the base URL of the backend.
   *
   * If the request is successful, it returns an Observable that emits an `ProjectAPIResponse`.
   * The `ProjectAPIResponse` is an object that contains the details of the created project.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default `ProjectAPIResponse` object.
   * The default `ProjectAPIResponse` object is an empty project object.
   *
   * @returns An Observable of `ProjectAPIResponse`. Subscribe to this Observable to get the data when the request succeeds or fails.
   * @param projectRequest - The details of the project to create. This should be an object that conforms to the `ProjectRequest` interface.
   */
  sendCreateProjectRequest(
    projectRequest: ProjectRequest
  ): Observable<ProjectAPIResponse> {
    return this.http
      .post<ProjectAPIResponse>(`${this.apiUrl}/projects`, projectRequest)
      .pipe(
        tap(_ =>
          console.log(`created project with name ${projectRequest.name}`)
        ),
        catchError(
          this.handleError<ProjectAPIResponse>('sendCreateProjectRequest', {
            project: {
              id: 0,
              name: '',
              description: '',
              creation_date: new Date(),
            },
          })
        )
      );
  }

  /**
   * Updates a project in the backend.
   *
   * This method sends an HTTP PUT request to the backend to update a project. The project to update is identified by the `id` parameter.
   * The endpoint it hits is `${this.apiUrl}/projects/${id}`, where `this.apiUrl` is the base URL of the backend and `id` is the ID of the project to update.
   *
   * If the request is successful and the project is updated, it logs a message to the console.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default object.
   * The default object is `{ projects: [] }`.
   *
   * @param id - The ID of the project to update.
   * @param data - The updated data for the project. This should be an object that conforms to the `UpdateProjectFormData` interface.
   * @returns An Observable of any. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  updateProject(id: number, data: ProjectUpdateRequest): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/projects/${id}`, data, { observe: 'response' })
      .pipe(
        tap(response => {
          if (response.status === 204) {
            console.log(`Updated Project with id: ${id}`);
          }
        }),
        catchError(this.handleError('updateProject', { projects: [] }))
      );
  }

  /**
 Deletes a project from the backend.

 This method sends an HTTP DELETE request to the backend to delete a project. The project to delete is identified by the id parameter.
 The endpoint it hits is ${this.apiUrl}/projects/${id}, where this.apiUrl is the base URL of the backend and id is the ID of the project to delete.

 If the request is successful and the project is deleted, it logs a message to the console.

 If the request fails, it will trigger the handleError method. This method logs the error and returns an Observable that emits a default object.
 The default object is { projects: [] }.

 @param id - The ID of the project to delete.
 @returns An Observable of any. Subscribe to this Observable to get the data when the request succeeds or fails.
 */
  deleteProject(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/projects/${id}`, { observe: 'response' })
      .pipe(
        tap(response => {
          if (response.status === 204) {
            console.log(`Deleted project with id: ${id}`);
          }
        }),
        catchError(this.handleError('deleteProject', { projects: [] }))
      );
  }
}
