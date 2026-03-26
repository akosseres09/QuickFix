import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { permissionResolver } from './permission.resolver';

describe('permissionResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => permissionResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
