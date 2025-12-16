/**
 * 点赞服务
 */

/**
 * 切换点赞状态
 */
export async function toggleLike(workId: number, userAddress: string): Promise<boolean> {
  try {
    const response = await fetch('/api/works/like', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workId, userAddress }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle like');
    }

    const data = await response.json();
    return data.liked;
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
}

/**
 * 获取用户对多个作品的点赞状态
 */
export async function getUserLikes(userAddress: string, workIds: number[]): Promise<Set<number>> {
  try {
    const response = await fetch('/api/works/likes/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userAddress, workIds }),
    });

    if (!response.ok) {
      throw new Error('Failed to get user likes');
    }

    const data = await response.json();
    return new Set(data.likedWorkIds);
  } catch (error) {
    console.error('Error getting user likes:', error);
    return new Set();
  }
}
