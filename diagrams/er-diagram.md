# ER Diagram — Nexorithm Database Schema

## Mermaid Source

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        String username UK "unique, min 3 chars"
        String email UK "unique, lowercase"
        String passwordHash "bcrypt, 12 rounds"
        String role "user | admin"
        Date createdAt
        Date updatedAt
    }

    PROBLEM {
        String id PK "LeetCode question ID"
        String slug UK "unique, URL-safe"
        String title
        String difficulty "easy | medium | hard"
        String content "HTML (sanitized with DOMPurify)"
        String[] tags
        Object starterCode "{ javascript, python }"
        Object[] testCases "{ input, expectedOutput, isHidden }"
        String sampleInput
        String sampleOutput
        String[] hints
        Number acRate
        Date createdAt
        Date updatedAt
    }

    SUBMISSION {
        ObjectId _id PK
        ObjectId userId FK "references User"
        String problemId FK "references Problem.id"
        String language "javascript | python"
        String code
        String verdict "Accepted | Wrong Answer | Runtime Error | TLE | Compile Error"
        Number passedTestCases
        Number totalTestCases
        Number executionTimeMs
        Date submittedAt
        Date createdAt
        Date updatedAt
    }

    USER ||--o{ SUBMISSION : "creates"
    PROBLEM ||--o{ SUBMISSION : "has"
```

## Relationships

| Relationship | Description |
|---|---|
| User → Submission | One user creates many submissions (1:N) |
| Problem → Submission | One problem has many submissions (1:N) |

## Indexes

- `User.username` — unique index
- `User.email` — unique index  
- `Problem.slug` — unique index
- `Submission.userId` — regular index (query by user)
- `Submission.problemId` — regular index (query by problem)

## Notes

- **Password Security**: Passwords are hashed using bcrypt with 12 salt rounds
- **JWT Tokens**: Payload includes `{ userId, username, role }`, expires in 7 days
- **Problem Content**: Stored as raw HTML, sanitized on the frontend using DOMPurify
- **Test Cases**: Embedded subdocuments within Problems (not separate collection)
- **Starter Code**: Embedded object with `javascript` and `python` fields
