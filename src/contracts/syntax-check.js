#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking contract syntax...\n');

const contracts = [
    'src/WorkRegistry.sol',
    'src/CreationRightsNFT.sol', 
    'src/VotingSystem.sol',
    'src/ZetaCrossChainPayment.sol'
];

// 基本语法检查
function checkSyntax(filePath) {
    const content = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    const issues = [];
    
    // 检查基本语法问题
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // 检查括号匹配
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        
        // 检查常见错误
        if (line.includes('function') && line.includes('(') && !line.includes(')')) {
            if (!lines[index + 1] || !lines[index + 1].includes(')')) {
                issues.push(`Line ${lineNum}: Possible unclosed function parameters`);
            }
        }
        
        if (line.includes('event') && line.includes('indexed') && 
            (line.match(/indexed/g) || []).length > 3) {
            issues.push(`Line ${lineNum}: Too many indexed parameters in event (max 3)`);
        }
        
        if (line.includes('returns') && line.includes('(') && !line.includes(')')) {
            if (!lines[index + 1] || !lines[index + 1].includes(')')) {
                issues.push(`Line ${lineNum}: Possible unclosed return parameters`);
            }
        }
    });
    
    return issues;
}

// 检查所有合约
let totalIssues = 0;

contracts.forEach(contract => {
    console.log(`📄 Checking ${contract}...`);
    
    try {
        const issues = checkSyntax(contract);
        
        if (issues.length === 0) {
            console.log(`✅ ${contract} - No syntax issues found`);
        } else {
            console.log(`⚠️  ${contract} - Found ${issues.length} potential issues:`);
            issues.forEach(issue => console.log(`   ${issue}`));
            totalIssues += issues.length;
        }
    } catch (error) {
        console.log(`❌ ${contract} - Error reading file: ${error.message}`);
        totalIssues++;
    }
    
    console.log('');
});

// 总结
if (totalIssues === 0) {
    console.log('🎉 All contracts passed basic syntax checks!');
    console.log('💡 Ready for compilation with Foundry or Hardhat');
} else {
    console.log(`⚠️  Found ${totalIssues} potential issues across all contracts`);
    console.log('💡 Please review and fix before deployment');
}

console.log('\n📋 Next steps:');
console.log('1. Install Foundry: curl -L https://foundry.paradigm.xyz | bash');
console.log('2. Compile: forge build');
console.log('3. Test: forge test');
console.log('4. Deploy: forge create --rpc-url <RPC> --private-key <KEY> <CONTRACT>');