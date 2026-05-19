import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../services/user.service';
import { User, Peer } from '../../utils/typeorm';
import { createMockRepository } from '../../__mocks__';

describe('UserService', () => {
  let service: UserService;
  let userRepo: ReturnType<typeof createMockRepository>;
  let peerRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    userRepo = createMockRepository();
    peerRepo = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Peer), useValue: peerRepo },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const details = { username: 'alice', password: 'pass123', firstName: 'Alice', lastName: 'Smith' };

    it('throws 409 when username already exists', async () => {
      userRepo.findOne.mockResolvedValueOnce({ id: '1', username: 'alice' });
      await expect(service.createUser(details)).rejects.toThrow(
        new HttpException('User already exists', HttpStatus.CONFLICT),
      );
    });

    it('saves a new user and returns it', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);
      peerRepo.create.mockReturnValue({ id: undefined });
      userRepo.create.mockReturnValue({ username: 'alice' });
      userRepo.save.mockResolvedValueOnce({ id: 'uuid-1', username: 'alice' });

      const result = await service.createUser(details);
      expect(result).toEqual({ id: 'uuid-1', username: 'alice' });
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('converts postgres duplicate-key error (code 23505) to 409', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);
      peerRepo.create.mockReturnValue({});
      userRepo.create.mockReturnValue({});
      const pgErr = Object.assign(new Error('duplicate key value'), { code: '23505' });
      userRepo.save.mockRejectedValueOnce(pgErr);

      await expect(service.createUser(details)).rejects.toMatchObject({
        status: HttpStatus.CONFLICT,
      });
    });

    it('re-throws non-duplicate errors', async () => {
      userRepo.findOne.mockResolvedValueOnce(null);
      peerRepo.create.mockReturnValue({});
      userRepo.create.mockReturnValue({});
      userRepo.save.mockRejectedValueOnce(new Error('db timeout'));

      await expect(service.createUser(details)).rejects.toThrow('db timeout');
    });
  });
});
