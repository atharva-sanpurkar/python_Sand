// Global variables
let currentModule = 'recursion';
let editor;
let executionStep = 0;
let callStack = [];
let variableScopes = {};
let isExecuting = false;

// Custom Python-like interpreter
class PythonInterpreter {
    constructor() {
        this.variables = {};
        this.functions = {};
        this.output = [];
        this.callStack = [];
        this.scopeStack = [];
    }

    // Simple Python-like syntax highlighting
    highlightSyntax(code) {
        const keywords = ['def', 'if', 'else', 'elif', 'for', 'while', 'return', 'print', 'lambda', 'class', 'import', 'from', 'as', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None'];
        const operators = ['+', '-', '*', '/', '//', '%', '**', '==', '!=', '<=', '>=', '<', '>', '=', '+=', '-=', '*=', '/=', '%=', '**='];
        
        let highlighted = code;
        
        // Highlight keywords
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'g');
            highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
        });
        
        // Highlight operators
        operators.forEach(op => {
            const regex = new RegExp(`\\${op}`, 'g');
            highlighted = highlighted.replace(regex, `<span class="operator">${op}</span>`);
        });
        
        // Highlight strings
        highlighted = highlighted.replace(/(["'`])((?:(?!\1)[^\\]|\\.)*\1)/g, '<span class="string">$&</span>');
        
        // Highlight numbers
        highlighted = highlighted.replace(/\b\d+\.?\d*\b/g, '<span class="number">$&</span>');
        
        // Highlight comments
        highlighted = highlighted.replace(/#.*$/gm, '<span class="comment">$&</span>');
        
        // Highlight function definitions
        highlighted = highlighted.replace(/\bdef\s+(\w+)/g, '<span class="keyword">def</span> <span class="function">$1</span>');
        
        return highlighted;
    }

    // Execute Python-like code
    execute(code) {
        this.output = [];
        this.variables = {};
        this.callStack = [];
        this.scopeStack = [];
        
        const lines = code.split('\n').filter(line => line.trim());
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('def ')) {
                this.defineFunction(line, lines, i);
            } else if (line.startsWith('print(')) {
                this.executePrint(line);
            } else if (line.includes('=')) {
                this.executeAssignment(line);
            } else if (line.includes('(') && line.includes(')')) {
                this.executeFunctionCall(line);
            }
        }
        
        return this.output.join('\n');
    }

    defineFunction(line, allLines, startIndex) {
        const match = line.match(/def\s+(\w+)\s*\(([^)]*)\)/);
        if (match) {
            const funcName = match[1];
            const params = match[2].split(',').map(p => p.trim()).filter(p => p);
            
            // Find function body
            let body = [];
            let braceCount = 0;
            let inFunction = false;
            
            for (let i = startIndex; i < allLines.length; i++) {
                const currentLine = allLines[i];
                if (currentLine.includes('def ') && !inFunction) {
                    inFunction = true;
                    braceCount = this.countBraces(currentLine);
                } else if (inFunction) {
                    body.push(currentLine);
                    braceCount += this.countBraces(currentLine);
                    if (braceCount <= 0) break;
                }
            }
            
            this.functions[funcName] = { params, body: body.slice(1, -1) };
        }
    }

    countBraces(line) {
        let count = 0;
        for (let char of line) {
            if (char === ':') count++;
            if (char === 'return') count--;
        }
        return count;
    }

    executePrint(line) {
        const match = line.match(/print\s*\(([^)]+)\)/);
        if (match) {
            const expression = match[1];
            const value = this.evaluateExpression(expression);
            this.output.push(value);
        }
    }

    executeAssignment(line) {
        const [varName, expression] = line.split('=').map(s => s.trim());
        const value = this.evaluateExpression(expression);
        this.variables[varName] = value;
    }

    executeFunctionCall(line) {
        const match = line.match(/(\w+)\s*\(([^)]*)\)/);
        if (match) {
            const funcName = match[1];
            const args = match[2].split(',').map(arg => this.evaluateExpression(arg.trim()));
            
            if (this.functions[funcName]) {
                this.callStack.push({ name: funcName, args });
                this.executeFunction(funcName, args);
            }
        }
    }

    executeFunction(funcName, args) {
        const func = this.functions[funcName];
        if (!func) return;
        
        // Create local scope
        const localScope = {};
        func.params.forEach((param, index) => {
            localScope[param] = args[index] || 0;
        });
        
        this.scopeStack.push(localScope);
        
        // Execute function body
        for (let line of func.body) {
            if (line.includes('return ')) {
                const returnValue = this.evaluateExpression(line.replace('return ', ''));
                this.scopeStack.pop();
                return returnValue;
            }
        }
        
        this.scopeStack.pop();
    }

    evaluateExpression(expr) {
        // Simple expression evaluator
        expr = expr.trim();
        
        // Handle strings
        if (expr.startsWith('"') || expr.startsWith("'")) {
            return expr.slice(1, -1);
        }
        
        // Handle numbers
        if (!isNaN(expr)) {
            return parseFloat(expr);
        }
        
        // Handle variables
        if (this.variables[expr] !== undefined) {
            return this.variables[expr];
        }
        
        // Handle simple arithmetic
        if (expr.includes('+')) {
            const [left, right] = expr.split('+').map(e => this.evaluateExpression(e.trim()));
            return left + right;
        }
        if (expr.includes('-')) {
            const [left, right] = expr.split('-').map(e => this.evaluateExpression(e.trim()));
            return left - right;
        }
        if (expr.includes('*')) {
            const [left, right] = expr.split('*').map(e => this.evaluateExpression(e.trim()));
            return left * right;
        }
        if (expr.includes('/')) {
            const [left, right] = expr.split('/').map(e => this.evaluateExpression(e.trim()));
            return left / right;
        }
        
        return expr;
    }
}

