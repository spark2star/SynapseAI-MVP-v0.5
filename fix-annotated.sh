#!/bin/bash
# Script to fix Annotated[Session, Depends(get_db)] across all endpoint files

echo "🔧 Fixing Annotated dependencies in endpoint files..."

# Files to fix
FILES=(
    "backend/app/api/api_v1/endpoints/profile.py"
    "backend/app/api/api_v1/endpoints/intake.py"
    "backend/app/api/api_v1/endpoints/users.py"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $file"
        continue
    fi
    
    echo "📝 Fixing $file..."
    
    # Replace Annotated forms with simple forms
    sed -i '' 's/db: Annotated\[Session, Depends(get_db)\]/db: Session = Depends(get_db)/g' "$file"
    sed -i '' 's/current_user_id: Annotated\[str, Depends(get_current_user_id)\]/current_user_id: str = Depends(get_current_user_id)/g' "$file"
    sed -i '' 's/current_user: Annotated\[User, Depends(get_current_user)\]/current_user: User = Depends(get_current_user)/g' "$file"
    
    # Remove trailing comma if it's the last parameter
    sed -i '' 's/= Depends(get_db),$/= Depends(get_db)/g' "$file"
    sed -i '' 's/= Depends(get_current_user_id),$/= Depends(get_current_user_id)/g' "$file"
    sed -i '' 's/= Depends(get_current_user),$/= Depends(get_current_user)/g' "$file"
    
    echo "✅ Fixed $file"
done

echo "🎉 All files fixed!"
