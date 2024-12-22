class TuringMachineBankingSystem:
    def __init__(self):
        self.tape = [0]  # Initialize the tape with a balance of 0
        self.head = 0  # Head starts at the beginning of the tape
        self.state = "q0"  # Initial state
        self.operations = []  # List of operations to process

    def load_operations(self, operations):
        self.operations = operations

    def read_tape(self):
        return self.tape[self.head]

    def write_tape(self, value):
        if self.head >= len(self.tape):
            self.tape.append(0)
        self.tape[self.head] = value

    def move_head(self, direction):
        if direction == "R":
            self.head += 1
            if self.head >= len(self.tape):
                self.tape.append(0)
        elif direction == "L" and self.head > 0:
            self.head -= 1

    def execute_operation(self, operation):
        if self.state == "q0":
            if operation.startswith("D"):
                self.state = "qD"
                self.deposit(int(operation[1:]))
            elif operation.startswith("W"):
                self.state = "qW"
                self.withdraw(int(operation[1:]))
            elif operation.startswith("B"):
                self.state = "qB"
                self.balance_inquiry()
            self.state = "qF"  # Final state after operation

    def deposit(self, amount):
        self.write_tape(self.read_tape() + amount)
        print(f"Deposited {amount}. New Balance: {self.read_tape()}")

    def withdraw(self, amount):
        if self.read_tape() >= amount:
            self.write_tape(self.read_tape() - amount)
            print(f"Withdrew {amount}. New Balance: {self.read_tape()}")
        else:
            print(f"Insufficient funds to withdraw {amount}. Current Balance: {self.read_tape()}")

    def balance_inquiry(self):
        print(f"Current Balance: {self.read_tape()}")

    def run(self):
        for operation in self.operations:
            self.execute_operation(operation)
            self.state = "q0"  # Reset to initial state for the next operation


# Example usage
if __name__ == "__main__":
    tm = TuringMachineBankingSystem()
    operations = ["D50", "B", "W20", "B", "W40", "B"]  # Example operations
    tm.load_operations(operations)
    tm.run()
