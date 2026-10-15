
from fastapi import APIRouter, HTTPException
from app.database import drought_collection

router = APIRouter(
    prefix="/api/v1/drought",
    tags=["Drought"]
)


@router.get("/districts")
def get_districts():
    """Return the unique districts in the dataset."""
    try:
        districts = drought_collection.distinct(
            "district_name"
        )
        return {
            "total_districts": len(districts),
            "districts": sorted(districts)
        }
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Database query failed: {exc}"
        )


@router.get("/current")
def get_current_summary():
    """Summarize the latest available month for each district."""
    try:
        pipeline = [
            {
                "$sort": {
                    "district_code": 1,
                    "date": -1
                }
            },
            {
                "$group": {
                    "_id": "$district_code",
                    "district_name": {
                        "$first": "$district_name"
                    },
                    "date": {"$first": "$date"},
                    "rainfall_mm": {
                        "$first": "$rainfall_mm"
                    },
                    "normal_rainfall_mm": {
                        "$first": "$normal_rainfall_mm"
                    },
                    "spi_3": {"$first": "$spi_3"},
                    "drought_category": {
                        "$first": "$drought_category"
                    },
                    "risk_score": {"$first": "$risk_score"}
                }
            },
            {
                "$sort": {"district_name": 1}
            }
        ]

        records = list(
            drought_collection.aggregate(pipeline)
        )

        if not records:
            return {
                "total_districts": 0,
                "districts": []
            }

        summary = {}
        for record in records:
            category = str(
                record.get("drought_category", "Unknown")
            ).strip().lower()
            summary[category] = summary.get(category, 0) + 1

        return {
            "total_districts": len(records),
            "category_counts": summary,
            "districts": [
                {
                    "district_code": r["_id"],
                    "district_name": r["district_name"],
                    "date": r.get("date"),
                    "rainfall_mm": r.get("rainfall_mm"),
                    "normal_rainfall_mm": r.get(
                        "normal_rainfall_mm"
                    ),
                    "spi_3": r.get("spi_3"),
                    "drought_category": r.get(
                        "drought_category"
                    ),
                    "risk_score": r.get("risk_score")
                }
                for r in records
            ]
        }
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Database query failed: {exc}"
        )


@router.get("/district/{district}")
def get_district(district: str):
    """Return the latest observation for one district."""
    try:
        record = drought_collection.find_one(
            {
                "district_name": {
                    "$regex": f"^{district}$",
                    "$options": "i"
                }
            },
            sort=[("date", -1)]
        )

        if record is None:
            raise HTTPException(
                status_code=404,
                detail="District not found"
            )

        record.pop("_id", None)
        return record

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Database query failed: {exc}"
        )


@router.get("/history/{district}")
def get_district_history(district: str):
    """Return chronological observations for one district."""
    try:
        records = list(
            drought_collection.find(
                {
                    "district_name": {
                        "$regex": f"^{district}$",
                        "$options": "i"
                    }
                },
                {"_id": 0}
            ).sort("date", 1)
        )

        if not records:
            raise HTTPException(
                status_code=404,
                detail="District not found"
            )

        return {
            "district": records[0]["district_name"],
            "total_records": len(records),
            "history": records
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Database query failed: {exc}"
        )
