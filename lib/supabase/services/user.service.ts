import { supabase } from '../client';
import type { User } from '../client';

/**
 * 用户服务 - 处理所有用户相关的数据库操作
 */

/**
 * 根据钱包地址查询用户
 */
export async function getUserByWallet(walletAddress: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 用户不存在
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user by wallet:', error);
    throw error;
  }
}

/**
 * 根据平台 ID 查询用户
 */
export async function getUserById(platformId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('platform_id', platformId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

/**
 * 创建新用户
 */
export async function createUser(userData: {
  walletAddress: string;
  name: string;
  bio?: string;
  skills?: string[];
  avatarUrl?: string;
}): Promise<User> {
  try {
    // 生成平台 ID (格式: WW-随机6位数字)
    const platformId = `WW-${Math.floor(100000 + Math.random() * 900000)}`;

    const { data, error } = await supabase
      .from('users')
      .insert({
        wallet_address: userData.walletAddress.toLowerCase(),
        platform_id: platformId,
        name: userData.name,
        bio: userData.bio || null,
        skills: userData.skills || null,
        avatar_url: userData.avatarUrl || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(
  walletAddress: string,
  updates: Partial<Omit<User, 'id' | 'wallet_address' | 'platform_id' | 'created_at'>>
): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('wallet_address', walletAddress.toLowerCase())
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

/**
 * 检查用户是否存在
 */
export async function userExists(walletAddress: string): Promise<boolean> {
  const user = await getUserByWallet(walletAddress);
  return user !== null;
}
