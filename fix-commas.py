#!/usr/bin/env python3
"""Fix missing commas in function parameters"""

import re

file_path = "backend/app/api/api_v1/endpoints/users.py"

with open(file_path, 'r') as f:
    content = f.read()

# Pattern: line ends with a Depends() call but no comma, followed by another parameter line
# We need to add commas when there's a parameter on the next line
lines = content.split('\n')
fixed_lines = []

for i, line in enumerate(lines):
    # Check if this line should have a comma
    if i < len(lines) - 1:  # Not the last line
        next_line = lines[i + 1]
        
        # If current line ends with a Depends() or Query() and next line starts with a parameter
        if (re.search(r'=\s*Depends\([^)]+\)\s*$', line) or 
            re.search(r'=\s*Query\([^)]+\)\s*$', line)):
            
            # Check if next line looks like a parameter (has : and =)
            if re.match(r'\s+\w+:\s*[\w\[]+.*=', next_line):
                # Add comma if not already there
                if not line.rstrip().endswith(','):
                    line = line.rstrip() + ','
    
    fixed_lines.append(line)

with open(file_path, 'w') as f:
    f.write('\n'.join(fixed_lines))

print(f"✅ Fixed all missing commas in {file_path}")
