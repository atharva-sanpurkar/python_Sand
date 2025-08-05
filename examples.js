// Additional code examples for the Python Learning Sandbox
// These can be loaded programmatically or used as reference

const EXTENDED_EXAMPLES = {
    recursion: {
        'Binary Search': `def binary_search(arr, target, left=0, right=None):
    if right is None:
        right = len(arr) - 1
    
    if left > right:
        return -1
    
    mid = (left + right) // 2
    
    if arr[mid] == target:
        return mid
    elif arr[mid] > target:
        return binary_search(arr, target, left, mid - 1)
    else:
        return binary_search(arr, target, mid + 1, right)

# Test with sorted array
numbers = [1, 3, 5, 7, 9, 11, 13, 15]
print(f"Searching for 7: {binary_search(numbers, 7)}")
print(f"Searching for 10: {binary_search(numbers, 10)}")`,

        'Tree Traversal': `class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None

def inorder_traversal(node):
    if node:
        inorder_traversal(node.left)
        print(node.value, end=' ')
        inorder_traversal(node.right)

# Create a simple tree
root = Node(1)
root.left = Node(2)
root.right = Node(3)
root.left.left = Node(4)
root.left.right = Node(5)

print("Inorder traversal:")
inorder_traversal(root)`,

        'Merge Sort': `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    result.extend(left[i:])
    result.extend(right[j:])
    return result

numbers = [64, 34, 25, 12, 22, 11, 90]
sorted_numbers = merge_sort(numbers)
print(f"Original: {numbers}")
print(f"Sorted: {sorted_numbers})"`
    },

    returns: {
        'Decorator Pattern': `def timer(func):
    def wrapper(*args, **kwargs):
        import time
        start = time.time()
        result = func(*args, **kwargs)
        end = time.time()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

@timer
def slow_function():
    import time
    time.sleep(1)
    return "Done!"

result = slow_function()
print(f"Result: {result}")`,

        'Multiple Return Types': `def process_data(data):
    if not data:
        return None, "No data provided"
    
    if isinstance(data, str):
        return data.upper(), "String processed"
    
    if isinstance(data, list):
        return sum(data), "List summed"
    
    return data, "Unknown type"

# Test different types
print(process_data("hello"))
print(process_data([1, 2, 3, 4, 5]))
print(process_data(None))`,

        'Closure Example': `def create_multiplier(factor):
    def multiplier(x):
        return x * factor
    return multiplier

double = create_multiplier(2)
triple = create_multiplier(3)

print(f"Double of 5: {double(5)}")
print(f"Triple of 5: {triple(5)}")`
    },

    lambda: {
        'Lambda with Reduce': `from functools import reduce

numbers = [1, 2, 3, 4, 5]

# Sum all numbers
total = reduce(lambda x, y: x + y, numbers)
print(f"Sum: {total}")

# Find maximum
maximum = reduce(lambda x, y: x if x > y else y, numbers)
print(f"Max: {maximum}")

# Custom operation
custom = reduce(lambda x, y: x * y + 1, numbers)
print(f"Custom: {custom}")`,

        'Lambda with Sort': `students = [
    {'name': 'Alice', 'grade': 85},
    {'name': 'Bob', 'grade': 92},
    {'name': 'Charlie', 'grade': 78},
    {'name': 'Diana', 'grade': 95}
]

# Sort by grade (descending)
sorted_by_grade = sorted(students, key=lambda s: s['grade'], reverse=True)
print("Sorted by grade:")
for student in sorted_by_grade:
    print(f"{student['name']}: {student['grade']}")

# Sort by name
sorted_by_name = sorted(students, key=lambda s: s['name'])
print("\\nSorted by name:")
for student in sorted_by_name:
    print(f"{student['name']}: {student['grade']}")`,

        'Lambda with List Comprehension': `numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

# Using lambda with filter and map
squares_of_evens = list(map(lambda x: x**2, filter(lambda x: x % 2 == 0, numbers)))
print(f"Squares of evens: {squares_of_evens}")

# Equivalent list comprehension
squares_of_evens_lc = [x**2 for x in numbers if x % 2 == 0]
print(f"List comprehension: {squares_of_evens_lc}")`
    },

    scope: {
        'Class Scope': `class Calculator:
    def __init__(self):
        self.history = []
    
    def add(self, x, y):
        result = x + y
        self.history.append(f"{x} + {y} = {result}")
        return result
    
    def get_history(self):
        return self.history

calc = Calculator()
print(calc.add(5, 3))
print(calc.add(10, 7))
print(f"History: {calc.get_history()}")`,

        'Module Scope': `# Simulating module-level variables
PI = 3.14159
VERSION = "1.0.0"

def area_of_circle(radius):
    return PI * radius ** 2

def get_version():
    return VERSION

print(f"Area of circle with radius 5: {area_of_circle(5)}")
print(f"Module version: {get_version()}")`,

        'Nested Function Scope': `def outer_function(x):
    def inner_function(y):
        def deepest_function(z):
            return x + y + z
        return deepest_function
    return inner_function

# Create a function that adds 10 + 5 + 3
func = outer_function(10)(5)
result = func(3)
print(f"Result: {result}")  # Should be 18`
    }
};

// Function to load extended examples
function loadExtendedExample(category, exampleName) {
    if (EXTENDED_EXAMPLES[category] && EXTENDED_EXAMPLES[category][exampleName]) {
        editor.setValue(EXTENDED_EXAMPLES[category][exampleName]);
        switchModule(category);
    }
}

// Make extended examples available globally
window.EXTENDED_EXAMPLES = EXTENDED_EXAMPLES;
window.loadExtendedExample = loadExtendedExample; 