/**
 * 作品授权声明书生成服务
 */

export interface LicenseDeclarationData {
  workId: string;
  workTitle: string;
  workType: string;
  authorName: string;
  walletAddress: string;
  licenseType: string;
  createdAt: Date;
  contentHash?: string; // IPFS CID
}

export interface LicenseTypeInfo {
  code: string;
  name: string;
  description: string;
  allowCommercial: boolean;
  allowDerivatives: boolean;
  requireShareAlike: boolean;
}

// 支持的授权类型
export const LICENSE_TYPES: Record<string, LicenseTypeInfo> = {
  'CC_BY': {
    code: 'CC BY',
    name: 'Creative Commons Attribution 4.0',
    description: '允许他人分发、混合、调整和基于您的作品进行创作，甚至是商业性使用，只要他们注明您的姓名。',
    allowCommercial: true,
    allowDerivatives: true,
    requireShareAlike: false
  },
  'CC_BY_NC': {
    code: 'CC BY-NC',
    name: 'Creative Commons Attribution-NonCommercial 4.0',
    description: '允许他人下载、分享和基于您的作品进行创作，但不能用于商业目的，且必须注明您的姓名。',
    allowCommercial: false,
    allowDerivatives: true,
    requireShareAlike: false
  },
  'CC_BY_NC_SA': {
    code: 'CC BY-NC-SA',
    name: 'Creative Commons Attribution-NonCommercial-ShareAlike 4.0',
    description: '允许他人下载、分享和基于您的作品进行创作，但不能用于商业目的，必须注明您的姓名，且新作品需采用相同授权。',
    allowCommercial: false,
    allowDerivatives: true,
    requireShareAlike: true
  },
  'CC_BY_SA': {
    code: 'CC BY-SA',
    name: 'Creative Commons Attribution-ShareAlike 4.0',
    description: '允许他人分发、混合、调整和基于您的作品进行创作，甚至是商业性使用，但新作品需采用相同授权，且必须注明您的姓名。',
    allowCommercial: true,
    allowDerivatives: true,
    requireShareAlike: true
  },
  'CUSTOM': {
    code: '自定义授权',
    name: '自定义授权条款',
    description: '作者自定义的特殊授权条款，具体权限以声明书内容为准。',
    allowCommercial: false,
    allowDerivatives: false,
    requireShareAlike: false
  },
  'ALL_RIGHTS_RESERVED': {
    code: '保留全部权利',
    name: '保留全部权利',
    description: '作者保留对作品的全部权利，未经明确授权不得使用。',
    allowCommercial: false,
    allowDerivatives: false,
    requireShareAlike: false
  }
};

/**
 * 生成作品授权声明书内容
 */
export function generateLicenseDeclaration(data: LicenseDeclarationData): string {
  const licenseInfo = LICENSE_TYPES[data.licenseType] || LICENSE_TYPES['ALL_RIGHTS_RESERVED'];
  
  const declaration = `
# 作品授权声明 (Author's License Declaration)

本作品（名称：**${data.workTitle}**，类型：**${data.workType}**）由作者 **${data.authorName}** (${data.walletAddress}) 原创完成，其著作权及相关人格权依法归作者本人所有。

本声明系作者对本作品之使用权限所作出的单方授权说明，不构成任何形式的版权转让或权利让渡，亦不视为对任何具体使用行为的背书或认可。

## 授权范围

作者基于自身意愿，就他人使用本作品的权限范围作出如下授权选择：

**本作品采用 ${licenseInfo.code} 授权。**

${licenseInfo.description}

依该授权，他人是否可以对本作品进行商业使用、是否可以进行二次创作（包括但不限于改编、演绎、同人创作）、以及衍生作品是否需保持相同授权方式，均以本授权类型及其对应条款为准。

除明确允许的情形外，任何超出授权范围的使用行为，均不被许可并构成侵权。

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

## 区块链证明

本授权声明在发布时生成唯一的内容指纹(CID)，并记录于区块链账本中，作为本声明内容、发布时间及作者身份关联关系的不可篡改证明。

该链上记录构成"账本权威"，用于证明事实发生的时间与内容一致性；在发生争议时，本声明文本及其对应的链上记录可作为电子证据提交至司法或仲裁机构，并依法接受审查与采信，构成"法律权威"意义上的证据材料。

## 法律责任

任何个人或组织如超出本授权范围使用本作品，或违反本声明中所列明的禁止性条款，作者有权依法要求其立即停止侵权行为、删除或下架相关内容，并保留追究其民事、行政乃至刑事法律责任的权利，包括但不限于主张由此造成的经济损失及精神损害赔偿。

除本声明中明确授予的权利外，作者保留对本作品的一切其他合法权利。

---

**声明生成时间：** ${data.createdAt.toLocaleString('zh-CN')}  
**作品ID：** ${data.workId}  
**内容哈希：** ${data.contentHash || '待生成'}  
**区块链记录：** [查看链上证明](#)

*本声明由 WhichWitch 平台自动生成，具有法律效力。*
`.trim();

  return declaration;
}

/**
 * 生成声明书的简短摘要（用于作品卡片显示）
 */
export function generateLicenseSummary(licenseType: string): string {
  const licenseInfo = LICENSE_TYPES[licenseType] || LICENSE_TYPES['ALL_RIGHTS_RESERVED'];
  
  const permissions = [];
  if (licenseInfo.allowCommercial) permissions.push('商用');
  if (licenseInfo.allowDerivatives) permissions.push('二创');
  if (licenseInfo.requireShareAlike) permissions.push('相同授权');
  
  return permissions.length > 0 
    ? `${licenseInfo.code} (允许: ${permissions.join('、')})`
    : `${licenseInfo.code} (保留全部权利)`;
}

/**
 * 验证授权类型是否有效
 */
export function isValidLicenseType(licenseType: string): boolean {
  return licenseType in LICENSE_TYPES;
}