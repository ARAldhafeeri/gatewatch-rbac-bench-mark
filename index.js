import { performance  } from 'perf_hooks';
import { AccessControl, GrantQuery } from "gatewatch";
import prettyBytes from "pretty-bytes";

// Expanded realistic policy data for enterprise-scale testing
const generateLargePolicy = () => {
  // Generate 50 resource types
  const resources = Array.from({length: 50}, (_, i) => 
    `resource${i < 10 ? '0'+i : i}_${['post','file','db','api','config'][i%5]}`
  );
  
  // 20 possible actions
  const actions = [
    'read', 'create', 'update', 'delete', 
    'approve', 'reject', 'publish', 'archive',
    'share', 'transfer', 'backup', 'restore',
    'encrypt', 'decrypt', 'lock', 'unlock',
    'deploy', 'rollback', 'notify', 'audit'
  ];

  // 15 role types with hierarchy
  const roles = [
    'guest', 'basic-user', 'power-user', 'content-moderator',
    'editor', 'publisher', 'auditor', 'support-agent',
    'department-admin', 'global-admin', 'security-admin',
    'system-operator', 'backup-admin', 'super-admin', 'system'
  ];

  // Generate 200 policy rules
  const policies = [];
  
  // 1. Base permissions for all roles
  roles.forEach(role => {
    policies.push({
      role,
      can: ['read'],
      on: ['resource00_post', 'resource01_file'] // Basic read access
    });
  });

  // 2. Role-specific permissions
  // Content team
  policies.push(...['editor', 'content-moderator', 'publisher'].map(role => ({
    role,
    can: ['create', 'update', 'delete', 'publish'],
    on: resources.filter(r => r.includes('post'))
  })));

  // Admin roles
  policies.push({
    role: 'department-admin',
    can: ['*'],
    on: resources.slice(0, 25) // First half resources
  });

  policies.push({
    role: 'global-admin',
    can: ['*'],
    on: ['*'] // All resources
  });

  // 3. Special cases
  policies.push(
    {
      role: 'support-agent',
      can: ['read', 'update'],
      on: resources.filter(r => r.includes('config'))
    },
    {
      role: 'security-admin',
      can: ['encrypt', 'decrypt', 'lock', 'unlock', 'audit'],
      on: ['*']
    }
  );

  return { resources, actions, roles, policies };
};

const policy = generateLargePolicy();

// Initialize test variables with realistic scenarios
const testIterations = 10000;
const warmupIterations = 1000;
const testCases = [
  // Basic access scenarios
  {
    name: "Guest read access - Basic resource",
    role: "guest",
    can: ["read"],
    on: ["resource00_post"]
  },
  {
    name: "Editor publishing - Content resource",
    role: "editor",
    can: ["publish", "update"],
    on: ["resource12_post"]
  },
  
  // Administrative scenarios
  {
    name: "Department admin wildcard - Limited scope",
    role: "department-admin",
    can: ["*"],
    on: ["resource24_file"]
  },
  {
    name: "Global admin wildcard - Any resource",
    role: "global-admin",
    can: ["backup"],
    on: ["resource49_config"]
  },
  
  // Security scenarios
  {
    name: "Security admin - Cryptographic operations",
    role: "security-admin",
    can: ["encrypt", "decrypt"],
    on: ["resource35_db"],
    condition: () => true // Simulate security context check
  },
  
  // Complex conditional scenarios
  {
    name: "Support agent - Emergency update",
    role: "support-agent",
    can: ["update"],
    on: ["resource07_config"],
    condition: () => {
      // Simulate emergency mode check
      return process.env.EMERGENCY_MODE === 'true'; 
    }
  },
  
  // Negative test cases
  {
    name: "Unauthorized role attempt",
    role: "basic-user",
    can: ["publish"],
    on: ["resource12_post"]
  },
  {
    name: "Invalid resource access",
    role: "power-user",
    can: ["read"],
    on: ["resource49_config"] // Typically restricted
  }
];


// Memory measurement helper
function getMemoryUsage() {
  if (global.gc) {
    global.gc(); // Force garbage collection if available
  }
  return process.memoryUsage().heapUsed;
}

// Benchmark runner
async function runBenchmarks() {
  console.log("=== Gatewatch Performance Benchmark ===");
  console.log(`Iterations per test: ${testIterations}`);
  console.log(`Warmup iterations: ${warmupIterations}\n`);

  // Initialize AccessControl
  let startMem = getMemoryUsage();
  const ac = new AccessControl(policy);
  const enforcedPolicy = ac.enforce();
  let endMem = getMemoryUsage();
  console.log(`Policy Initialization Memory: ${prettyBytes(endMem - startMem)}`);

  // Warmup phase
  console.log("\nRunning warmup...");
  for (let i = 0; i < warmupIterations; i++) {
    const testCase = testCases[i % testCases.length];
    new GrantQuery(enforcedPolicy)
      .role(testCase.role)
      .can(testCase.can)
      .on(testCase.on)
      .grant();
  }

  // Run benchmarks
  for (const testCase of testCases) {
    console.log(`\nTest Case: ${testCase.name}`);
    
    // Time measurement
    const startTime = performance.now();
    for (let i = 0; i < testIterations; i++) {
      const query = new GrantQuery(enforcedPolicy)
        .role(testCase.role)
        .can(testCase.can)
        .on(testCase.on);
      
      if (testCase.condition) {
        if (testCase.name.includes('AND')) {
          query.and(testCase.condition());
        } else {
          query.or(testCase.condition());
        }
      }
      
      query.grant();
    }
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / testIterations;
    console.log(`Avg Time: ${avgTime.toFixed(4)}ms`);

    // Memory measurement
    startMem = getMemoryUsage();
    const queries = [];
    for (let i = 0; i < 1000; i++) {
      queries.push(new GrantQuery(enforcedPolicy)
        .role(testCase.role)
        .can(testCase.can)
        .on(testCase.on));
    }
    endMem = getMemoryUsage();
    console.log(`Memory per 1000 queries: ${prettyBytes(endMem - startMem)}`);
  }
}

// Run benchmarks
runBenchmarks().catch(console.error);