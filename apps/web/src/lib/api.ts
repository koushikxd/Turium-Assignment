import { type ProblemDetails, problemDetails } from "@turium-assignment/contracts";

export class ApiError extends Error {
  constructor(readonly problem: ProblemDetails) {
    super(problem.detail);
  }
}

function parseProblem(text: string): ProblemDetails | undefined {
  try {
    return problemDetails.safeParse(JSON.parse(text)).data;
  } catch {
    return undefined;
  }
}

export function problemMessage(text: string): string {
  return parseProblem(text)?.detail ?? text;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`/api${path}`, init);
  if (res.ok) return res;
  const text = await res.text();
  const problem = parseProblem(text);
  if (problem) throw new ApiError(problem);
  throw new Error(text || `HTTP ${res.status}`);
}
