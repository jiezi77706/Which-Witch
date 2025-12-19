import { supabase } from '../client';
import type { Work } from '../client';

/**
 * 作品服务 - 处理所有作品相关的数据库操作
 */

/**
 * 获取所有作品（广场）
 * 使用 work_details 视图获取包含统计信息的作品
 */
export async function getAllWorks(limit = 100): Promise<Work[]> {
  try {
    const { data, error } = await supabase
      .from('work_details')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all works:', error);
    return [];
  }
}

/**
 * 根据作品 ID 获取作品
 */
export async function getWorkById(workId: number): Promise<Work | null> {
  try {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('work_id', workId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching work by ID:', error);
    return null;
  }
}

/**
 * 根据创作者地址获取作品
 * 使用 work_details 视图获取包含统计信息的作品
 */
export async function getWorksByCreator(creatorAddress: string): Promise<Work[]> {
  try {
    const { data, error } = await supabase
      .from('work_details')
      .select('*')
      .eq('creator_address', creatorAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching works by creator:', error);
    return [];
  }
}

/**
 * 获取某作品的直接衍生作品（旧版本，保持兼容性）
 */
export async function getDerivativeWorks(parentWorkId: number): Promise<Work[]> {
  try {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .eq('parent_work_id', parentWorkId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching derivative works:', error);
    return [];
  }
}

/**
 * 获取分类的衍生作品
 * 返回结构化的衍生作品数据，区分原作者延续和他人二创
 */
export async function getCategorizedDerivatives(parentWorkId: number): Promise<{
  authorContinuations: Work[];
  authorizedDerivatives: Work[];
}> {
  try {
    // 获取原作者延续作品
    const { data: continuations, error: continuationsError } = await supabase
      .from('works')
      .select('*')
      .eq('parent_work_id', parentWorkId)
      .eq('creation_type', 'author_continuation')
      .order('created_at', { ascending: false });

    if (continuationsError) throw continuationsError;

    // 获取授权衍生作品
    const { data: derivatives, error: derivativesError } = await supabase
      .from('works')
      .select('*')
      .eq('parent_work_id', parentWorkId)
      .eq('creation_type', 'authorized_derivative')
      .order('created_at', { ascending: false });

    if (derivativesError) throw derivativesError;

    return {
      authorContinuations: continuations || [],
      authorizedDerivatives: derivatives || []
    };
  } catch (error) {
    console.error('Error fetching categorized derivatives:', error);
    return {
      authorContinuations: [],
      authorizedDerivatives: []
    };
  }
}

/**
 * 获取作品的完整谱系信息
 * 包含层次结构和创作关系类型
 */
export async function getWorkGenealogy(workId: number): Promise<{
  root: Work | null;
  continuations: Work[];
  derivatives: Work[];
  totalDerivatives: number;
}> {
  try {
    // 首先获取当前作品信息
    const currentWork = await getWorkById(workId);
    if (!currentWork) {
      throw new Error('Work not found');
    }

    // 如果当前作品有父作品，获取根作品
    let rootWork = currentWork;
    if (currentWork.parent_work_id) {
      const parentWork = await getWorkById(currentWork.parent_work_id);
      if (parentWork) {
        rootWork = parentWork;
      }
    }

    // 获取分类的衍生作品
    const { authorContinuations, authorizedDerivatives } = await getCategorizedDerivatives(rootWork.work_id);

    // 计算总衍生数量
    const totalDerivatives = authorContinuations.length + authorizedDerivatives.length;

    return {
      root: rootWork,
      continuations: authorContinuations,
      derivatives: authorizedDerivatives,
      totalDerivatives
    };
  } catch (error) {
    console.error('Error fetching work genealogy:', error);
    return {
      root: null,
      continuations: [],
      derivatives: [],
      totalDerivatives: 0
    };
  }
}

/**
 * 根据创作类型获取作品
 */
export async function getWorksByCreationType(
  creationType: 'original' | 'author_continuation' | 'authorized_derivative' | 'unauthorized_derivative',
  limit = 100
): Promise<Work[]> {
  try {
    const { data, error } = await supabase
      .from('work_details')
      .select('*')
      .eq('creation_type', creationType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching works by creation type:', error);
    return [];
  }
}

/**
 * 创建新作品
 * 通过 API route 调用，使用服务端权限
 */
export async function createWork(workData: {
  workId: number; // 从合约获取
  creatorAddress: string;
  title: string;
  description?: string;
  story?: string;
  imageUrl: string;
  images?: string[]; // 多图片支持
  metadataUri: string;
  material?: string[];
  tags?: string[];
  allowRemix: boolean;
  licenseFee?: string;
  parentWorkId?: number;
  isRemix: boolean;
  // 许可证信息
  licenseSelection?: {
    commercial: string;
    derivative: string;
    nft: string;
    shareAlike: string;
    licenseName: string;
    description: string;
  };
}): Promise<Work> {
  try {
    const response = await fetch('/api/works/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(workData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create work');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating work:', error);
    throw error;
  }
}

/**
 * 更新作品信息
 */
export async function updateWork(
  workId: number,
  updates: Partial<Omit<Work, 'id' | 'work_id' | 'creator_address' | 'created_at'>>
): Promise<Work> {
  try {
    const { data, error } = await supabase
      .from('works')
      .update(updates)
      .eq('work_id', workId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating work:', error);
    throw error;
  }
}

/**
 * 统计作品的直接衍生数量
 */
export async function getRemixCount(workId: number): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('works')
      .select('*', { count: 'exact', head: true })
      .eq('parent_work_id', workId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting remix count:', error);
    return 0;
  }
}

/**
 * 搜索作品
 */
export async function searchWorks(query: string): Promise<Work[]> {
  try {
    const { data, error } = await supabase
      .from('works')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching works:', error);
    return [];
  }
}
