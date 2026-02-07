# API Contracts (v0)

All responses are JSON. All timestamps are ISO strings.

## Users
### POST /api/users
Upsert user.
Request:
- User (without createdAt/updatedAt allowed; server fills)

Response:
- { user: User }

### GET /api/users/:id
Response:
- { user: User }

## Requests
### POST /api/requests
Request:
- { requesterId, title, description, urgency, format, tags }

Response:
- { request: HelpRequest }

### GET /api/requests/:id
Response:
- { request: HelpRequest }

## Matches
### POST /api/matches/generate
Request:
- { requestId: string, topN?: number }

Response:
- { matches: Match[] }

### GET /api/matches/by-request/:requestId
Response:
- { matches: Match[] }

### POST /api/matches/:id/request
Response:
- { match: Match }

### POST /api/matches/:id/respond
Request:
- { decision: "accepted" | "declined", connectionPayload?: { message?: string, nextStep?: string } }

Response:
- { match: Match }

## Inbox
### GET /api/inbox/:helperId
Response:
- { items: Match[] }   (typically state === "requested")
