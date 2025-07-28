#!/bin/bash

# Add base field to all task type files (issues, plans, bugs)
for file in .shirokuma/data/{issues,plans,bugs}/*.md; do
  if [ -f "$file" ]; then
    # Check if base field already exists
    if ! grep -q "^base:" "$file"; then
      # Add base: tasks after the first ---
      sed -i '1 a\base: tasks' "$file"
      echo "Added base: tasks to $file"
    fi
  fi
done

# Add base field to all document type files (docs, knowledge, recipe, tutorial)
for file in .shirokuma/data/{docs,knowledge,recipe,tutorial}/*.md; do
  if [ -f "$file" ]; then
    # Check if base field already exists
    if ! grep -q "^base:" "$file"; then
      # Add base: documents after the first ---
      sed -i '1 a\base: documents' "$file"
      echo "Added base: documents to $file"
    fi
  fi
done

echo "Completed adding base fields"