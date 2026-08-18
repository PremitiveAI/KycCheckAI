# Masters API

Routers: `master_router` (public reads) and `masterprotected_router` (writes), both `/master`, in
[`app/routes/master_routes.py`](../../backend/app/routes/master_routes.py). Controller:
`MasterController`; service: `master_service.py`.

Two entities — **Feature Type** and **Category** — with identical CRUD shapes. **8 endpoints.**

## Summary

| Method | Path | Auth | Schema |
| ------ | ---- | ---- | ------ |
| POST | `/master/feature/save` | token + **session** | `FeatureType` |
| POST | `/master/feature/list` | token | `UserListReq` |
| GET | `/master/feature/details/{id}` | token | — |
| DELETE | `/master/feature/delete/{id}` | token + **session** | — |
| POST | `/master/category/save` | token + **session** | `CategoryType` |
| POST | `/master/category/list` | token | `UserListReq` |
| GET | `/master/category/details/{id}` | token | — |
| DELETE | `/master/category/delete/{id}` | token + **session** | — |

Reads are public (token only); writes and deletes require a session. This is the only module in the
codebase that draws that distinction correctly.

## Request schemas — verified

```python
class FeatureType(BaseModel):
    id:          Optional[int] = None      # present → update, absent → create
    name:        str                        # required
    description: Optional[str] = None
    imageId:     Optional[str] = None
    imagePath:   Optional[str] = None
    createdBy:   Optional[int] = None
    updatedBy:   Optional[int] = None

class CategoryType(BaseModel):              # identical shape
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    imageId: Optional[str] = None
    imagePath: Optional[str] = None
    createdBy: Optional[int] = None
    updatedBy: Optional[int] = None
```

`name` is the only required field on both. `id` drives create-vs-update.

List requests use `UserListReq` — `search`, `filter`, `startDate`, `endDate`, `sort` (`createdAt`),
`order` (`DESC`), `limit` (10), `offset` (0), all optional.

## Database

| Schema | Table | Notes |
| ------ | ----- | ----- |
| `FeatureType` | `tbl_feature_type_master` | `name` String(150) NOT NULL · `description` Text · `imageId` String(50) · `imagePath` · timezone-aware `createdAt`/`updatedAt` |
| `CategoryType` | `tbl_category_master` | `name` String(255) NOT NULL · `description` String(500) · `imageId` · `imagePath` |

Both carry `createdBy`/`updatedBy` foreign keys to `tbl_admin.id` with `created_by_user` /
`updated_by_user` `selectin` relationships — the only tables in the schema that resolve their audit
actors.

Full detail: [../database/schema.md](../database/schema.md).

## Response shape

```json
{ "Success": { "message": "List fetched successfully",
    "data": { "total": 4,
      "list": [ { "id": 1, "name": "KYC", "description": "…",
                  "imageId": null, "imagePath": null, "status": 1,
                  "createdAt": "…", "updatedAt": "…" } ] } },
  "Code": 0, "Error": null }
```

> The exact key names and pagination wrapper were **not verified line-by-line** — `master_service.py`
> was read structurally. Treat the shape above as indicative and confirm against a live response.

## Frontend usage

| Endpoint | Handler | Page |
| -------- | ------- | ---- |
| `master/feature/list` | `/api/feature-list` | `generate-auth` |
| `master/category/list` | `/api/profile-feature-list` | `generate-auth` |

Both handlers send `PK-sessionToken` from the cookie even though the list endpoints are on the public
router — harmless.

**The save, details and delete endpoints have no frontend caller.** Master data is currently created
through Swagger or direct API calls. The `settings` page is a 13-line stub with no functionality.

## Naming note

`/api/profile-feature-list` calls `master/category/list`, not a feature endpoint — the handler name
does not match its target. Worth renaming if that file is touched.
