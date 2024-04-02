import { TestBed } from '@angular/core/testing';
import { StoreService } from './store.service';

describe('StoreService', () => {
  let service: StoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StoreService);
  });

  it('should return correct id for shared extension', () => {
    service.sharedExtensions = [
      {
        id: 1,
        name: 'extension1',
        project_id: 1,
        scope: 'Shared',
        description: 'Test extension',
        creation_date: new Date('2022-01-01'),
      },
      {
        id: 2,
        name: 'extension2',
        project_id: 1,
        scope: 'Shared',
        description: 'Test extension',
        creation_date: new Date('2022-01-01'),
      },
    ];
    expect(service.getSharedExtensionId('extension1')).toEqual(1);
    expect(service.getSharedExtensionId('extension2')).toEqual(2);
    expect(service.getSharedExtensionId('nonexistent')).toBeUndefined();
  });

  it('should return correct id for project extension', () => {
    service.projectExtensions = [
      {
        id: 1,
        name: 'extension1',
        project_id: 1,
        scope: 'Project',
        description: 'Test extension',
        creation_date: new Date('2022-01-01'),
      },
      {
        id: 2,
        name: 'extension2',
        project_id: 2,
        scope: 'Project',
        description: 'Test extension',
        creation_date: new Date('2022-01-01'),
      },
    ];
    service.projects = [
      {
        id: 1,
        name: 'project1',
        description: 'Test project',
        creation_date: new Date('2022-01-01'),
      },
      {
        id: 2,
        name: 'project2',
        description: 'Test project',
        creation_date: new Date('2022-01-01'),
      },
    ];
    expect(service.getProjectExtensionId('project1', 'extension1')).toEqual(1);
    expect(service.getProjectExtensionId('project2', 'extension2')).toEqual(2);
    expect(
      service.getProjectExtensionId('nonexistent', 'extension1')
    ).toBeUndefined();
    expect(
      service.getProjectExtensionId('project1', 'nonexistent')
    ).toBeUndefined();
  });
});
