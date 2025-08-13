#!/bin/bash

echo "🔍 检查.gitignore配置..."

# 检查关键目录的.gitkeep文件
echo "📁 检查.gitkeep文件..."
check_gitkeep() {
    if [ -f "$1/.gitkeep" ]; then
        echo "✅ $1/.gitkeep 存在"
    else
        echo "❌ 缺少 $1/.gitkeep"
    fi
}

check_gitkeep "coverage"
check_gitkeep "quality-reports"
check_gitkeep "playwright-report"
check_gitkeep "playwright-test-logs"
check_gitkeep "test-results"

# 检查是否有应该被忽略的文件被跟踪
echo ""
echo "🔍 检查被跟踪的文件..."
tracked_files=$(git ls-files | grep -E "(coverage/.*\.(md|json|html)$|quality-reports/.*\.json$|\.tmp$|\.temp$|\.cache/)" || true)

if [ -n "$tracked_files" ]; then
    echo "⚠️ 发现应该被忽略但被跟踪的文件:"
    echo "$tracked_files"
else
    echo "✅ 没有发现应该被忽略但被跟踪的文件"
fi

# 检查未跟踪的文件
echo ""
echo "📋 检查未跟踪的文件..."
untracked_files=$(git status --porcelain | grep "^??" | cut -c4- | grep -E "(coverage/|quality-reports/)" || true)

if [ -n "$untracked_files" ]; then
    echo "ℹ️ 发现未跟踪的报告文件（这是正常的）:"
    echo "$untracked_files"
else
    echo "✅ 没有未跟踪的报告文件"
fi

# 检查.gitignore文件中的关键配置
echo ""
echo "⚙️ 检查.gitignore配置..."
check_gitignore_rule() {
    if grep -q "$1" .gitignore; then
        echo "✅ 包含规则: $1"
    else
        echo "❌ 缺少规则: $1"
    fi
}

check_gitignore_rule "/coverage/\*"
check_gitignore_rule "/quality-reports/\*"
check_gitignore_rule "/node_modules"
check_gitignore_rule "/.next/"
check_gitignore_rule "/out/"

echo ""
echo "🎯 .gitignore检查完成!"

# 计算配置完整性得分
total_checks=10
passed_checks=0

[ -f "coverage/.gitkeep" ] && ((passed_checks++))
[ -f "quality-reports/.gitkeep" ] && ((passed_checks++))
[ -f "playwright-report/.gitkeep" ] && ((passed_checks++))
[ -f "playwright-test-logs/.gitkeep" ] && ((passed_checks++))
[ -f "test-results/.gitkeep" ] && ((passed_checks++))

grep -q "/coverage/\*" .gitignore && ((passed_checks++))
grep -q "/quality-reports/\*" .gitignore && ((passed_checks++))
grep -q "/node_modules" .gitignore && ((passed_checks++))
grep -q "/.next/" .gitignore && ((passed_checks++))
grep -q "/out/" .gitignore && ((passed_checks++))

score=$((passed_checks * 100 / total_checks))
echo "📊 配置完整性得分: $score/100"

if [ $score -ge 90 ]; then
    echo "🏆 优秀! .gitignore配置非常完善"
elif [ $score -ge 80 ]; then
    echo "👍 良好! .gitignore配置基本完善"
elif [ $score -ge 70 ]; then
    echo "⚠️ 一般! .gitignore配置需要改进"
else
    echo "❌ 较差! .gitignore配置需要大幅改进"
fi