// Custom Code Editor
class CodeEditor {
    constructor(element) {
        this.element = element;
        this.lineNumbers = document.getElementById('line-numbers');
        this.interpreter = new PythonInterpreter();
        this.setupEditor();
    }

    setupEditor() {
        this.element.addEventListener('input', () => {
            this.updateLineNumbers();
            this.highlightSyntax();
        });

        this.element.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertText('    ');
            }
        });

        this.element.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.element.scrollTop;
        });

        this.updateLineNumbers();
    }

    getValue() {
        return this.element.textContent;
    }

    setValue(code) {
        this.element.textContent = code;
        this.updateLineNumbers();
        this.highlightSyntax();
    }

    updateLineNumbers() {
        const lines = this.element.textContent.split('\n');
        this.lineNumbers.innerHTML = lines.map((_, i) => i + 1).join('\n');
    }

    highlightSyntax() {
        const code = this.element.textContent;
        const highlighted = this.interpreter.highlightSyntax(code);
        
        // Store cursor position
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const cursorOffset = range.startOffset;
        
        // Apply highlighting
        this.element.innerHTML = highlighted;
        
        // Restore cursor position
        this.element.focus();
        try {
            const newRange = document.createRange();
            const textNode = this.element.firstChild || this.element;
            newRange.setStart(textNode, Math.min(cursorOffset, textNode.length));
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } catch (e) {
            // If cursor restoration fails, just focus the element
            this.element.focus();
        }
    }

    insertText(text) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
    initializeModules();
    setupEventListeners();
    loadDefaultCode();
});

// Initialize custom code editor
function initializeEditor() {
    const editorElement = document.getElementById('code-editor');
    editor = new CodeEditor(editorElement);
}

