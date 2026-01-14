#!/usr/bin/env tsx

/**
 * ABFI Projects Integration Test
 * Comprehensive test of all ABFI projects functionality
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '../server/routers';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3002/trpc',
    }),
  ],
});

async function testABFIProjects() {
  console.log('🧪 Testing ABFI Projects Integration...\n');

  try {
    // Test 1: Get all assessments
    console.log('📊 Test 1: Get All Assessments');
    const assessments = await client.abfiProjects.getAllAssessments.query({
      limit: 50,
    });
    console.log(`✅ Found ${assessments.assessments.length} assessments`);
    console.log(`📈 Total assessments: ${assessments.totalCount}`);
    console.log(`🏆 Top assessment: ${assessments.assessments[0]?.shortName} (Rank ${assessments.assessments[0]?.rank})`);

    // Test 2: Get assessment by ID
    console.log('\n📋 Test 2: Get Assessment by ID');
    const assessmentId = assessments.assessments[0]?.assessmentId;
    if (assessmentId) {
      const detailedAssessment = await client.abfiProjects.getAssessmentById.query({
        assessmentId,
      });
      console.log(`✅ Retrieved detailed assessment: ${detailedAssessment.assessment.projectName}`);
      console.log(`🏗️ Status: ${detailedAssessment.assessment.status}`);
      console.log(`⭐ Rating: ${detailedAssessment.assessment.rating} (${detailedAssessment.assessment.tierLabel})`);
      console.log(`🏢 Proponents: ${detailedAssessment.proponents.map(p => p.proponentName).join(', ')}`);
    }

    // Test 3: Get assessment statistics
    console.log('\n📈 Test 3: Get Assessment Statistics');
    const stats = await client.abfiProjects.getAssessmentStats.query();
    console.log(`📊 Total Projects: ${stats.totalProjects}`);
    console.log(`🏆 Tier Distribution:`);
    stats.tierDistribution.forEach(tier => {
      console.log(`   Tier ${tier.tier}: ${tier.count} projects`);
    });
    console.log(`🌍 Top States: ${stats.stateDistribution.slice(0, 3).map(s => `${s.state} (${s.count})`).join(', ')}`);
    console.log(`📊 Average Score: ${stats.scoreStats.average}`);

    // Test 4: Get framework info
    console.log('\n🏛️ Test 4: Get Framework Information');
    const framework = await client.abfiProjects.getFramework.query();
    if (framework) {
      console.log(`✅ Framework: ${framework.frameworkName} (${framework.version})`);
      console.log(`📅 Assessment Date: ${framework.assessmentDate}`);
      console.log(`👤 Analyst: ${framework.analyst}`);
    }

    // Test 5: Filter by tier
    console.log('\n🏆 Test 5: Filter by Tier (Bankable projects only)');
    const bankableProjects = await client.abfiProjects.getAllAssessments.query({
      limit: 10,
      tier: '1',
    });
    console.log(`✅ Found ${bankableProjects.assessments.length} bankable projects`);
    bankableProjects.assessments.forEach(project => {
      console.log(`   ${project.rank}. ${project.shortName} - ${project.rating} (${project.overallScore}/10)`);
    });

    console.log('\n🎉 All ABFI Projects API tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Test the server is running first
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:3002/health');
    if (!response.ok) {
      console.log('⚠️ Server not running. Starting server for testing...');
      return false;
    }
    return true;
  } catch {
    console.log('⚠️ Server not running. Please start the server with: npm run dev');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServerHealth();
  if (!serverRunning) {
    console.log('💡 To run these tests, start the server first:');
    console.log('   npm run dev');
    process.exit(1);
  }

  await testABFIProjects();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}