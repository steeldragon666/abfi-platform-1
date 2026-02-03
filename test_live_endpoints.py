#!/usr/bin/env python3
"""
Comprehensive API Endpoint Testing for ABFI Platform
Tests all critical endpoints on live deployment
"""

import requests
import json
import sys
from typing import Dict, List, Tuple

BASE_URL = "https://abfi-platform.vercel.app"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def test_endpoint(method: str, path: str, expected_status: int = 200, data: Dict = None) -> Tuple[bool, str, Dict]:
    """Test a single endpoint"""
    url = f"{BASE_URL}{path}"
    try:
        if method == "GET":
            response = requests.get(url, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=10)
        else:
            return False, f"Unsupported method: {method}", {}
        
        success = response.status_code == expected_status
        result_data = {}
        try:
            result_data = response.json()
        except:
            result_data = {"text": response.text[:200]}
        
        return success, f"Status: {response.status_code}", result_data
    except Exception as e:
        return False, f"Error: {str(e)}", {}

def main():
    print(f"{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}ABFI Platform - Live Endpoint Testing{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}\n")
    
    # Test cases: (method, path, expected_status, description)
    tests = [
        ("GET", "/", 200, "Homepage"),
        ("GET", "/api/health", 200, "Health Check"),
        ("GET", "/api/trpc/intelligence.getLatestSummary", 200, "Intelligence Summary"),
        ("GET", "/api/trpc/sentiment.getMarketSentiment", 200, "Market Sentiment"),
        ("GET", "/api/trpc/prices.getCurrentPrices", 200, "Current Prices"),
        ("GET", "/api/trpc/policy.getPolicyUpdates", 200, "Policy Updates"),
        ("GET", "/api/trpc/bankability.getProjectRatings", 200, "Project Ratings"),
        ("GET", "/api/trpc/projects.list", 200, "Projects List"),
        ("GET", "/map", 200, "Map Page"),
        ("GET", "/market-intelligence", 200, "Market Intelligence Page"),
        ("GET", "/finance/dashboard", 200, "Finance Dashboard"),
    ]
    
    passed = 0
    failed = 0
    results = []
    
    for method, path, expected, description in tests:
        success, message, data = test_endpoint(method, path, expected)
        
        status_icon = f"{Colors.GREEN}✓{Colors.END}" if success else f"{Colors.RED}✗{Colors.END}"
        print(f"{status_icon} {description:40} {message}")
        
        if success:
            passed += 1
        else:
            failed += 1
            results.append({
                "endpoint": path,
                "description": description,
                "message": message,
                "data": data
            })
    
    print(f"\n{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BLUE}Summary{Colors.END}")
    print(f"{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    print(f"Total: {passed + failed}")
    print(f"Success Rate: {(passed/(passed+failed)*100):.1f}%\n")
    
    if failed > 0:
        print(f"{Colors.YELLOW}Failed Endpoints:{Colors.END}")
        for result in results:
            print(f"  - {result['endpoint']}: {result['message']}")
    
    # Save detailed results
    with open("/home/ubuntu/abfi-platform-1/api_test_results.json", "w") as f:
        json.dump({
            "passed": passed,
            "failed": failed,
            "total": passed + failed,
            "success_rate": f"{(passed/(passed+failed)*100):.1f}%",
            "failed_tests": results
        }, f, indent=2)
    
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
