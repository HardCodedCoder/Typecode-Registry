import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, tap } from 'rxjs';
import { ExtensionsAPIResponse } from './interfaces/extension';
import { ProjectsAPIResponse } from './interfaces/project';
import {
  ItemAPIResponse,
  ItemDetailAPIResponse,
  ItemsAPIResponse,
  ItemsDetailsAPIResponse,
} from './interfaces/items';
import { ItemRequest } from './interfaces/requests';
import { Router } from '@angular/router';
import { HttpStatusCode } from './interfaces/http-status-codes';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private apiUrl = 'http://localhost:8080';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

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
   * Fetches all item details from the backend.
   *
   * This method sends an HTTP GET request to the backend to retrieve all item details.
   * The endpoint it hits is `${this.apiUrl}/items/details`, where `this.apiUrl` is the base URL of the backend.
   *
   * If the request is successful, it returns an Observable that emits an `ItemsDetailsAPIResponse`.
   * The `ItemsDetailsAPIResponse` is an object that contains an array of item details.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default `ItemsDetailsAPIResponse` object.
   * The default `ItemsDetailsAPIResponse` object is `{ details: [] }`, which represents an empty list of item details.
   *
   * @returns An Observable of `ItemsDetailsAPIResponse`. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  getItemsDetails(): Observable<ItemsDetailsAPIResponse> {
    return this.http
      .get<ItemsDetailsAPIResponse>(`${this.apiUrl}/items/details`)
      .pipe(
        tap(_ => console.log(`fetched items`)),
        catchError(
          this.handleError<ItemsDetailsAPIResponse>('getItemsDetails', {
            details: [],
          })
        )
      );
  }

  /**
   * Fetches the details of a specific item from the backend.
   *
   * This method sends an HTTP GET request to the backend to retrieve the details of a specific item.
   * The endpoint it hits is `${this.apiUrl}/items/${id}`, where `this.apiUrl` is the base URL of the backend and `id` is the ID of the item to fetch.
   *
   * If the request is successful, it returns an Observable that emits an `ItemDetailAPIResponse`.
   * The `ItemDetailAPIResponse` is an object that contains the details of the item.
   *
   * If the request fails, it will trigger the `handleError` method. This method logs the error and returns an Observable that emits a default `ItemDetailAPIResponse` object.
   * The default `ItemDetailAPIResponse` object is an empty item detail object.
   *
   * @param id - The ID of the item to fetch.
   * @returns An Observable of `ItemDetailAPIResponse`. Subscribe to this Observable to get the data when the request succeeds or fails.
   */
  getItemDetails(id: number): Observable<ItemDetailAPIResponse> {
    return this.http
      .get<ItemDetailAPIResponse>(`${this.apiUrl}/items/details/${id}`)
      .pipe(
        tap(_ => console.log(`fetched item with id ${id}`)),
        catchError(
          this.handleError<ItemDetailAPIResponse>('getItemDetails', {
            detail: {
              scope: '',
              project: '',
              extension: '',
              item_name: '',
              item_table_name: '',
              typecode: 0,
            },
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
              name: '',
              typecode: 0,
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
}
