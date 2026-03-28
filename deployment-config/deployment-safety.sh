#!/bin/bash
# DEPLOYMENT SAFETY CHECK - Prevent conflicts when pushing from local
echo "🔍 DEPLOYMENT SAFETY CHECK"
echo "========================="

check_repo() {
    local repo_path=$1
    local repo_name=$2
    
    if [ ! -d "$repo_path" ]; then
        echo "❌ Repository not found: $repo_name"
        return 1
    fi
    
    cd "$repo_path"
    echo "📂 Checking: $repo_name"
    
    # Check uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️  Uncommitted changes in $repo_name:"
        git status --porcelain
        return 1
    fi
    
    # Check unpushed commits
    if [ -n "$(git log --oneline origin/main..HEAD 2>/dev/null)" ]; then
        echo "📤 Unpushed commits in $repo_name:"
        git log --oneline origin/main..HEAD
        return 1
    fi
    
    echo "✅ $repo_name is clean"
    return 0
}

ISSUES=0

# Check repositories
check_repo "/etc/dokploy/applications/simpelssaza-simpelsfrontend-0bhef9/code" "SIMPELS Frontend" || ((ISSUES++))
check_repo "/etc/dokploy/applications/simpelssaza-appsimpels-xzwnps/code" "SIMPELS Mobile" || ((ISSUES++))
check_repo "/etc/dokploy/compose/epos-saza-epos-saza-v7ri6t/code" "EPOS" || ((ISSUES++))

# Check EPOS connectivity
echo "🌐 Checking EPOS..."
if curl -f -s -I https://epos-simpels.saza.sch.id >/dev/null 2>&1; then
    echo "✅ EPOS accessible"
else
    echo "❌ EPOS not accessible"
    ((ISSUES++))
fi

echo "========================="
if [ $ISSUES -eq 0 ]; then
    echo "🎉 DEPLOYMENT READY! Safe to push from local."
    exit 0
else
    echo "⚠️  $ISSUES issues found. Fix before pushing from local!"
    exit 1
fi
