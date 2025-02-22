from fastapi import FastAPI
from fastapi import HTTPException

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

class ReportConditionAddress(BaseModel):   # The input parameters from form
    address: str
    condition: str
    id: Optional[str] = None

class PathRequest(BaseModel):   # Class for input parameters using pydantic model that works well with API data types
    start_lat: float
    start_lon: float
    goal_lat: float
    goal_lon: float

class RouteAddresses(BaseModel):
    start_address: str
    end_address: str

def get_route_from_google(start_lat, start_lng, end_lat, end_lng):
    API_KEY = config.google_api_key_sahaj
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_lat},{start_lng}&destination={end_lat},{end_lng}&mode=walking&key={API_KEY}"
    response = requests.get(url)
    return response.json()

def get_coordinates_from_address(address: str):
    API_KEY = config.google_api_key_sahaj
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={API_KEY}"
    response = requests.get(url)
    data = response.json()

    if data["status"] == "OK":
        lat = data["results"][0]["geometry"]["location"]["lat"]
        lng = data["results"][0]["geometry"]["location"]["lng"]
        return lat, lng
    else:
        # More detailed error response handling
        error_message = data.get("error_message", "No error message available.")
        return None, f"Geocoding failed: {error_message} (Status: {data['status']})"

@app.get('/')
async def root():
    return {"message": "Welcome to the Sidewalk Condition API"}

@app.post('/report-condition/') # works
async def report_condition(data: ReportCondition):
    condition_dict = data.model_dump(exclude={"id"})
    result = await conditions_collection.insert_one(condition_dict)
    return {"message": "Condition reported successfully", "id": str(result.inserted_id)}

@app.post('/report-condition-address/')
async def report_condition_address(data: ReportConditionAddress):
    lat, lon = get_coordinates_from_address(data.address)

    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Invalid address")

    # Create a ReportCondition object with the obtained coordinates
    condition_data = ReportCondition(lat=lat, lng=lon, condition=data.condition)

    # Call the existing report_condition function
    return await report_condition(condition_data)

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

# Route to calculate route from addresses
@app.post('/get-route-addresses/')
async def get_route_addresses(route_address: RouteAddresses):
    # Convert the start and end addresses to coordinates
    start_lat, start_lng = get_coordinates_from_address(route_address.start_address)
    end_lat, end_lng = get_coordinates_from_address(route_address.end_address)

    # If the addresses could not be geocoded, return an error
    if start_lat is None or end_lat is None:
        return {"error": "Could not find one or both addresses"}

    # Get the route using the geocoded coordinates
    route_data = get_route_from_google(start_lat, start_lng, end_lat, end_lng)
    
    return route_data
