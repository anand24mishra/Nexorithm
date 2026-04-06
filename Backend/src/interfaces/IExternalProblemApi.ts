import { ProblemListParams } from '../types';

export interface IExternalProblemApi {
  fetchFromVercel(slug: string): Promise<unknown>;
  fetchFromGraphQL(slug: string): Promise<unknown>;
  fetchProblemList(params: ProblemListParams): Promise<unknown>;
  fetchDailyChallenge(): Promise<unknown>;
}
