class ExpressionEvaluator:
    def evaluate_expression(self, expression):
        stack = []
        number = ""
        for char in expression:
            if char.isdigit():  # Build multi-digit numbers
                number += char
            else:
                if number:  # Push the complete number to the stack
                    stack.append(int(number))
                    number = ""
                if char in "+-*/":  # Push the operator to the stack
                    stack.append(char)
                elif char == ')':  # Evaluate the sub-expression
                    num2 = stack.pop()
                    operator = stack.pop()
                    num1 = stack.pop()
                    if operator == '+':
                        stack.append(num1 + num2)
                    elif operator == '-':
                        stack.append(num1 - num2)
                    elif operator == '*':
                        stack.append(num1 * num2)
                    elif operator == '/':
                        stack.append(num1 // num2)  # Integer division for simplicity
                elif char == '(':  # Do nothing as '(' just indicates a sub-expression
                    pass

        if number:  # Push any remaining number to the stack
            stack.append(int(number))

        # Return the result
        return stack[-1] if stack else 0

if __name__ == "__main__":
    expr = input("Enter an arithmetic expression (e.g., (20/(4-5))): ")
    evaluator = ExpressionEvaluator()
    try:
        result = evaluator.evaluate_expression(expr)
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error evaluating the expression: {e}")
