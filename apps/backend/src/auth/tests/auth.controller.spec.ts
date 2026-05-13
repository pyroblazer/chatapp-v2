import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { Services } from '../../utils/constants';
import { mockAuthService, mockUserService } from '../../__mocks__';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: Services.AUTH, useValue: mockAuthService },
        { provide: Services.USERS, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
