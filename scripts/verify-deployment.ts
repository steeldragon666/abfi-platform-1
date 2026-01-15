#!/usr/bin/env tsx

/**
 * ABFI Platform Deployment Verification Script
 * Tests the deployed Vercel application to ensure all features are working
 */

const DEPLOYMENT_URL = 'https://abfi-platform-1-d55twbyhc-one-483ce2d0.vercel.app';

async function testEndpoint(url: string, description: string): Promise<boolean> {
  try {
    console.log(`🔍 Testing: ${description}`);
    const response = await fetch(url);
    const success = response.ok;
    console.log(`   ${success ? '✅' : '❌'} ${response.status} - ${url}`);
    return success;
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testTRPCEndpoint(endpoint: string, description: string): Promise<boolean> {
  try {
    console.log(`🔍 Testing: ${description}`);
    const response = await fetch(`${DEPLOYMENT_URL}/trpc/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'query',
        params: {
          path: endpoint,
          input: {},
        },
      }),
    });

    const success = response.ok;
    console.log(`   ${success ? '✅' : '❌'} ${response.status} - tRPC ${endpoint}`);

    if (success) {
      const data = await response.json();
      if (data.result?.data) {
        console.log(`   📊 Data received: ${Array.isArray(data.result.data) ? data.result.data.length : 'object'} items`);
      }
    }

    return success;
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function verifyDeployment() {
  console.log('🚀 ABFI Platform Deployment Verification');
  console.log(`📍 Testing deployment: ${DEPLOYMENT_URL}`);
  console.log('=' .repeat(60));

  const results: boolean[] = [];

  // Test basic page loads
  results.push(await testEndpoint(`${DEPLOYMENT_URL}/`, 'Homepage'));
  results.push(await testEndpoint(`${DEPLOYMENT_URL}/map`, 'Map Page'));

  // Test health endpoint
  results.push(await testEndpoint(`${DEPLOYMENT_URL}/health`, 'Health Check'));

  // Test API endpoints
  results.push(await testEndpoint(`${DEPLOYMENT_URL}/api/calculate-score?ci=25`, 'Carbon Score API'));

  // Test new ABFI Projects tRPC endpoints
  results.push(await testTRPCEndpoint('abfiProjects.getAllAssessments', 'ABFI Projects - Get All Assessments'));
  results.push(await testTRPCEndpoint('abfiProjects.getAssessmentStats', 'ABFI Projects - Get Statistics'));
  results.push(await testTRPCEndpoint('abfiProjects.getFramework', 'ABFI Projects - Get Framework'));

  // Test existing tRPC endpoints
  results.push(await testTRPCEndpoint('feedstocks.search', 'Feedstocks Search'));

  console.log('=' .repeat(60));
  const passed = results.filter(Boolean).length;
  const total = results.length;
  const successRate = (passed / total * 100).toFixed(1);

  console.log(`📊 Verification Results: ${passed}/${total} tests passed (${successRate}%)`);

  if (passed === total) {
    console.log('🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
    console.log('✅ All features are live on the deployed application');
    return true;
  } else {
    console.log('⚠️ DEPLOYMENT VERIFICATION PARTIAL - Some features may not be working');
    return false;
  }
}

// Run verification
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyDeployment()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Verification failed with error:', error);
      process.exit(1);
    });
}