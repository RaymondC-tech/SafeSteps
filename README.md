# walker

API's in main.py:

- http://127.0.0.1:8000/report-condition/ is a post method with body
  {
  "lat": (latitude number),
  "lng": (longitude number),
  "condition": (string road/path condition),
  "id": (optional)
  }

- http://127.0.0.1:8000/report-condition-address/ similar to top but body:
  {
  "address": "3 Timberlane Dr, Brampton, ON L6Y 3Y6",
  "condition": "icy",
  "id": "123456"
  }

- http://127.0.0.1:8000/conditions/ is a get method with no body needed

- http://127.0.0.1:8000/get-route/ is a get method with this body:
  {
  "start_lat": 40.7128,
  "start_lon": -74.0060,
  "goal_lat": 40.730610,
  "goal_lon": -73.935242
  }

- http://127.0.0.1:8000/get-route-addresses/ is a get method with this body:
  {
  "start_address": (starting address),
  "end_address": (ending address)
  }

- http://127.0.0.1:8000/get-route-cond/ is a get method with this body:
  {
  "start_lat": 40.7128,
  "start_lon": -74.0060,
  "goal_lat": 40.730610,
  "goal_lon": -73.935242
  }

- http://127.0.0.1:8000/get-route-addresses-cond/ is a get method with this body:
  {
  "start_address": (starting address),
  "end_address": (ending address)
  }
