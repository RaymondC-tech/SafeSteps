from fastapi import FastAPI
from pydantic import BaseModel
import requests

import config

app = FastAPI()

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
    return {}