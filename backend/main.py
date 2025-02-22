from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
import requests
from pymongo import MongoClient
from typing import Optional, List

from motor.motor_asyncio import AsyncIOMotorClient
import os
import sys
import requests

from math import radians, sin, cos, sqrt, atan2

# Add the parent directory to the system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config


# MongoDB connection URL (change if needed)
MONGO_URI = "mongodb+srv://sahajdeeps2003:E9xOB2BoFhNaA41R@cluster0.wop0f.mongodb.net/"

# Create a MongoDB client
client = AsyncIOMotorClient(MONGO_URI)
db = client["sidewalk_db"]  # Database name
conditions_collection = db["conditions"]  # Collection name

app = FastAPI()

# Allow CORS for all origins (you can restrict this in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ReportCondition(BaseModel):   # The input parameters from form
    lat: Optional[float] = None
    lng: Optional[float] = None
    condition: Optional[str] = None

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

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate the distance between two points in a simple way."""
    # A fixed number that represents how big the Earth is
    earth_radius = 6371  # Earth radius in kilometers
    
    # Convert the latitude and longitude values from "degrees" to a "special unit"
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])

    # Find out how much they differ in both directions
    delta_lat = lat2 - lat1
    delta_lng = lng2 - lng1
    
    # Use the simple shortcut to calculate the distance between two points
    a = sin(delta_lat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(delta_lng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    # Get the distance by multiplying by the Earth's size
    distance = earth_radius * c
    return distance

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

@app.post('/report-condition/')
async def report_condition(data: ReportCondition):
    # Convert the incoming data to a dictionary
    condition_dict = data.dict(exclude={"id"})  # Exclude the id if present
    # Insert the hazard report into the MongoDB collection
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

@app.get('/get-route/')
async def get_route(route_request: PathRequest):    # works, this and below gives defualt route which can be used in javascript
    route_data = get_route_from_google(
        route_request.start_lat, 
        route_request.start_lon, 
        route_request.goal_lat, 
        route_request.goal_lon
    )
    return route_data

# Route to calculate route from addresses
@app.get('/get-route-addresses/')
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

@app.get('/get-route-cond/')
async def get_route_cond(route_request: PathRequest):    # works, this and below gives defualt route which can be used in javascript
    # Extract blocked locations (lat, lng) from all conditions
    blocked_locations = [(condition["lat"], condition["lng"]) for condition in await get_conditions()]

    route_data = get_route_with_conditions(
        route_request.start_lat,
        route_request.start_lon,
        route_request.goal_lat,
        route_request.goal_lon,
        blocked_locations
    )
    
    return route_data

# Route to calculate route from addresses
@app.get('/get-route-addresses-cond/')
async def get_route_addresses_cond(route_address: RouteAddresses):
    # Convert the start and end addresses to coordinates
    start_lat, start_lng = get_coordinates_from_address(route_address.start_address)
    end_lat, end_lng = get_coordinates_from_address(route_address.end_address)

    # If the addresses could not be geocoded, return an error
    if start_lat is None or end_lat is None:
        return {"error": "Could not find one or both addresses"}
    
    blocked_locations = [(condition["lat"], condition["lng"]) for condition in await get_conditions()]

    route_data = get_route_with_conditions(
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        blocked_locations
    )
    
    return route_data

def get_route_with_conditions(start_lat, start_lng, end_lat, end_lng, blocked_locations):
    """Finds a route and adds comments to each step if intersections with blocked locations exist."""
    API_KEY = config.google_api_key_sahaj
    url = f"https://maps.googleapis.com/maps/api/directions/json?origin={start_lat},{start_lng}&destination={end_lat},{end_lng}&mode=walking&key={API_KEY}"
    
    response = requests.get(url)
    routes = response.json().get("routes", [])

    if not routes:
        return None  # No routes found

    route = routes[0]  # Select the first route

    # Add comments for blocked locations
    for step in route["legs"][0]["steps"]:
        lat, lng = step["end_location"]["lat"], step["end_location"]["lng"]
        if is_location_blocked(lat, lng, blocked_locations):
            step["comment"] = "Caution: This step intersects with a blocked location."
        else:
            step["comment"] = "No known issues on this step."

    return route  # Return the modified route with comments

def is_location_blocked(lat, lng, blocked_locations, tolerance=0.001):
    """Check if the given location is within a tolerance range of any blocked locations."""
    for blocked_lat, blocked_lng in blocked_locations:
        if abs(lat - blocked_lat) < tolerance and abs(lng - blocked_lng) < tolerance:
            return True
    return False

