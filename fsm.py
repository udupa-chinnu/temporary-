import time

# Define states
states = ["M_Green", "M_Yellow", "C_Green", "C_Yellow"]

# Initialize state
current_state = "M_Green"

# Timing for each state in seconds
state_timings = {
    "M_Green": 2,   # Main road green light duration
    "M_Yellow": 1,  # Main road yellow light duration
    "C_Green": 2,   # Crossroad green light duration
    "C_Yellow": 1   # Crossroad yellow light duration
}

# Function to simulate traffic light behavior
def traffic_light_fsm(vehicle_main, vehicle_cross):
    global current_state
    transition_count = 0  # Count how many transitions have occurred
    
    # Transition logic based on the vehicle conditions
    if vehicle_cross:  # Vehicle on crossroad only
        if current_state == "M_Green":
            print("Main Road: GREEN, Cross Road: RED")
            print("Transitioning to: M_Yellow")
            current_state = "M_Yellow"
            transition_count += 1
        if current_state == "M_Yellow":
            print("Main Road: YELLOW, Cross Road: RED")
            print("Transitioning to: C_Green")
            current_state = "C_Green"
            transition_count += 1
        if current_state == "C_Green":
            print("Main Road: RED, Cross Road: GREEN")
            transition_count += 1

    elif vehicle_main:  # Vehicle on main road only
        if current_state == "C_Green":
            print("Main Road: RED, Cross Road: GREEN")
            print("Transitioning to: C_Yellow")
            current_state = "C_Yellow"
            transition_count += 1
        if current_state == "C_Yellow":
            print("Main Road: RED, Cross Road: YELLOW")
            print("Transitioning to: M_Green")
            current_state = "M_Green"
            transition_count += 1
        if current_state == "M_Green":
            print("Main Road: GREEN, Cross Road: RED")
            transition_count += 1

    # Simulate the timing for each state
    time.sleep(state_timings[current_state])

# List of test cases
# Each test case is a tuple: (vehicle_main, vehicle_cross)
test_cases = [
    
    (False, True),   # Vehicle on crossroad only
    (True, False),   # Vehicle on main road only
    (True, True),    # Vehicles on both roads
    (False, True),   # Continuous crossroad vehicle presence
    (True, False),   # Continuous main road vehicle presence
]

# Simulate FSM operation using test cases
for test_case in test_cases:
    print(f"\nCase: vehicle_main={test_case[0]}, vehicle_cross={test_case[1]}")
    
    # Reset the state at the beginning of each test case
    current_state = "M_Green"  # Start fresh for each test case
    
    # Loop through the transitions for each test case
    traffic_light_fsm(*test_case)
