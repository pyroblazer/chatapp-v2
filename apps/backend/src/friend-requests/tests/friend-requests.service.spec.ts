import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Services } from '../../utils/constants';
import { Friend, FriendRequest } from '../../utils/typeorm';
import {
  createMockRepository,
  mockUserService,
  mockFriendsService,
} from '../../__mocks__';
import { FriendRequestService } from '../friend-requests.service';

describe('FriendRequestsService', () => {
  let service: FriendRequestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendRequestService,
        {
          provide: getRepositoryToken(Friend),
          useValue: createMockRepository(),
        },
        {
          provide: getRepositoryToken(FriendRequest),
          useValue: createMockRepository(),
        },
        { provide: Services.USERS, useValue: mockUserService },
        { provide: Services.FRIENDS_SERVICE, useValue: mockFriendsService },
      ],
    }).compile();

    service = module.get<FriendRequestService>(FriendRequestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
