from fastapi import FastAPI
from pydantic import BaseModel
import requests

from motor.motor_asyncio import AsyncIOMotorClient
import os

from typing import Optional

import config

# MongoDB connection URL (change if needed)
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Create a MongoDB client
client = AsyncIOMotorClient(MONGO_URI)
database = client["sidewalk_db"]  # Database name
conditions_collection = database["conditions"]  # Collection name

app = FastAPI()

class ReportCondition(BaseModel):   # The input parameters from form
    lat: float
    lng: float
    condition: str
    id: Optional[str] = None

class PathRequest(BaseModel):   # Class for input parameters using pydantic model that works well with API data types
    start_lat: float
    start_lon: float
    goal_lat: float
    goal_lon: float

def get_route_from_google(start_lat, start_lng, end_lat, end_lng):
    API_KEY = config.google_api_key
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_lat},{start_lng}&destination={end_lat},{end_lng}&mode=walking&key={API_KEY}"
    response = requests.get(url)
    return response.json()

@app.get('/')
async def root():
    return {"message": "Welcome to the Sidewalk Condition API"}

@app.post('/report-condition/')
async def report_condition(data: ReportCondition):
    condition_dict = data.model_dump(exclude={"id"})
    result = await conditions_collection.insert_one(condition_dict)
    return {"message": "Condition reported successfully", "id": str(result.inserted_id)}

@app.get('/conditions/')
async def get_conditions():
    conditions = []
    async for condition in conditions_collection.find():
        condition["_id"] = str(condition["_id"])
        conditions.append(condition)
    return conditions