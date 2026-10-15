
import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27017"
)
DATABASE_NAME = os.getenv(
    "DATABASE_NAME",
    "ap_drought_v1"
)
COLLECTION_NAME = os.getenv(
    "COLLECTION_NAME",
    "drought_assessments"
)

client = MongoClient(
    MONGODB_URI,
    serverSelectionTimeoutMS=5000
)

database = client[DATABASE_NAME]
drought_collection = database[COLLECTION_NAME]


def check_database():
    client.admin.command("ping")
    return True
