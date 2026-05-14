import type { User } from '../utils/typeorm';

export const mockUser = {
  id: 'mock-uuid-1234',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
  password: '$2b$10$hashedpassword',
  role: 'USER',
  active: true,
  messages: [],
  groups: [],
} as unknown as User;

// Repository mock factory
export const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  increment: jest.fn(),
  queryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  })),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    getCount: jest.fn(),
  })),
});

// Service mocks
export const mockAuthService = {
  validateUser: jest.fn(),
  generateTokens: jest.fn(),
  refreshAccessToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
};

export const mockUserService = {
  findUser: jest.fn(),
  createUser: jest.fn(),
  checkUsername: jest.fn(),
  searchUsers: jest.fn(),
};

export const mockUserProfileService = {
  createProfile: jest.fn(),
  updateProfile: jest.fn(),
  createProfileOrUpdate: jest.fn(),
};

export const mockUserPresenceService = {
  createPresence: jest.fn(),
  updateStatus: jest.fn(),
};

export const mockConversationsService = {
  createConversation: jest.fn(),
  getConversations: jest.fn(),
  findById: jest.fn(),
  isCreated: jest.fn(),
  save: jest.fn(),
  getMessages: jest.fn(),
  update: jest.fn(),
};

export const mockMessagesService = {
  createMessage: jest.fn(),
  getMessages: jest.fn(),
  deleteMessage: jest.fn(),
  editMessage: jest.fn(),
};

export const mockMessageAttachmentsService = {
  createAttachment: jest.fn(),
  getAttachments: jest.fn(),
};

export const mockGatewaySessionManager = {
  getSockets: jest.fn(),
  getSocket: jest.fn(),
  addUserSocket: jest.fn(),
  removeUserSocket: jest.fn(),
};

export const mockGroupsService = {
  createGroup: jest.fn(),
  getGroups: jest.fn(),
  findById: jest.fn(),
  addGroupRecipient: jest.fn(),
  removeGroupRecipient: jest.fn(),
  removeUserFromGroup: jest.fn(),
  transferOwner: jest.fn(),
  updateDetails: jest.fn(),
};

export const mockGroupMessagesService = {
  createGroupMessage: jest.fn(),
  getGroupMessages: jest.fn(),
  deleteGroupMessage: jest.fn(),
  editGroupMessage: jest.fn(),
};

export const mockGroupRecipientsService = {
  addRecipient: jest.fn(),
  removeRecipient: jest.fn(),
};

export const mockFriendsService = {
  getFriends: jest.fn(),
  addFriend: jest.fn(),
  removeFriend: jest.fn(),
  isFriends: jest.fn(),
};

export const mockFriendRequestsService = {
  getFriendRequests: jest.fn(),
  createFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  rejectFriendRequest: jest.fn(),
  cancelFriendRequest: jest.fn(),
  isPending: jest.fn(),
  findById: jest.fn(),
};

export const mockImageUploadService = {
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
};

export const mockStorageService = {
  uploadFile: jest.fn(),
  uploadWithPreview: jest.fn(),
  deleteFile: jest.fn(),
  getPresignedUrl: jest.fn(),
  fileExists: jest.fn(),
  getFile: jest.fn(),
  isAvailable: jest.fn().mockReturnValue(true),
  checkHealth: jest.fn().mockResolvedValue(true),
  getDefaultBucket: jest.fn().mockReturnValue('chatapp-uploads'),
};

export const mockRabbitMQService = {
  publish: jest.fn(),
  assertQueue: jest.fn(),
  consume: jest.fn(),
};

export const mockReactionsService = {
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
  getReactions: jest.fn(),
};

export const mockReadReceiptsService = {
  markAsRead: jest.fn(),
  getReadReceipts: jest.fn(),
  getUnreadCount: jest.fn(),
};

export const mockSearchService = {
  search: jest.fn(),
};

export const mockNotificationsService = {
  getNotifications: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  getUnreadCount: jest.fn(),
  createNotification: jest.fn(),
};

export const mockAdminService = {
  getUsers: jest.fn(),
  banUser: jest.fn(),
  unbanUser: jest.fn(),
  changeRole: jest.fn(),
  deleteMessage: jest.fn(),
  deleteGroupMessage: jest.fn(),
  getReports: jest.fn(),
  updateReport: jest.fn(),
  getAuditLogs: jest.fn(),
};

export const mockAuditService = {
  logAction: jest.fn(),
  getAuditLogs: jest.fn(),
};

export const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};

export const mockConfigService = {
  get: jest.fn(),
};
