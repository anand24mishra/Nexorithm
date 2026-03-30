export interface TestCase {
  input: string;  // The input to be provided to the user's code, typically as a string that can be read from stdin.
  expectedOutput: string;
}

// stdin : standard input 
// stdout : standard output

export interface Problem {
  id: string;
  title: string;
  description: string;
  testCases: TestCase[];
//   a problem can have multiple test cases, each with its own input and expected output. This allows for comprehensive testing of the user's solution against various scenarios.
}

export const mockProblems: Problem[] = [
  {
    id: '1',
    title: 'Print Hello World',
    description: 'Print "Hello, World!" to stdout.',
    testCases: [
      { input: 'Hello, World!', expectedOutput: 'Hello, World!' },
    ],
  },
  {
    id: '2',
    title: 'Add Two Numbers',
    description: 'Read two integers from stdin and print their sum.',
    testCases: [
      { input: '3 5', expectedOutput: '8' },
      { input: '10 20', expectedOutput: '30' },
      { input: '-1 1', expectedOutput: '0' },
    ],
  },
];