// Initialize learning modules with better examples
function initializeModules() {
    const modules = {
        recursion: {
            title: '🔄 Recursion Visualizer',
            examples: {
                'Factorial': `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))`,
                'Fibonacci': `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(6))`,
                'Countdown': `def countdown(n):
    if n <= 0:
        print("Blast off!")
        return
    print(n)
    countdown(n - 1)

countdown(5)`,
                'Sum of Digits': `def sum_digits(n):
    if n < 10:
        return n
    return n % 10 + sum_digits(n // 10)

print(sum_digits(12345))`,
                'Power Function': `def power(base, exp):
    if exp == 0:
        return 1
    return base * power(base, exp - 1)

print(power(2, 8))`
            }
        },
        returns: {
            title: '↩️ Return Explorer',
            examples: {
                'Nested Returns': `def outer_function(x):
    def inner_function(y):
        return y * 2
    result = inner_function(x)
    return result + 10

print(outer_function(5))`,
                'Multiple Returns': `def check_number(n):
    if n > 0:
        return "Positive"
    elif n < 0:
        return "Negative"
    else:
        return "Zero"

print(check_number(7))
print(check_number(-3))
print(check_number(0))`,
                'Return with Calculation': `def calculate_area(shape, width, height=0):
    if shape == "rectangle":
        return width * height
    elif shape == "square":
        return width * width
    elif shape == "circle":
        return 3.14159 * width * width
    else:
        return 0

print(calculate_area("rectangle", 5, 3))
print(calculate_area("square", 4))
print(calculate_area("circle", 2))`
            }
        },
        lambda: {
            title: 'λ Lambda Playground',
            examples: {
                'Basic Lambda': `square = lambda x: x * x
print(square(5))

add = lambda x, y: x + y
print(add(3, 4))`,
                'Lambda with Map': `numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x**2, numbers))
print(squared)`,
                'Lambda with Filter': `numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
evens = list(filter(lambda x: x % 2 == 0, numbers))
print(evens)`,
                'Lambda with Reduce': `from functools import reduce
numbers = [1, 2, 3, 4, 5]
total = reduce(lambda x, y: x + y, numbers)
print(total)`,
                'Lambda with Sort': `students = [
    {'name': 'Alice', 'grade': 85},
    {'name': 'Bob', 'grade': 92},
    {'name': 'Charlie', 'grade': 78}
]
sorted_students = sorted(students, key=lambda s: s['grade'], reverse=True)
print(sorted_students)`
            }
        },
        scope: {
            title: '🌍 Scope & Lifetime',
            examples: {
                'Global vs Local': `global_var = "I'm global"

def test_scope():
    local_var = "I'm local"
    print(f"Inside function: {local_var}")
    print(f"Global var: {global_var}")

test_scope()
print(f"Outside: {global_var}")`,
                'Variable Lifetime': `def create_counter():
    count = 0
    def counter():
        nonlocal count
        count += 1
        return count
    return counter

my_counter = create_counter()
print(my_counter())
print(my_counter())
print(my_counter())`,
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
print(calc.get_history())`
            }
        }
    };

    // Populate examples dropdown
    const examplesSelect = document.getElementById('examples-select');
    examplesSelect.innerHTML = '<option value="">Choose an example...</option>';
    
    Object.keys(modules).forEach(moduleName => {
        const module = modules[moduleName];
        Object.keys(module.examples).forEach(exampleName => {
            const option = document.createElement('option');
            option.value = `${moduleName}:${exampleName}`;
            option.textContent = exampleName;
            examplesSelect.appendChild(option);
        });
    });

    window.modules = modules;
}

// Setup event listeners
function setupEventListeners() {
    // Module switching
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const module = this.dataset.module;
            switchModule(module);
        });
    });

    // Control buttons
    document.getElementById('run-btn').addEventListener('click', runCode);
    document.getElementById('step-btn').addEventListener('click', stepExecution);
    document.getElementById('reset-btn').addEventListener('click', resetExecution);
    document.getElementById('explain-btn').addEventListener('click', showExplanation);

    // Examples dropdown
    document.getElementById('examples-select').addEventListener('change', function() {
        if (this.value) {
            const [module, example] = this.value.split(':');
            loadExample(module, example);
        }
    });

    // Clear console
    document.getElementById('clear-console').addEventListener('click', clearConsole);
}

// Switch between learning modules
function switchModule(moduleName) {
    currentModule = moduleName;
    
    // Update active button
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-module="${moduleName}"]`).classList.add('active');
    
    // Update visualizer title
    document.getElementById('visualizer-title').textContent = window.modules[moduleName].title;
    
    // Clear visualizer
    clearVisualizer();
    
    // Load default code for module
    loadDefaultCode();
}

// Load default code for current module
function loadDefaultCode() {
    const module = window.modules[currentModule];
    const firstExample = Object.values(module.examples)[0];
    editor.setValue(firstExample);
}

// Load specific example
function loadExample(moduleName, exampleName) {
    const example = window.modules[moduleName].examples[exampleName];
    editor.setValue(example);
    switchModule(moduleName);
}

// Run code with custom interpreter
function runCode() {
    if (isExecuting) return;
    
    const code = editor.getValue();
    clearConsole();
    clearVisualizer();
    
    isExecuting = true;
    
    try {
        const result = editor.interpreter.execute(code);
        appendToConsole(result);
        visualizeExecution(code);
    } catch (error) {
        appendToConsole(`Error: ${error}`);
    } finally {
        isExecuting = false;
    }
}

// Step through execution
function stepExecution() {
    appendToConsole("Step execution: Click 'Run' to execute the code step by step");
}

// Reset execution
function resetExecution() {
    executionStep = 0;
    callStack = [];
    variableScopes = {};
    clearVisualizer();
    clearConsole();
}

// Show explanation for current module
function showExplanation() {
    const explanations = {
        recursion: `Recursion is when a function calls itself. Each call creates a new frame on the call stack. 
        The function keeps calling itself until it reaches a base case (stopping condition).`,
        returns: `Return statements send values back to the calling function. The return value flows back up 
        through the call stack, with each function potentially modifying the value.`,
        lambda: `Lambda functions are anonymous functions defined with the lambda keyword. They can take any 
        number of arguments but can only have one expression. They're often used with map(), filter(), and reduce().`,
        scope: `Variable scope determines where a variable can be accessed. Local variables exist only within 
        their function, while global variables can be accessed throughout the program.`
    };
    
    appendToConsole(`\n💡 EXPLANATION:\n${explanations[currentModule]}`);
}

// Visualize execution based on module
function visualizeExecution(code) {
    switch(currentModule) {
        case 'recursion':
            visualizeRecursion(code);
            break;
        case 'returns':
            visualizeReturns(code);
            break;
        case 'lambda':
            visualizeLambda(code);
            break;
        case 'scope':
            visualizeScope(code);
            break;
    }
}

// Visualize recursion
function visualizeRecursion(code) {
    const callStackDiv = document.getElementById('call-stack');
    callStackDiv.innerHTML = '<h4>Call Stack:</h4>';
    
    if (code.includes('factorial')) {
        visualizeFactorial();
    } else if (code.includes('fibonacci')) {
        visualizeFibonacci();
    } else if (code.includes('countdown')) {
        visualizeCountdown();
    } else if (code.includes('sum_digits')) {
        visualizeSumDigits();
    } else if (code.includes('power')) {
        visualizePower();
    }
}

// Visualize factorial recursion
function visualizeFactorial() {
    const callStackDiv = document.getElementById('call-stack');
    const outputDiv = document.getElementById('output-display');
    
    callStackDiv.innerHTML = '<h4>Call Stack:</h4>';
    outputDiv.innerHTML = '<h4>Return Values:</h4>';
    
    // Simulate factorial(5) execution
    const steps = [
        { call: 'factorial(5)', return: '5 * factorial(4)' },
        { call: 'factorial(4)', return: '4 * factorial(3)' },
        { call: 'factorial(3)', return: '3 * factorial(2)' },
        { call: 'factorial(2)', return: '2 * factorial(1)' },
        { call: 'factorial(1)', return: '1' }
    ];
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            const frame = document.createElement('div');
            frame.className = 'call-frame';
            frame.textContent = step.call;
            callStackDiv.appendChild(frame);
            
            const returnVal = document.createElement('div');
            returnVal.className = 'return-value';
            returnVal.textContent = `${step.call} → ${step.return}`;
            outputDiv.appendChild(returnVal);
        }, index * 1000);
    });
}

