# Sequence Diagrams — Nexorithm Online Judge

## 1. User Registration (Local)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthRoutes
    participant AuthService
    participant UserModel
    participant MongoDB

    User ->> Frontend: Fill registration form
    Frontend ->> AuthRoutes: POST /api/auth/register
    AuthRoutes ->> AuthService: register(username, email, password)
    AuthService ->> UserModel: findOne({email / username})
    UserModel ->> MongoDB: Query
    MongoDB -->> UserModel: null (no duplicate)
    UserModel -->> AuthService: null
    AuthService ->> AuthService: bcrypt.hash(password, 12)
    AuthService ->> UserModel: create({username, email, passwordHash})
    UserModel ->> MongoDB: Insert
    MongoDB -->> UserModel: Document
    UserModel -->> AuthService: user
    AuthService ->> AuthService: generateToken(JwtPayload)
    AuthService -->> AuthRoutes: { token, user }
    AuthRoutes -->> Frontend: 201 { token, user }
    Frontend -->> User: Redirect to Dashboard
```

---

## 2. User Login (Local)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthRoutes
    participant AuthService
    participant UserModel
    participant MongoDB

    User ->> Frontend: Enter email & password
    Frontend ->> AuthRoutes: POST /api/auth/login
    AuthRoutes ->> AuthService: login(email, password)
    AuthService ->> UserModel: findOne({email})
    UserModel ->> MongoDB: Query
    MongoDB -->> UserModel: Document
    UserModel -->> AuthService: user
    AuthService ->> AuthService: bcrypt.compare(password, passwordHash)
    alt Password matches
        AuthService ->> AuthService: generateToken(JwtPayload)
        AuthService -->> AuthRoutes: { token, user }
        AuthRoutes -->> Frontend: 200 { token, user }
        Frontend -->> User: Redirect to Dashboard
    else Password mismatch
        AuthService -->> AuthRoutes: throw AuthenticationError
        AuthRoutes -->> Frontend: 401 { error }
        Frontend -->> User: Show error message
    end
```

---

## 3. Google OAuth Login

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Google
    participant AuthRoutes
    participant AuthService
    participant OAuth2Client
    participant UserModel
    participant MongoDB

    User ->> Frontend: Click "Sign in with Google"
    Frontend ->> Google: OAuth consent screen
    Google -->> Frontend: credential (ID token)
    Frontend ->> AuthRoutes: POST /api/auth/google-login {credential}
    AuthRoutes ->> AuthService: googleLogin(credential)
    AuthService ->> OAuth2Client: verifyIdToken(credential)
    OAuth2Client ->> Google: Verify token
    Google -->> OAuth2Client: Payload {email, name, sub}
    OAuth2Client -->> AuthService: payload
    AuthService ->> UserModel: findOne({email})
    UserModel ->> MongoDB: Query
    MongoDB -->> UserModel: Result
    alt User not found
        AuthService ->> UserModel: create({email, name, googleId, provider: google})
        UserModel ->> MongoDB: Insert
        MongoDB -->> UserModel: New user
    else User exists without googleId
        AuthService ->> UserModel: save({googleId, provider: google})
        UserModel ->> MongoDB: Update
    end
    UserModel -->> AuthService: user
    AuthService ->> AuthService: generateToken(JwtPayload)
    AuthService -->> AuthRoutes: { token, user }
    AuthRoutes -->> Frontend: 200 { token, user }
    Frontend -->> User: Redirect to Dashboard
