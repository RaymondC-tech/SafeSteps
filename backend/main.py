from fastapi import FastAPI
from pydantic import BaseModel
import requests
from pymongo import MongoClient
from typing import Optional, List

from motor.motor_asyncio import AsyncIOMotorClient
import os

import config


# MongoDB connection URL (change if needed)
MONGO_URI = "mongodb+srv://sahajdeeps2003:E9xOB2BoFhNaA41R@cluster0.wop0f.mongodb.net/"

# Create a MongoDB client
client = AsyncIOMotorClient(MONGO_URI)
db = client["sidewalk_db"]  # Database name
conditions_collection = db["conditions"]  # Collection name

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

class ConditionResponse(BaseModel):
    id: str
    lat: float
    lng: float
    condition: str

def get_route_from_google(start_lat, start_lng, end_lat, end_lng):
    API_KEY = config.google_api_key
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_lat},{start_lng}&destination={end_lat},{end_lng}&mode=walking&key={API_KEY}"
    response = requests.get(url)
    return response.json()

@app.get('/')
async def root():
    return {"message": "Welcome to the Sidewalk Condition API"}

@app.post('/report-condition/') # works
async def report_condition(data: ReportCondition):
    condition_dict = data.model_dump(exclude={"id"})
    result = await conditions_collection.insert_one(condition_dict)
    return {"message": "Condition reported successfully", "id": str(result.inserted_id)}

@app.get('/conditions/')        # works
async def get_conditions():
    conditions = []
    async for condition in conditions_collection.find():
        condition["_id"] = str(condition["_id"])
        conditions.append(condition)
    return conditions

@app.post('/get-route/')
async def get_route(route_request: PathRequest):    # works
    route_data = get_route_from_google(
        route_request.start_lat, 
        route_request.start_lon, 
        route_request.goal_lat, 
        route_request.goal_lon
    )
    return route_data