// Visualize Fibonacci recursion
function visualizeFibonacci() {
    const callStackDiv = document.getElementById('call-stack');
    callStackDiv.innerHTML = '<h4>Call Stack:</h4>';
    
    // Show Fibonacci tree structure
    const tree = `
    fibonacci(6)
    ├── fibonacci(5)
    │   ├── fibonacci(4)
    │   │   ├── fibonacci(3)
    │   │   │   ├── fibonacci(2)
    │   │   │   │   ├── fibonacci(1) = 1
    │   │   │   │   └── fibonacci(0) = 0
    │   │   │   └── fibonacci(1) = 1
    │   │   └── fibonacci(2)
    │   │       ├── fibonacci(1) = 1
    │   │       └── fibonacci(0) = 0
    │   └── fibonacci(3)
    │       ├── fibonacci(2)
    │       │   ├── fibonacci(1) = 1
    │       │   └── fibonacci(0) = 0
    │       └── fibonacci(1) = 1
    └── fibonacci(4)
        ├── fibonacci(3)
        │   ├── fibonacci(2)
        │   │   ├── fibonacci(1) = 1
        │   │   └── fibonacci(0) = 0
        │   └── fibonacci(1) = 1
        └── fibonacci(2)
            ├── fibonacci(1) = 1
            └── fibonacci(0) = 0
    `;
    
    const pre = document.createElement('pre');
    pre.style.fontFamily = 'JetBrains Mono, monospace';
    pre.style.fontSize = '0.8rem';
    pre.style.color = '#4a5568';
    pre.textContent = tree;
    callStackDiv.appendChild(pre);
}

