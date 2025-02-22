from fastapi import FastAPI
from pydantic import BaseModel
import requests
from pymongo import MongoClient
from typing import Optional, List

from motor.motor_asyncio import AsyncIOMotorClient
import os

import config


# Create a MongoDB Atlas client
client = MongoClient("mongodb+srv://raymondch49:uBfdd2HYOkHdQ0JD@walker1.xjymx.mongodb.net/?retryWrites=true&w=majority&appName=walker1")
database = client.condition_db  # Database name
conditions_collection = database["condition_collection"]  # Collection name

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

@app.post('/report-condition/')
async def report_condition(data: ReportCondition):
    condition_dict = data.model_dump(exclude={"id"})
    result = await conditions_collection.insert_one(condition_dict)
    return {"message": "Condition reported successfully", "id": str(result.inserted_id)}

@app.get('/conditions/', response_model=List[ConditionResponse])
async def get_conditions():
    conditions = []
    async for condition in conditions_collection.find():
        condition["_id"] = str(condition["_id"])  # Convert ObjectId to string
        conditions.append(ConditionResponse(**condition))  # Use the Pydantic model for serialization
    return conditions