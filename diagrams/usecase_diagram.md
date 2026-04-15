# Use Case Diagram -- Nexorithm Online Judge

## 1. Authentication Use Cases

```mermaid
graph LR
    User((User))
    Google((Google OAuth))

    subgraph Authentication System
        UC1["Register with Email\n---\nCreate account with\nusername, email and password"]
        UC2["Login with Email\n---\nAuthenticate using\nemail and password"]
        UC3["Login with Google\n---\nOAuth2 authentication\nvia Google account"]
        UC4["JWT Token Verification\n---\nVerify Bearer token\non protected routes"]
    end

    User --> UC1
    User --> UC2
    User --> UC3
    UC3 -.->|includes| UC4
    UC2 -.->|produces| UC4
    UC1 -.->|produces| UC4
    Google -.->|provides credential| UC3
```

---

## 2. Problem Management Use Cases

```mermaid
graph LR
    User((User))
    Admin((Admin))
    LeetCode((LeetCode API))

    subgraph Problem Management System
        UC5["Browse Problem List\n---\nView paginated list\nof coding problems"]
        UC6["Search and Filter Problems\n---\nFilter by difficulty\ntags or search by title"]
        UC7["View Problem Detail\n---\nView description, starter\ncode and visible test cases"]
        UC8["View Daily Challenge\n---\nFetch and display the\ndaily challenge problem"]
        UC9["Seed Problems\n---\nBulk import problems\nfrom LeetCode API"]
    end

    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    Admin --> UC9
    UC5 -.->|extends| UC6
    UC7 -.->|fetches from| LeetCode
    UC9 -.->|fetches from| LeetCode
```

---

## 3. Code Execution and Judging Use Cases

```mermaid
graph LR
    User((User))

    subgraph Code Execution and Judging System
        UC10["Submit Code\n---\nSubmit solution for\na specific problem"]
        UC11["Run Against Test Cases\n---\nExecute code against\nall test cases"]
        UC12["Execute JavaScript\n---\nRun JS solution\nvia Node.js runtime"]
        UC13["Execute Python\n---\nRun Python solution\nvia Python3 runtime"]
        UC14["View Verdict and Results\n---\nSee pass or fail, test case\nresults and execution time"]
        UC4["JWT Token Verification\n---\nVerify Bearer token\non protected routes"]
    end

    User --> UC10
    User --> UC14
    UC10 -.->|includes| UC4
    UC10 -.->|includes| UC11
    UC11 -.->|includes| UC14
    UC12 -.->|extends| UC11
    UC13 -.->|extends| UC11
```

---

## 4. Submission History Use Cases

```mermaid
graph LR
    User((User))

    subgraph Submission History System
        UC15["View All Submissions\n---\nView complete history\nof past submissions"]
        UC16["View by Problem\n---\nFilter submissions\nfor a specific problem"]
        UC4["JWT Token Verification\n---\nVerify Bearer token\non protected routes"]
    end

    User --> UC15
    User --> UC16
    UC15 -.->|includes| UC4
    UC16 -.->|includes| UC4
    UC16 -.->|extends| UC15
```

---

## Use Case Descriptions

### Authentication

| Use Case | Actor | Pre-condition | Description | Post-condition |
|---|---|---|---|---|
| Register with Email | User | Not registered | Create account with username, email, password | JWT token issued, account created |
| Login with Email | User | Registered | Authenticate with email and password | JWT token issued |
| Login with Google | User, Google | Has Google account | OAuth2 flow, auto-create if new user | JWT token issued, account linked |
| JWT Token Verification | System | Token exists | Verify Bearer token on every protected request | req.user populated with JwtPayload |

### Problems

| Use Case | Actor | Pre-condition | Description | Post-condition |
|---|---|---|---|---|
| Browse Problem List | User, Admin | None | View paginated list of problems | Problem list rendered |
| Search and Filter | User, Admin | None | Filter by difficulty, tags, or keyword | Filtered results shown |
| View Problem Detail | User, Admin | None | View full description, starter code, visible test cases | Problem page rendered |
| View Daily Challenge | User | None | Fetch today's daily challenge | Daily problem displayed |
| Seed Problems | Admin | Admin role | Bulk import from LeetCode API | Problems saved to MongoDB |

### Code Execution and Judging

| Use Case | Actor | Pre-condition | Description | Post-condition |
|---|---|---|---|---|
| Submit Code | User | Authenticated | Submit solution code for a problem | Code sent to judge |
| Run Against Test Cases | System | Code received | Execute code against all test cases sequentially | JudgeResult produced |
| Execute JavaScript | System | Language is JS | Run via Node.js with function detection wrapper | ExecutionResult returned |
| Execute Python | System | Language is Python | Run via Python3 with Solution class wrapper | ExecutionResult returned |
| View Verdict and Results | User | Judging complete | See Accepted, WA, RE, TLE, per-case results, timing | Verdict displayed |

### Submissions

| Use Case | Actor | Pre-condition | Description | Post-condition |
|---|---|---|---|---|
| View All Submissions | User | Authenticated | View complete submission history sorted by date | History rendered |
| View by Problem | User | Authenticated | Filter submissions for a specific problemId | Filtered list rendered |

---

## Actor Summary

| Actor | Type | Role |
|---|---|---|
| User | Primary | Solves problems, submits code, views history |
| Admin | Primary | Seeds and manages problem database |
| Google OAuth | External | Provides OAuth2 credential for authentication |
| LeetCode API | External | Source for problem data via Vercel proxy and GraphQL |
