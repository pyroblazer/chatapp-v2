import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Services } from '../../utils/constants';
import { mockFriendRequestsService } from '../../__mocks__';
import { FriendRequestController } from '../friend-requests.controller';

describe('FriendRequestsController', () => {
  let controller: FriendRequestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendRequestController],
      providers: [
        {
          provide: Services.FRIENDS_REQUESTS_SERVICE,
          useValue: mockFriendRequestsService,
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    controller = module.get<FriendRequestController>(FriendRequestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
