/**
 * 作品授权声明书生成服务
 */

// 许可证类型信息接口
export interface LicenseTypeInfo {
  code: string;
  name: string;
  description: string;
  allowCommercial: boolean;
  allowDerivatives: boolean;
  allowNFT: boolean;
  requireShareAlike: boolean;
}

// 预定义的许可证类型
export const LICENSE_TYPES: Record<string, LicenseTypeInfo> = {
  'CC_BY': {
    code: 'CC BY',
    name: 'CC BY - Attribution',
    description: '允许商业使用、二次创作和NFT铸造，只需署名。',
    allowCommercial: true,
    allowDerivatives: true,
    allowNFT: true,
    requireShareAlike: false,
  },
  'CC_BY_NC': {
    code: 'CC BY-NC',
    name: 'CC BY-NC - Non-Commercial',
    description: '允许非商业使用和二次创作，禁止商业使用和NFT铸造。',
    allowCommercial: false,
    allowDerivatives: true,
    allowNFT: false,
    requireShareAlike: false,
  },
  'CC_BY_NC_SA': {
    code: 'CC BY-NC-SA',
    name: 'CC BY-NC-SA - ShareAlike',
    description: '允许非商业使用和二次创作，衍生作品必须采用相同授权。',
    allowCommercial: false,
    allowDerivatives: true,
    allowNFT: false,
    requireShareAlike: true,
  },
  'CC_BY_SA': {
    code: 'CC BY-SA',
    name: 'CC BY-SA - ShareAlike',
    description: '允许商业使用、二次创作和NFT铸造，衍生作品必须采用相同授权。',
    allowCommercial: true,
    allowDerivatives: true,
    allowNFT: true,
    requireShareAlike: true,
  },
  'CC_BY_ND': {
    code: 'CC BY-ND',
    name: 'CC BY-ND - No Derivatives',
    description: '允许商业使用，但禁止二次创作和NFT铸造。',
    allowCommercial: true,
    allowDerivatives: false,
    allowNFT: false,
    requireShareAlike: false,
  },
  'CC_BY_NC_ND': {
    code: 'CC BY-NC-ND',
    name: 'CC BY-NC-ND - Most Restrictive',
    description: '仅允许非商业使用，禁止二次创作和NFT铸造。',
    allowCommercial: false,
    allowDerivatives: false,
    allowNFT: false,
    requireShareAlike: false,
  },
  'ALL_RIGHTS_RESERVED': {
    code: '保留全部权利',
    name: 'All Rights Reserved',
    description: '保留全部权利，严格控制作品使用，需要明确授权。',
    allowCommercial: false,
    allowDerivatives: false,
    allowNFT: false,
    requireShareAlike: false,
  },
};

export interface LicenseDeclarationData {
  workId: string;
  workTitle: string;
  workType: string;
  authorName: string;
  walletAddress: string;
  licenseSelection: LicenseSelection; // 使用现有的许可证选择数据
  createdAt: Date;
  contentHash?: string; // IPFS CID
}

// 从现有的license-selector-modal导入类型
export interface LicenseSelection {
  commercial: string; // A1, A2, A3
  derivative: string; // B1, B2
  nft: string; // C1, C2
  shareAlike: string; // D1, D2
  licenseCode: string;
  licenseName: string;
  description: string;
}

/**
 * 生成作品授权声明书内容
 */