// Visualize countdown
function visualizeCountdown() {
    const callStackDiv = document.getElementById('call-stack');
    callStackDiv.innerHTML = '<h4>Call Stack:</h4>';
    
    for (let i = 5; i >= 0; i--) {
        setTimeout(() => {
            const frame = document.createElement('div');
            frame.className = 'call-frame';
            frame.textContent = `countdown(${i})`;
            callStackDiv.appendChild(frame);
        }, (5 - i) * 500);
    }
}

// Visualize sum of digits
function visualizeSumDigits() {
    const callStackDiv = document.getElementById('call-stack');
    const outputDiv = document.getElementById('output-display');
    
    callStackDiv.innerHTML = '<h4>Call Stack:</h4>';
    outputDiv.innerHTML = '<h4>Return Values:</h4>';
    
    const steps = [
        { call: 'sum_digits(12345)', return: '5 + sum_digits(1234)' },
        { call: 'sum_digits(1234)', return: '4 + sum_digits(123)' },
        { call: 'sum_digits(123)', return: '3 + sum_digits(12)' },
        { call: 'sum_digits(12)', return: '2 + sum_digits(1)' },
        { call: 'sum_digits(1)', return: '1' }
    ];
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            const frame = document.createElement('div');
            frame.className = 'call-frame';
            frame.textContent = step.call;
            callStackDiv.appendChild(frame);
            
            const returnVal = document.createElement('div');
            returnVal.className = 'return-value';
            returnVal.textContent = `${step.call} → ${step.return}`;
            outputDiv.appendChild(returnVal);
        }, index * 1000);
    });
}

// Visualize power function
function visualizePower() {
    const callStackDiv = document.getElementById('call-stack');
    const outputDiv = document.getElementById('output-display');
    
    callStackDiv.innerHTML = '<h4>Call Stack:</h4>';
    outputDiv.innerHTML = '<h4>Return Values:</h4>';
    
    const steps = [
        { call: 'power(2, 8)', return: '2 * power(2, 7)' },
        { call: 'power(2, 7)', return: '2 * power(2, 6)' },
        { call: 'power(2, 6)', return: '2 * power(2, 5)' },
        { call: 'power(2, 5)', return: '2 * power(2, 4)' },
        { call: 'power(2, 4)', return: '2 * power(2, 3)' },
        { call: 'power(2, 3)', return: '2 * power(2, 2)' },
        { call: 'power(2, 2)', return: '2 * power(2, 1)' },
        { call: 'power(2, 1)', return: '2 * power(2, 0)' },
        { call: 'power(2, 0)', return: '1' }
    ];
    
    steps.forEach((step, index) => {
        setTimeout(() => {
            const frame = document.createElement('div');
            frame.className = 'call-frame';
            frame.textContent = step.call;
            callStackDiv.appendChild(frame);
            
            const returnVal = document.createElement('div');
            returnVal.className = 'return-value';
            returnVal.textContent = `${step.call} → ${step.return}`;
            outputDiv.appendChild(returnVal);
        }, index * 800);
    });
}

