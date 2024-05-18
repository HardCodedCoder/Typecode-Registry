import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BackendService } from './backend.service';
import { ExtensionsAPIResponse } from './interfaces/extensionRequest';
import { ItemRequest } from './interfaces/requests';
import { ItemAPIResponse } from './interfaces/items';
import { ProjectsAPIResponse } from './interfaces/project';

describe('BackendService', () => {
  let service: BackendService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BackendService],
    });
    service = TestBed.inject(BackendService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch extensions successfully', () => {
    const mockExtensions: ExtensionsAPIResponse = {
      extensions: [
        {
          id: 1,
          name: 'extension1',
          project_id: 1,
          scope: 'Shared',
          description: 'Test extension',
          creation_date: new Date('2022-01-01'),
        },
      ],
    };
    service.getExtensions('Shared').subscribe(extensions => {
      expect(extensions).toEqual(mockExtensions);
    });

    const req = httpMock.expectOne('http://localhost:8080/extensions/Shared');
    expect(req.request.method).toBe('GET');
    req.flush(mockExtensions);
  });

  it('should handle error when fetching extensions fails', () => {
    service.getExtensions('Shared').subscribe(extensions => {
      expect(extensions).toEqual({ extensions: [] });
    });

    const req = httpMock.expectOne('http://localhost:8080/extensions/Shared');
    req.error(new ErrorEvent('Network error'));
  });

  it('should create an item successfully', () => {
    const mockItemRequest: ItemRequest = {
      name: 'item1',
      table_name: 'table1',
      extension_id: 1,
    };
    const mockItemResponse: ItemAPIResponse = {
      item: {
        id: 1,
        scope: 'Shared',
        project: 'project1',
        name: 'item1',
        table_name: 'table1',
        extension_id: 1,
        typecode: 1,
        creation_date: new Date(),
      },
    };
    service.sendCreateItemRequest(mockItemRequest).subscribe(response => {
      expect(response).toEqual(mockItemResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/items');
    expect(req.request.method).toBe('POST');
    req.flush(mockItemResponse);
  });

  it('should handle error when creating an item fails', () => {
    const mockDate = new Date(2024, 3, 29, 12, 23, 36); // Set the mock date
    jasmine.clock().mockDate(mockDate); // Mock the Date object

    const mockItemRequest: ItemRequest = {
      name: 'item1',
      table_name: 'table1',
      extension_id: 1,
    };
    const expectedResponse: ItemAPIResponse = {
      item: {
        id: 0,
        scope: '',
        project: '',
        name: '',
        table_name: '',
        extension_id: 0,
        typecode: 0,
        creation_date: mockDate, // Use the mock date
      },
    };
    service.sendCreateItemRequest(mockItemRequest).subscribe(response => {
      expect(response).toEqual(expectedResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/items');
    req.error(new ErrorEvent('Network error'));
  });

  it('should fetch projects successfully', () => {
    const mockProjects: ProjectsAPIResponse = {
      projects: [
        {
          id: 1,
          name: 'project1',
          description: 'Test project',
          creation_date: new Date('2022-01-01'),
        },
      ],
    };
    service.getProjects().subscribe(projects => {
      expect(projects).toEqual(mockProjects);
    });

    const req = httpMock.expectOne('http://localhost:8080/projects');
    expect(req.request.method).toBe('GET');
    req.flush(mockProjects);
  });

  it('should handle error when fetching projects fails', () => {
    service.getProjects().subscribe(projects => {
      expect(projects).toEqual({ projects: [] });
    });

    const req = httpMock.expectOne('http://localhost:8080/projects');
    req.error(new ErrorEvent('Network error'));
  });
});