export function generateLicenseDeclaration(data: LicenseDeclarationData): string {
  const license = data.licenseSelection;
  
  // 解析许可证权限
  const allowCommercial = license.commercial === 'A1';
  const allowDerivatives = license.derivative === 'B1';
  const allowNFT = license.nft === 'C1';
  const requireShareAlike = license.shareAlike === 'D1';
  
  const declaration = `
# 作品授权声明 (Author's License Declaration)

本作品（名称：**${data.workTitle}**，类型：**${data.workType}**）由作者 **${data.authorName}** (${data.walletAddress}) 原创完成，其著作权及相关人格权依法归作者本人所有。

本声明系作者对本作品之使用权限所作出的单方授权说明，不构成任何形式的版权转让或权利让渡，亦不视为对任何具体使用行为的背书或认可。

## 授权范围

作者基于自身意愿，就他人使用本作品的权限范围作出如下授权选择：

**本作品采用 ${license.licenseCode} 授权。**

**授权名称：** ${license.licenseName}  
**授权描述：** ${license.description}

### 具体权限说明

**商业使用权限：**
${allowCommercial 
  ? '✅ **允许商业使用** - 他人可将本作品用于商业目的，包括但不限于销售、营销、广告等商业活动。' 
  : '❌ **禁止商业使用** - 本作品仅限非商业用途使用，任何商业性质的使用均需获得作者明确的书面授权。'
}

**衍生作品权限：**
${allowDerivatives 
  ? '✅ **允许创作衍生作品** - 他人可基于本作品进行改编、演绎、混合等创作活动，创作衍生作品。' 
  : '❌ **禁止创作衍生作品** - 本作品不允许任何形式的改编、演绎或衍生创作，仅可按原样使用。'
}

**NFT铸造权限：**
${allowNFT 
  ? '✅ **允许NFT铸造** - 在遵守其他授权条款的前提下，允许将本作品铸造为NFT。' 
  : '❌ **禁止NFT铸造** - 严格禁止将本作品铸造为NFT或任何形式的数字资产代币。'
}

**相同授权要求：**
${requireShareAlike 
  ? '⚠️ **要求相同授权** - 基于本作品创作的衍生作品必须采用与本作品相同的授权条款。' 
  : '✅ **无相同授权要求** - 衍生作品可采用不同的授权条款。'
}

## 统一禁止条款

无论本作品采用何种授权类型，作者在此明确声明并统一禁止以下行为：

### 1. 禁止用于人工智能训练
明确禁止将本作品用于任何形式的人工智能、机器学习、深度学习模型的训练、微调、测试或验证，包括但不限于大语言模型(LLM)、图像生成模型、多模态模型等。此禁止适用于商业与非商业用途，且不因数据集的公开性质或研究目的而例外。

### 2. 禁止性别歧视与仇恨行为
- 任何形式的对女性或女性群体的诋毁、污名化、物化、贬损或歧视
- 任何基于性别、性取向、身份、身体特征的仇恨言论、骚扰、暴力或压迫性表达
- 将本作品用于支持、传播或合理化性别不平等、剥削或人权侵害的行为

### 3. 禁止二次NFT行为
明确禁止对本作品或同一项目进行任何形式的二次NFT行为，包括但不限于未经授权将作品或其衍生内容上链、铸造、发行、拆分、再包装为可交易的数字资产，或将其用于投机性、误导性或欺诈性的Web3项目。

### 4. 禁止恶意使用
任何恶意歪曲作品原意、断章取义、制造虚假叙事、损害作者声誉或人格权益，或将作品用于违法、侵权、极端主义、仇恨动员、色情剥削（尤其涉及未成年人）的行为。

## 署名要求

如本授权类型要求署名，使用者应以清晰、合理且不具误导性的方式标注作者署名、作品来源，并注明本授权声明或其对应链接。署名方式不得暗示作者对使用者或其行为的认可、合作或背书。

**标准署名格式：**
\`\`\`
作品：${data.workTitle}
作者：${data.authorName}
授权：${license.licenseCode}
声明：[链接到本声明书]
\`\`\`

## 区块链证明

本授权声明在发布时生成唯一的内容指纹(CID)，并记录于区块链账本中，作为本声明内容、发布时间及作者身份关联关系的不可篡改证明。

该链上记录构成"账本权威"，用于证明事实发生的时间与内容一致性；在发生争议时，本声明文本及其对应的链上记录可作为电子证据提交至司法或仲裁机构，并依法接受审查与采信，构成"法律权威"意义上的证据材料。

## 法律责任

任何个人或组织如超出本授权范围使用本作品，或违反本声明中所列明的禁止性条款，作者有权依法要求其立即停止侵权行为、删除或下架相关内容，并保留追究其民事、行政乃至刑事法律责任的权利，包括但不限于主张由此造成的经济损失及精神损害赔偿。

除本声明中明确授予的权利外，作者保留对本作品的一切其他合法权利。

---

**声明生成时间：** ${data.createdAt.toLocaleString('zh-CN')}  
**作品ID：** ${data.workId}  
**许可证代码：** ${license.licenseCode}  
**内容哈希：** ${data.contentHash || '待生成'}  
**区块链记录：** [查看链上证明](#)

*本声明由 WhichWitch 平台自动生成，具有法律效力。*
`.trim();

  return declaration;
}

/**
 * 生成声明书的简短摘要（用于作品卡片显示）
 */
export function generateLicenseSummary(licenseSelection: LicenseSelection): string {
  const permissions = [];
  
  if (licenseSelection.commercial === 'A1') permissions.push('商用');
  if (licenseSelection.derivative === 'B1') permissions.push('二创');
  if (licenseSelection.nft === 'C1') permissions.push('NFT');
  if (licenseSelection.shareAlike === 'D1') permissions.push('相同授权');
  
  return permissions.length > 0 
    ? `${licenseSelection.licenseCode} (允许: ${permissions.join('、')})`
    : `${licenseSelection.licenseCode} (限制使用)`;
}

/**
 * 验证许可证选择是否有效
 */
export function isValidLicenseSelection(licenseSelection: any): licenseSelection is LicenseSelection {
  return licenseSelection && 
         typeof licenseSelection.commercial === 'string' &&
         typeof licenseSelection.derivative === 'string' &&
         typeof licenseSelection.nft === 'string' &&
         typeof licenseSelection.shareAlike === 'string' &&
         typeof licenseSelection.licenseCode === 'string' &&
         typeof licenseSelection.licenseName === 'string';
}