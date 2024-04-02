import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { ExtensionsAPIResponse } from './interfaces/extension';
import { ProjectsAPIResponse } from './interfaces/project';
import { ItemRequest } from './interfaces/requests';
import { ItemAPIResponse } from './interfaces/items';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

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
  getExtensions(scope: string): Observable<ExtensionsAPIResponse> {
    return this.http
      .get<ExtensionsAPIResponse>(`${this.apiUrl}/extensions/${scope}`)
      .pipe(
        tap(_ => console.log(`fetched extensions of scope ${scope}`)),
        catchError(
          this.handleError<ExtensionsAPIResponse>('getExtensions', {
            extensions: [],
          })
        )
      );
  }

  sendCreateItemRequest(itemRequest: ItemRequest): Observable<ItemAPIResponse> {
    return this.http
      .post<ItemAPIResponse>(`${this.apiUrl}/items`, itemRequest)
      .pipe(
        tap(_ => console.log(`created item with name ${itemRequest.name}`)),
        catchError(
          this.handleError<ItemAPIResponse>('sendCreateItemRequest', {
            item: {
              id: 0,
              name: '',
              table_name: '',
              extensionId: 0,
              creation_date: '',
            },
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
   * Handle Http Operation that failed.
   * Let the app continue.
   *
   * See: https://angular.io/tutorial/tour-of-heroes/toh-pt6 for more information.
   *
   * @param operation - name of the operation that failed.
   * @param result - optional value to return as the observable result.
   */
  private handleError<T>(operation: string = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error);
      console.log(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
