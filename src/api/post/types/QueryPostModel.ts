import { SortDirection } from '@src/types';

export type QueryPostModel = {
  searchNameTerm: string;
  pageNumber: string;
  pageSize: string;
  sortBy: string;
  sortDirection: SortDirection;
};