// Visualize return statements
function visualizeReturns(code) {
    const outputDiv = document.getElementById('output-display');
    outputDiv.innerHTML = '<h4>Return Flow:</h4>';
    
    if (code.includes('outer_function')) {
        const flow = [
            'inner_function(5) → returns 10',
            'outer_function(5) → returns 20'
        ];
        
        flow.forEach((step, index) => {
            setTimeout(() => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'return-step';
                stepDiv.textContent = step;
                outputDiv.appendChild(stepDiv);
            }, index * 1000);
        });
    } else if (code.includes('check_number')) {
        const flow = [
            'check_number(7) → returns "Positive"',
            'check_number(-3) → returns "Negative"',
            'check_number(0) → returns "Zero"'
        ];
        
        flow.forEach((step, index) => {
            setTimeout(() => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'return-step';
                stepDiv.textContent = step;
                outputDiv.appendChild(stepDiv);
            }, index * 1000);
        });
    }
}

// Visualize lambda functions
function visualizeLambda(code) {
    const outputDiv = document.getElementById('output-display');
    outputDiv.innerHTML = '<h4>Lambda Evaluation:</h4>';
    
    if (code.includes('square = lambda')) {
        const evaluation = [
            'square = lambda x: x * x',
            'square(5) → 5 * 5 → 25'
        ];
        
        evaluation.forEach((step, index) => {
            setTimeout(() => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'lambda-step';
                stepDiv.textContent = step;
                outputDiv.appendChild(stepDiv);
            }, index * 1000);
        });
    } else if (code.includes('map(lambda')) {
        const evaluation = [
            'numbers = [1, 2, 3, 4, 5]',
            'lambda x: x**2 applied to each element',
            'Result: [1, 4, 9, 16, 25]'
        ];
        
        evaluation.forEach((step, index) => {
            setTimeout(() => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'lambda-step';
                stepDiv.textContent = step;
                outputDiv.appendChild(stepDiv);
            }, index * 1000);
        });
    }
}

// Visualize variable scope
function visualizeScope(code) {
    const scopeDiv = document.getElementById('scope-visualizer');
    scopeDiv.innerHTML = '<h4>Variable Scopes:</h4>';
    
    const globalBox = document.createElement('div');
    globalBox.className = 'scope-box global';
    globalBox.innerHTML = '<strong>Global Scope:</strong><br>global_var = "I\'m global"';
    
    const localBox = document.createElement('div');
    localBox.className = 'scope-box local';
    localBox.innerHTML = '<strong>Local Scope (test_scope):</strong><br>local_var = "I\'m local"';
    
    scopeDiv.appendChild(globalBox);
    scopeDiv.appendChild(localBox);
}

// Clear visualizer
function clearVisualizer() {
    document.getElementById('call-stack').innerHTML = '';
    document.getElementById('output-display').innerHTML = '';
    document.getElementById('scope-visualizer').innerHTML = '';
}

// Append text to console
function appendToConsole(text) {
    const console = document.getElementById('console-output');
    console.innerHTML += text;
    console.scrollTop = console.scrollHeight;
}

// Clear console
function clearConsole() {
    document.getElementById('console-output').innerHTML = '';
}

// Add some CSS for new elements
const style = document.createElement('style');
style.textContent = `
    .return-value, .return-step, .lambda-step {
        background: #e2e8f0;
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 6px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8rem;
        animation: slideIn 0.3s ease-out;
    }
    
    .return-value {
        border-left: 4px solid #48bb78;
    }
    
    .return-step {
        border-left: 4px solid #667eea;
    }
    
    .lambda-step {
        border-left: 4px solid #ed8936;
    }
`;
document.head.appendChild(style); 