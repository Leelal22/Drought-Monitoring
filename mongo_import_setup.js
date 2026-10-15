use ap_drought_v1;
db.drought_assessments.createIndex({district_code:1,date:1},{unique:true});
db.drought_assessments.createIndex({drought_category:1});
db.drought_assessments.createIndex({date:1});
db.drought_assessments.createIndex({district_name:1});
print("Indexes created.");
