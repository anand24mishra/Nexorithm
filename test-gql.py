import requests, json

url = "https://leetcode.com/graphql"
payload = {
    "query": """
    query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
            questionId
            titleSlug
            stats
            solution {
                id
                canSeeDetail
                paidOnly
                hasVideoSolution
                paidOnlyVideo
            }
            article
        }
    }
    """,
    "variables": {"titleSlug": "two-sum"}
}
res = requests.post(url, json=payload, headers={"Referer": "https://leetcode.com"})
print(json.dumps(res.json(), indent=2))
