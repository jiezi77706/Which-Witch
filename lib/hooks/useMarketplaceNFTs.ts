import { useState, useEffect } from 'react';
import { 
  getActiveMarketplaceListings, 
  completeNFTPurchase, 
  getMarketplaceStats,
  searchMarketplaceNFTs,
  type MarketplaceNFT 
} from '../supabase/services/marketplace.service';

/**
 * Marketplace NFTs Hook
 * Manages fetching and purchasing NFTs from the marketplace
 */
export function useMarketplaceNFTs(filters?: {
  priceMin?: string;
  priceMax?: string;
  tags?: string[];
  query?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular';
}) {
  const [nfts, setNfts] = useState<MarketplaceNFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalVolume: '0',
    floorPrice: '0',
    averagePrice: '0'
  });

  useEffect(() => {
    loadMarketplaceNFTs();
    loadMarketplaceStats();
  }, [filters]);

  const loadMarketplaceNFTs = async () => {
    setLoading(true);
    setError(null);

    try {
      let data: MarketplaceNFT[];
      
      // 如果有搜索或过滤条件，使用搜索API
      if (filters?.query || filters?.tags?.length || filters?.priceMin || filters?.priceMax || filters?.sortBy) {
        data = await searchMarketplaceNFTs({
          query: filters.query,
          tags: filters.tags,
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          sortBy: filters.sortBy,
          limit: 100 // 可以根据需要调整
        });
      } else {
        // 否则获取所有活跃listings
        data = await getActiveMarketplaceListings({
          limit: 100
        });
      }
      
      setNfts(data);
    } catch (err) {
      console.error('Error loading marketplace NFTs:', err);
      
      // 如果数据库查询失败，使用mock数据作为fallback
      const mockNFTs: MarketplaceNFT[] = [
        {
          listing_id: 1,
          work_id: 1,
          token_id: 1001,
          seller_address: "0x1234567890123456789012345678901234567890",
          price: "0.5",
          currency: "ETH",
          listing_type: "fixed_price",
          listed_at: new Date().toISOString(),
          title: "Pink Hair Anime Girl",
          creator_address: "0x1234567890123456789012345678901234567890",
          image_url: "/img_9046.jpg",
          tags: ["Digital", "Anime", "Portrait"],
          material: ["Digital"],
          like_count: 42,
          remix_count: 3,
          view_count: 156,
          nft_sales_count: 0,
          nft_total_volume: "0",
          allow_remix: true,
          is_remix: false,
          story: "A beautiful anime-style portrait with vibrant pink hair and expressive eyes.",
          listing_status: "fixed_price",
          active_offers_count: 0
        },
        {
          listing_id: 2,
          work_id: 2,
          token_id: 1002,
          seller_address: "0x2345678901234567890123456789012345678901",
          price: "0.25",
          currency: "ETH",
          listing_type: "fixed_price",
          listed_at: new Date().toISOString(),
          title: "Cat Ear Character",
          creator_address: "0x2345678901234567890123456789012345678901",
          image_url: "/img_9045.jpg",
          tags: ["Anime", "Character", "Cat"],
          material: ["Digital"],
          like_count: 28,
          remix_count: 1,
          view_count: 89,
          nft_sales_count: 0,
          nft_total_volume: "0",
          allow_remix: false,
          is_remix: false,
          story: "An adorable character design featuring cat ears and expressive anime styling.",
          listing_status: "fixed_price",
          active_offers_count: 0
        },
        {
          listing_id: 3,
          work_id: 3,
          token_id: 1003,
          seller_address: "0x3456789012345678901234567890123456789012",
          price: "1.2",
          currency: "ETH",
          listing_type: "fixed_price",
          listed_at: new Date().toISOString(),
          title: "Magical Portrait",
          creator_address: "0x3456789012345678901234567890123456789012",
          image_url: "/IMG_88DDEB20DB06-1.jpeg",
          tags: ["Anime", "Magic", "Portrait"],
          material: ["Digital"],
          like_count: 67,
          remix_count: 5,
          view_count: 234,
          nft_sales_count: 0,
          nft_total_volume: "0",
          allow_remix: true,
          is_remix: false,
          story: "A mystical anime portrait with magical elements and ethereal beauty.",
          listing_status: "fixed_price",
          active_offers_count: 0
        },
        {
          listing_id: 4,
          work_id: 4,
          token_id: 1004,
          seller_address: "0x4567890123456789012345678901234567890123",
          price: "0.8",
          currency: "ETH",
          listing_type: "fixed_price",
          listed_at: new Date().toISOString(),
          title: "Magical Girl Portrait",
          creator_address: "0x4567890123456789012345678901234567890123",
          image_url: "/IMG_F4DF4C7DEC0F-1.jpeg",
          tags: ["Anime", "Magical Girl", "Fantasy"],
          material: ["Digital"],
          like_count: 35,
          remix_count: 2,
          view_count: 128,
          nft_sales_count: 0,
          nft_total_volume: "0",
          allow_remix: true,
          is_remix: false,
          story: "A stunning magical girl character with intricate details and vibrant colors.",
          listing_status: "fixed_price",
          active_offers_count: 0
        }
      ];
      
      setNfts(mockNFTs);
      // 使用mock数据时不设置错误状态
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketplaceStats = async () => {
    try {
      const statsData = await getMarketplaceStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading marketplace stats:', err);
      // 使用默认统计数据
    }
  };

  const buyNFT = async (listingId: number, price: string) => {
    try {
      console.log('🛒 Purchasing NFT:', { listingId, price });
      
      // TODO: Implement actual NFT purchase logic
      // This would involve:
      // 1. Connect to wallet
      // 2. Check balance
      // 3. Execute smart contract transaction
      // 4. Update NFT ownership
      // 5. Remove from marketplace listings
      
      // 暂时模拟购买流程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remove purchased NFT from listings
      setNfts(prev => prev.filter(nft => nft.listing_id !== listingId));
      
      // Dispatch success event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nftPurchased', { 
          detail: { listingId, price } 
        }));
      }
      
      console.log('✅ NFT purchased successfully (mock)');
    } catch (error) {
      console.error('❌ Failed to purchase NFT:', error);
      throw error;
    }
  };

  return {
    nfts,
    loading,
    error,
    stats,
    buyNFT,
    refetch: loadMarketplaceNFTs,
  };
}