import { ProblemListParams } from "../types";

export interface PlaygroundSnippet {
  langSlug: string;
  code: string;
}

export interface IExternalProblemApi {
  fetchFromVercel(slug: string): Promise<unknown>;
  fetchFromGraphQL(slug: string): Promise<unknown>;
  fetchProblemList(params: ProblemListParams): Promise<unknown>;
  fetchDailyChallenge(): Promise<unknown>;
  fetchPlayground(uuid: string): Promise<PlaygroundSnippet[]>;
}
