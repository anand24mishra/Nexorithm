# Database Design — Nexorithm Online Judge

## Entities and Relationships

Here is the exact Mermaid Class Diagram modeled strictly 1:1 against the underlying MongoDB/Mongoose schema architecture.

It reflects the exact Mongoose schema types (ObjectIds, native enums, embedded sub-documents, and foreign key references).

```mermaid
classDiagram
  class User {
    +String _id
    +String username
    +String name
    +String email
    +String passwordHash
    +String googleId
    +Provider provider
    +Role role
    +DateTime createdAt
    +DateTime updatedAt
  }

  class Problem {
    +String _id
    +String id
    +String slug
    +String title
    +Difficulty difficulty
    +String content
    +String[] tags
    +StarterCode starterCode
    +TestCase[] testCases
    +String sampleInput
    +String sampleOutput
    +String[] hints
    +Number acRate
    +DateTime createdAt
    +DateTime updatedAt
  }

  class TestCase {
    <<embedded>>
    +String input
    +String expectedOutput
    +Boolean isHidden
  }

  class StarterCode {
    <<embedded>>
    +String javascript
    +String python
  }

  class Submission {
    +String _id
    +String userId
    +String problemId
    +Language language
    +String code
    +Verdict verdict
    +Number passedTestCases
    +Number totalTestCases
    +Number executionTimeMs
    +DateTime submittedAt
    +DateTime createdAt
    +DateTime updatedAt
  }

  %% Cardinality & Relationships
  User "1" *-- "0..n" Submission : submits
  Problem "1" <-- "0..n" Submission : evaluated against
  Problem "1" *-- "1..n" TestCase : contains
  Problem "1" *-- "1" StarterCode : contains
```

---

## Enum Definitions

The Mongoose schema enforces strict enumeration constraints across the database:

```sql
CREATE TYPE Role       AS ENUM ('user', 'admin');
CREATE TYPE Provider   AS ENUM ('local', 'google');
CREATE TYPE Difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE Language   AS ENUM ('javascript', 'python');
CREATE TYPE Verdict    AS ENUM ('Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Compile Error');
```
