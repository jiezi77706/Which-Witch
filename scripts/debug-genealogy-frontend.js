#!/usr/bin/env node

/**
 * 调试前端Genealogy加载问题
 * 模拟前端的完整数据获取流程
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 模拟work.service.ts中的函数
async function getWorkById(workId) {
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

async function getCategorizedDerivatives(parentWorkId) {
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

async function getWorkGenealogy(workId) {
  console.log(`🔍 开始获取作品${workId}的genealogy...`);
  
  try {
    // 首先获取当前作品信息
    const currentWork = await getWorkById(workId);
    if (!currentWork) {
      throw new Error('Work not found');
    }

    console.log(`📋 当前作品: ${currentWork.title}`);
    console.log(`   - allow_remix: ${currentWork.allow_remix}`);
    console.log(`   - creation_type: ${currentWork.creation_type}`);
    console.log(`   - parent_work_id: ${currentWork.parent_work_id}`);

    // 确定根作品：如果当前作品有父作品，获取根作品；否则当前作品就是根作品
    let rootWork = currentWork;
    if (currentWork.parent_work_id) {
      // 递归查找根作品
      let parentWork = await getWorkById(currentWork.parent_work_id);
      while (parentWork && parentWork.parent_work_id) {
        const grandParent = await getWorkById(parentWork.parent_work_id);
        if (grandParent) {
          parentWork = grandParent;
        } else {
          break;
        }
      }
      if (parentWork) {
        rootWork = parentWork;
      }
    }

    console.log(`🌳 根作品: ${rootWork.title} (ID: ${rootWork.work_id})`);

    // 获取根作品的所有直接衍生作品
    const { authorContinuations, authorizedDerivatives } = await getCategorizedDerivatives(rootWork.work_id);

    console.log(`📊 找到衍生作品:`);
    console.log(`   - Official continuations: ${authorContinuations.length}`);
    authorContinuations.forEach(work => {
      console.log(`     * ${work.title} (ID: ${work.work_id})`);
    });
    console.log(`   - Community derivatives: ${authorizedDerivatives.length}`);
    authorizedDerivatives.forEach(work => {
      console.log(`     * ${work.title} (ID: ${work.work_id})`);
    });

    // 如果当前查看的作品本身就是衍生作品，还需要获取它的衍生作品
    let allContinuations = [...authorContinuations];
    let allDerivatives = [...authorizedDerivatives];

    if (currentWork.work_id !== rootWork.work_id) {
      console.log(`🔄 当前作品是衍生作品，检查它的衍生作品...`);
      const { authorContinuations: currentContinuations, authorizedDerivatives: currentDerivatives } = 
        await getCategorizedDerivatives(currentWork.work_id);
      allContinuations = [...allContinuations, ...currentContinuations];
      allDerivatives = [...allDerivatives, ...currentDerivatives];
      
      console.log(`   - 当前作品的continuations: ${currentContinuations.length}`);
      console.log(`   - 当前作品的derivatives: ${currentDerivatives.length}`);
    }

    // 去重（以防有重复）
    const uniqueContinuations = allContinuations.filter((item, index, self) => 
      index === self.findIndex(t => t.work_id === item.work_id)
    );
    const uniqueDerivatives = allDerivatives.filter((item, index, self) => 
      index === self.findIndex(t => t.work_id === item.work_id)
    );

    // 计算总衍生数量
    const totalDerivatives = uniqueContinuations.length + uniqueDerivatives.length;

    const result = {
      root: rootWork,
      continuations: uniqueContinuations,
      derivatives: uniqueDerivatives,
      totalDerivatives
    };

    console.log(`\n✅ Genealogy结果:`);
    console.log(`   - Root: ${result.root.title}`);
    console.log(`   - Continuations: ${result.continuations.length}`);
    console.log(`   - Derivatives: ${result.derivatives.length}`);
    console.log(`   - Total: ${result.totalDerivatives}`);

    return result;
  } catch (error) {
    console.error('❌ Error fetching work genealogy:', error);
    return {
      root: null,
      continuations: [],
      derivatives: [],
      totalDerivatives: 0
    };
  }
}

// 模拟前端的genealogyDisplay构建
function buildGenealogyDisplay(work, genealogy) {
  console.log(`\n🎨 构建前端显示数据...`);
  
  if (!work?.allow_remix) {
    console.log(`❌ 作品不允许remix，不显示genealogy`);
    return null;
  }

  const genealogyDisplay = {
    root: {
      id: genealogy.root?.work_id || work.work_id || work.id,
      title: genealogy.root?.title || work.title || "Untitled",
      author: genealogy.root?.creator_address || work.creator_address || work.author || "Unknown",
      date: genealogy.root?.created_at ? new Date(genealogy.root.created_at).toLocaleDateString() : 
            (work.createdAt ? new Date(work.createdAt).toLocaleDateString() : new Date().toLocaleDateString()),
      type: "Original Work",
      image: genealogy.root?.image_url || work.images?.[0] || work.image || "/placeholder.svg",
    },
    continuations: genealogy.continuations.map((cont) => ({
      id: cont.work_id,
      title: cont.title,
      author: cont.creator_address?.slice(0, 6) + '...' + cont.creator_address?.slice(-4),
      date: new Date(cont.created_at).toLocaleDateString(),
      type: "Official Continuation",
      image: cont.image_url || "/placeholder.svg",
    })),
    derivatives: genealogy.derivatives.map((deriv) => ({
      id: deriv.work_id,
      title: deriv.title,
      author: deriv.creator_address?.slice(0, 6) + '...' + deriv.creator_address?.slice(-4),
      date: new Date(deriv.created_at).toLocaleDateString(),
      type: "Community Derivative",
      image: deriv.image_url || "/placeholder.svg",
    }))
  };

  console.log(`📱 前端显示数据:`);
  console.log(`   - Root: ${genealogyDisplay.root.title}`);
  console.log(`   - Continuations: ${genealogyDisplay.continuations.length}`);
  genealogyDisplay.continuations.forEach(item => {
    console.log(`     * ${item.title} (${item.author})`);
  });
  console.log(`   - Derivatives: ${genealogyDisplay.derivatives.length}`);
  genealogyDisplay.derivatives.forEach(item => {
    console.log(`     * ${item.title} (${item.author})`);
  });

  return genealogyDisplay;
}

async function debugWork(workId) {
  console.log(`🚀 开始调试作品${workId}的Genealogy显示问题\n`);
  
  // 1. 获取作品基本信息
  const work = await getWorkById(workId);
  if (!work) {
    console.error(`❌ 找不到作品${workId}`);
    return;
  }

  console.log(`📋 作品基本信息:`);
  console.log(`   - ID: ${work.work_id}`);
  console.log(`   - Title: ${work.title}`);
  console.log(`   - allow_remix: ${work.allow_remix}`);
  console.log(`   - creation_type: ${work.creation_type}`);
  console.log(`   - parent_work_id: ${work.parent_work_id}`);

  // 2. 检查前端加载条件
  const shouldLoadGenealogy = work.allow_remix;
  console.log(`\n🔍 前端加载条件检查:`);
  console.log(`   - work.allow_remix: ${work.allow_remix}`);
  console.log(`   - 应该加载genealogy: ${shouldLoadGenealogy}`);

  if (!shouldLoadGenealogy) {
    console.log(`❌ 不满足加载条件，genealogy不会显示`);
    return;
  }

  // 3. 获取genealogy数据
  const genealogy = await getWorkGenealogy(workId);

  // 4. 构建前端显示数据
  const genealogyDisplay = buildGenealogyDisplay(work, genealogy);

  // 5. 最终结果
  console.log(`\n🎯 最终结果:`);
  if (genealogyDisplay) {
    console.log(`✅ Genealogy应该正常显示`);
    console.log(`   - 显示${genealogyDisplay.derivatives.length}个Community Derivatives`);
    console.log(`   - 显示${genealogyDisplay.continuations.length}个Official Continuations`);
  } else {
    console.log(`❌ Genealogy不会显示`);
  }
}

// 调试作品4
debugWork(4).then(() => {
  console.log(`\n${'='.repeat(50)}\n`);
  // 也调试一下作品7，看看从衍生作品的角度是否正常
  return debugWork(7);
});