export interface ISearchService {
  searchMessages(
    query: string,
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<any[]>;
  searchUsers(query: string): Promise<any[]>;
  searchGroups(query: string, userId: string): Promise<any[]>;
}