```

---

## 4. Browse & View Problem

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant ProblemRoutes
    participant ProblemController
    participant ProblemService
    participant MongoProblemRepo
    participant LeetCodeAPI
    participant MongoDB

    User ->> Frontend: Open problem list
    Frontend ->> ProblemRoutes: GET /api/problems?page=1&limit=20
    ProblemRoutes ->> ProblemController: getProblems(req, res)
    ProblemController ->> ProblemService: getProblems(params)
    ProblemService ->> MongoProblemRepo: findAll(params)
    MongoProblemRepo ->> MongoDB: find() + countDocuments()
    MongoDB -->> MongoProblemRepo: [docs], total
    MongoProblemRepo -->> ProblemService: { problems, total }
    ProblemService -->> ProblemController: { problems, total, page, totalPages }
    ProblemController -->> Frontend: 200 ProblemListResponse
    Frontend -->> User: Render problem list

    User ->> Frontend: Click on a problem
    Frontend ->> ProblemRoutes: GET /api/problems/:slug
    ProblemRoutes ->> ProblemController: getProblemBySlug(req, res)
    ProblemController ->> ProblemService: getProblemBySlug(slug)
    ProblemService ->> MongoProblemRepo: findBySlug(slug)
    MongoProblemRepo ->> MongoDB: findOne({slug})
    alt Found in DB
        MongoDB -->> MongoProblemRepo: Document
        MongoProblemRepo -->> ProblemService: NexorithmProblem
    else Not in DB — fetch externally
        ProblemService ->> LeetCodeAPI: fetchFromVercel(slug)
        LeetCodeAPI -->> ProblemService: raw data
        ProblemService ->> ProblemService: mapVercelToProblem(raw)
        ProblemService ->> MongoProblemRepo: upsert(problem)
        MongoProblemRepo ->> MongoDB: findOneAndUpdate (upsert)
    end
    ProblemService -->> ProblemController: problem (hidden test cases filtered)
    ProblemController -->> Frontend: 200 NexorithmProblem
    Frontend -->> User: Render problem with code editor
```

---

## 5. Code Submission & Judging

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthMiddleware
    participant SubmitRoutes
    participant SubmitController
    participant SubmissionService
    participant ProblemRepo
    participant JudgeService
    participant ExecutorFactory
    participant Executor
    participant SubmissionRepo
    participant MongoDB

    User ->> Frontend: Write code & click Submit
    Frontend ->> SubmitRoutes: POST /api/submissions {code, language, problemId}
    SubmitRoutes ->> AuthMiddleware: authenticateToken()
    AuthMiddleware ->> AuthMiddleware: jwt.verify(token)
    AuthMiddleware -->> SubmitRoutes: req.user = JwtPayload
    SubmitRoutes ->> SubmitController: submit(req, res)
    SubmitController ->> SubmissionService: submitCode(request, userId)

    SubmissionService ->> SubmissionService: Validate code, language, problemId
    SubmissionService ->> ProblemRepo: findById(problemId)
    ProblemRepo ->> MongoDB: findOne({id})
    MongoDB -->> ProblemRepo: Problem with testCases
    ProblemRepo -->> SubmissionService: problem

    SubmissionService ->> JudgeService: judge(code, language, testCases)
    JudgeService ->> ExecutorFactory: getExecutor(language)
    ExecutorFactory -->> JudgeService: IExecutor (JS or Python)

    loop For each TestCase
        JudgeService ->> Executor: execute(code, input)
        Executor ->> Executor: Write temp file
        Executor ->> Executor: execSync(command)
        Executor -->> JudgeService: ExecutionResult {stdout, stderr, exitCode}
        JudgeService ->> JudgeService: Compare actual vs expected output
        alt Test case failed
            JudgeService ->> JudgeService: Set verdict (WA / RE / TLE)
            Note over JudgeService: Break on TLE or Runtime Error
        end
    end

    JudgeService -->> SubmissionService: JudgeResult {verdict, passedCount, results}

    SubmissionService ->> SubmissionRepo: create(submissionData)
    SubmissionRepo ->> MongoDB: Insert submission
    MongoDB -->> SubmissionRepo: Document
    SubmissionRepo -->> SubmissionService: Submission

    SubmissionService -->> SubmitController: SubmissionResponse
    SubmitController -->> Frontend: 200 {verdict, passedCount, results}
    Frontend -->> User: Display verdict & test case results
```

---

## 6. View Submission History

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthMiddleware
    participant SubmitRoutes
    participant SubmitController
    participant SubmissionService
    participant SubmissionRepo
    participant MongoDB

    User ->> Frontend: Open submissions page
    Frontend ->> SubmitRoutes: GET /api/submissions
    SubmitRoutes ->> AuthMiddleware: authenticateToken()
    AuthMiddleware -->> SubmitRoutes: req.user = JwtPayload
    SubmitRoutes ->> SubmitController: getSubmissions(req, res)
    SubmitController ->> SubmissionService: getSubmissionsByUser(userId)
    SubmissionService ->> SubmissionRepo: findByUser(userId)
    SubmissionRepo ->> MongoDB: find({userId}).sort({submittedAt: -1})
    MongoDB -->> SubmissionRepo: [Documents]
    SubmissionRepo -->> SubmissionService: Submission[]
    SubmissionService -->> SubmitController: Submission[]
    SubmitController -->> Frontend: 200 Submission[]
    Frontend -->> User: Render submission history
```
