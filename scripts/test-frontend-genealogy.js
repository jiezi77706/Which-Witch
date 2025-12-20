#!/usr/bin/env node

/**
 * 测试前端Genealogy功能的完整流程
 * 模拟前端组件的所有步骤
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 导入work service函数（模拟）
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
    const { data: continuations, error: continuationsError } = await supabase
      .from('works')
      .select('*')
      .eq('parent_work_id', parentWorkId)
      .eq('creation_type', 'author_continuation')
      .order('created_at', { ascending: false });

    if (continuationsError) throw continuationsError;

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
  try {
    const currentWork = await getWorkById(workId);
    if (!currentWork) {
      throw new Error('Work not found');
    }

    let rootWork = currentWork;
    if (currentWork.parent_work_id) {
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

    const { authorContinuations, authorizedDerivatives } = await getCategorizedDerivatives(rootWork.work_id);

    let allContinuations = [...authorContinuations];
    let allDerivatives = [...authorizedDerivatives];

    if (currentWork.work_id !== rootWork.work_id) {
      const { authorContinuations: currentContinuations, authorizedDerivatives: currentDerivatives } = 
        await getCategorizedDerivatives(currentWork.work_id);
      allContinuations = [...allContinuations, ...currentContinuations];
      allDerivatives = [...allDerivatives, ...currentDerivatives];
    }

    const uniqueContinuations = allContinuations.filter((item, index, self) => 
      index === self.findIndex(t => t.work_id === item.work_id)
    );
    const uniqueDerivatives = allDerivatives.filter((item, index, self) => 
      index === self.findIndex(t => t.work_id === item.work_id)
    );

    const totalDerivatives = uniqueContinuations.length + uniqueDerivatives.length;

    return {
      root: rootWork,
      continuations: uniqueContinuations,
      derivatives: uniqueDerivatives,
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

// 模拟前端组件的完整流程
async function simulateFrontendFlow(workId) {
  console.log(`🎭 模拟前端组件处理作品${workId}的完整流程\n`);

  // 1. 获取作品数据（模拟props）
  const work = await getWorkById(workId);
  if (!work) {
    console.error(`❌ 找不到作品${workId}`);
    return;
  }

  console.log(`📋 Step 1: 获取作品数据`);
  console.log(`   - work_id: ${work.work_id}`);
  console.log(`   - title: ${work.title}`);
  console.log(`   - allow_remix: ${work.allow_remix}`);

  // 2. 检查useEffect条件
  const open = true; // 模拟modal打开
  const shouldLoad = open && work?.work_id && work?.allow_remix;
  
  console.log(`\n🔍 Step 2: 检查useEffect加载条件`);
  console.log(`   - open: ${open}`);
  console.log(`   - work?.work_id: ${work?.work_id}`);
  console.log(`   - work?.allowRemix: ${work?.allow_remix}`);
  console.log(`   - 应该加载: ${shouldLoad}`);

  if (!shouldLoad) {
    console.log(`❌ 不满足加载条件，genealogy不会加载`);
    return;
  }

  // 3. 模拟loadGenealogy函数
  console.log(`\n📡 Step 3: 执行loadGenealogy`);
  console.log(`   - 开始加载...`);
  
  const genealogyData = await getWorkGenealogy(work.work_id);
  
  console.log(`   - 加载完成`);
  console.log(`   - root: ${genealogyData.root?.title || 'null'}`);
  console.log(`   - continuations: ${genealogyData.continuations.length}`);
  console.log(`   - derivatives: ${genealogyData.derivatives.length}`);
  console.log(`   - totalDerivatives: ${genealogyData.totalDerivatives}`);

  // 4. 模拟genealogyDisplay构建
  console.log(`\n🎨 Step 4: 构建genealogyDisplay`);
  
  const genealogyDisplay = work?.allow_remix
    ? {
        root: {
          id: genealogyData.root?.work_id || work.work_id,
          title: genealogyData.root?.title || work.title || "Untitled",
          author: genealogyData.root?.creator_address || work.creator_address || "Unknown",
          date: genealogyData.root?.created_at ? new Date(genealogyData.root.created_at).toLocaleDateString() : 
                new Date().toLocaleDateString(),
          type: "Original Work",
          image: genealogyData.root?.image_url || work.image_url || "/placeholder.svg",
        },
        continuations: genealogyData.continuations.map((cont) => ({
          id: cont.work_id,
          title: cont.title,
          author: cont.creator_address?.slice(0, 6) + '...' + cont.creator_address?.slice(-4),
          date: new Date(cont.created_at).toLocaleDateString(),
          type: "Official Continuation",
          image: cont.image_url || "/placeholder.svg",
        })),
        derivatives: genealogyData.derivatives.map((deriv) => ({
          id: deriv.work_id,
          title: deriv.title,
          author: deriv.creator_address?.slice(0, 6) + '...' + deriv.creator_address?.slice(-4),
          date: new Date(deriv.created_at).toLocaleDateString(),
          type: "Community Derivative",
          image: deriv.image_url || "/placeholder.svg",
        }))
      }
    : null;

  if (genealogyDisplay) {
    console.log(`   ✅ genealogyDisplay构建成功`);
    console.log(`   - root: ${genealogyDisplay.root.title}`);
    console.log(`   - continuations: ${genealogyDisplay.continuations.length}`);
    genealogyDisplay.continuations.forEach(item => {
      console.log(`     * ${item.title} (${item.author})`);
    });
    console.log(`   - derivatives: ${genealogyDisplay.derivatives.length}`);
    genealogyDisplay.derivatives.forEach(item => {
      console.log(`     * ${item.title} (${item.author})`);
    });
  } else {
    console.log(`   ❌ genealogyDisplay为null`);
  }

  // 5. 模拟渲染条件检查
  console.log(`\n🖼️  Step 5: 检查渲染条件`);
  
  const showRemixDisabled = !work.allow_remix;
  const showLoading = false; // 模拟加载完成
  const showGenealogy = genealogyDisplay && !showLoading;
  
  console.log(`   - showRemixDisabled: ${showRemixDisabled}`);
  console.log(`   - showLoading: ${showLoading}`);
  console.log(`   - showGenealogy: ${showGenealogy}`);

  if (showRemixDisabled) {
    console.log(`   → 显示"Remixing disabled"消息`);
    return;
  }

  if (showLoading) {
    console.log(`   → 显示加载动画`);
    return;
  }

  if (showGenealogy) {
    console.log(`   → 显示Genealogy内容`);
    
    // 检查各部分的显示条件
    const showRoot = true;
    const showContinuations = genealogyDisplay.continuations.length > 0;
    const showDerivatives = genealogyDisplay.derivatives.length > 0;
    const showEmptyState = genealogyDisplay.continuations.length === 0 && genealogyDisplay.derivatives.length === 0;
    const showStatistics = genealogyData.continuations.length > 0 || genealogyData.derivatives.length > 0;
    const showRecentPreview = genealogyData.continuations.length > 0 || genealogyData.derivatives.length > 0;
    
    console.log(`\n     📊 各部分显示状态:`);
    console.log(`     - Root Work: ${showRoot ? '✅' : '❌'}`);
    console.log(`     - Official Continuations: ${showContinuations ? '✅' : '❌'} (${genealogyDisplay.continuations.length}个)`);
    console.log(`     - Community Derivatives: ${showDerivatives ? '✅' : '❌'} (${genealogyDisplay.derivatives.length}个)`);
    console.log(`     - Empty State: ${showEmptyState ? '✅' : '❌'}`);
    console.log(`     - Statistics: ${showStatistics ? '✅' : '❌'}`);
    console.log(`     - Recent Preview: ${showRecentPreview ? '✅' : '❌'}`);
    
    if (showDerivatives) {
      console.log(`\n     🔵 Community Derivatives将显示:`);
      genealogyDisplay.derivatives.forEach(item => {
        console.log(`     - ${item.title} by ${item.author} (${item.date})`);
      });
    }
  }

  // 6. 最终结论
  console.log(`\n🎯 最终结论:`);
  if (showGenealogy && genealogyDisplay && genealogyDisplay.derivatives.length > 0) {
    console.log(`✅ 作品${workId}应该正确显示${genealogyDisplay.derivatives.length}个Community Derivatives`);
    console.log(`   包括: ${genealogyDisplay.derivatives.map(d => d.title).join(', ')}`);
  } else if (showGenealogy && genealogyDisplay && genealogyDisplay.continuations.length === 0 && genealogyDisplay.derivatives.length === 0) {
    console.log(`ℹ️  作品${workId}会显示空状态（没有衍生作品）`);
  } else {
    console.log(`❌ 作品${workId}的Genealogy不会显示或有问题`);
  }
}

// 测试作品4
simulateFrontendFlow(4);