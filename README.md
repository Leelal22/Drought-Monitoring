# AP Drought Monitoring V1 Synthetic Dataset

Synthetic/development data only. Do not use for scientific or policy conclusions.

26 districts x 10 years (2016-2025) x 12 months = 3,120 records.

## Files
- ap_drought_synthetic_2016_2025_3120.csv
- ap_drought_synthetic_2016_2025_3120.json (JSON Lines for mongoimport)
- generate_dataset.py
- mongo_import_setup.js

## MongoDB import
```cmd
mongoimport --uri="mongodb://localhost:27017/ap_drought_v1" --collection=drought_assessments --type=json --file=ap_drought_synthetic_2016_2025_3120.json
```
Verify with `mongosh`, then `use ap_drought_v1` and `db.drought_assessments.countDocuments()`; expected 3120.

SPI-3 is a development approximation based on standardized rolling 3-month rainfall. Replace it with validated SPI calculations and official climate data in the final version.
