#!/bin/bash

# Script to update import paths to use absolute imports
# This is a basic example - you may need to adjust based on your specific needs

echo "Updating import paths to use absolute imports..."

# Update common import patterns
find src -name "*.ts" -type f | while read file; do
    echo "Processing $file..."
    
    # Replace relative imports with absolute imports
    sed -i '' 's|from "../utils/|from "@/utils/|g' "$file"
    sed -i '' 's|from "../constants/|from "@/constants/|g' "$file" 
    sed -i '' 's|from "../models/|from "@/models/|g' "$file"
    sed -i '' 's|from "../services/|from "@/services/|g' "$file"
    sed -i '' 's|from "../middleware/|from "@/middleware/|g' "$file"
    sed -i '' 's|from "../controllers/|from "@/controllers/|g' "$file"
    sed -i '' 's|from "../config/|from "@/config/|g' "$file"
    sed -i '' 's|from "../routes/|from "@/routes/|g' "$file"
    
    # Handle deeper nested paths
    sed -i '' 's|from "../../utils/|from "@/utils/|g' "$file"
    sed -i '' 's|from "../../constants/|from "@/constants/|g' "$file"
    sed -i '' 's|from "../../models/|from "@/models/|g' "$file"
    sed -i '' 's|from "../../services/|from "@/services/|g' "$file"
    sed -i '' 's|from "../../middleware/|from "@/middleware/|g' "$file"
    sed -i '' 's|from "../../controllers/|from "@/controllers/|g' "$file"
    sed -i '' 's|from "../../config/|from "@/config/|g' "$file"
    
    # Even deeper nested paths  
    sed -i '' 's|from "../../../utils/|from "@/utils/|g' "$file"
    sed -i '' 's|from "../../../constants/|from "@/constants/|g' "$file"
    sed -i '' 's|from "../../../models/|from "@/models/|g' "$file"
done

echo "Import path updates completed!"
echo "Please review the changes and test your application."
