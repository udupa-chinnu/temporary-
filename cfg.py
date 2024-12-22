import re

class Device:
    def __init__(self, name):
        self.name = name
        self.state = 0

    def turn_on(self):
        self.state = 1
        print(f"{self.name} is now ON.")

    def turn_off(self):
        self.state = 0
        print(f"{self.name} is now OFF.")

    def set_value(self, value):
        self.state = value
        print(f"{self.name} set to {value}.")

class IoTInterpreter:
    def __init__(self):
        self.devices = {
            "Light": Device("Light"),
            "Thermostat": Device("Thermostat"),
            "Sensor": Device("Sensor")
        }

    def parse_and_execute(self, program):
        lines = program.strip().split("\n")
        for line in lines:
            line = line.strip()
            self.execute(line)

    def execute(self, command):
        if command.startswith("turn_on"):
            device = self.extract_device(command, "turn_on")
            self.devices[device].turn_on()
        elif command.startswith("turn_off"):
            device = self.extract_device(command, "turn_off")
            self.devices[device].turn_off()
        elif command.startswith("set"):
            device, value = self.extract_set_command(command)
            self.devices[device].set_value(value)
        elif command.startswith("if"):
            self.handle_condition(command)

    def extract_device(self, command, action):
        match = re.match(fr"{action}\s+(Light|Thermostat|Sensor)", command)
        if match:
            return match.group(1)
        raise ValueError(f"Invalid {action} command: {command}")

    def extract_set_command(self, command):
        match = re.match(r"set\s+(Light|Thermostat|Sensor)\s+to\s+(\d+)", command)
        if match:
            return match.group(1), int(match.group(2))
        raise ValueError(f"Invalid set command: {command}")

    def handle_condition(self, command):
        match = re.match(r"if\s+(Light|Thermostat|Sensor)\s*([<>=]+)\s*(\d+)\s*then\s*(.*)\s*else\s*(.*)", command)
        if match:
            device, operator, value, then_command, else_command = match.groups()
            value = int(value)
            device_state = self.devices[device].state

            condition_met = {
                "==": device_state == value,
                "<": device_state < value,
                ">": device_state > value,
            }.get(operator)

            if condition_met:
                self.execute(then_command.strip())
            else:
                self.execute(else_command.strip())
        else:
            raise ValueError(f"Invalid condition: {command}")

# Sample IoT Program in the Custom Language
program = """
turn_off Light
set Thermostat to 24
if Light == 1 then set Thermostat to 22 else turn_off Thermostat
"""

# Execute the Program
interpreter = IoTInterpreter()
interpreter.parse_and_execute(program)
