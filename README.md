# gatewatch-rbac-bench-mark
benchmarking performance and memory usage of gatewatch library 

1. install required dependency : Note two main version this benchmark was created for 1.8.0 and 1.9.2 

```bash
npm install gatewatch pretty-bytes perf_hooks
```

2. run the benchmark test 
   
```bash
node --expose-gc index.js
```

# Over All results v1.8.0 ( old arrays ) and v1.9.2 ( new bitmaps )


| **Test Case**                          | **v1.8.0 Avg Time** | **v1.9.2 Avg Time** | **Speedup** | **Memory Efficiency** (Δ per 1000 queries) |
|----------------------------------------|---------------------|---------------------|-------------|--------------------------------------------|
| **Guest read access**                  | 0.0003 ms           | 0.0002 ms           | **1.5x**    | 106 kB → 106 kB (no change)                |
| **Editor publishing**                  | 0.0004 ms           | 0.0002 ms           | **2x**      | 106 kB → **-8.06 kB** (better)             |
| **Department admin wildcard**          | 0.0003 ms           | 0.0001 ms           | **3x**      | -240 kB → **-241 kB** (slightly better)    |
| **Global admin wildcard**              | 0.0001 ms           | 0.0001 ms           | **1x**      | 107 kB → 117 kB (slightly higher)          |
| **Security admin (crypto ops)**        | 0.0001 ms           | 0.0002 ms           | **0.5x**    | 107 kB → 107 kB (no change)                |
| **Support agent (emergency update)**   | 0.0010 ms           | 0.0005 ms           | **2x**      | 106 kB → 119 kB (slightly higher)          |
| **Unauthorized role attempt**          | 0.0002 ms           | 0.0001 ms           | **2x**      | 106 kB → 106 kB (no change)                |
| **Invalid resource access**            | 0.0002 ms           | 0.0001 ms           | **2x**      | 106 kB → 106 kB (no change)                |




# v1.8.0 results
-  all operations complete in sub-=millisecond time ( 0.0003 ms ) avg
- consistent performance.
- low baseline memory 
```Bash
PS C:\projects\gatewatch-rbac-bench-mark> node --expose-gc index.js
=== Gatewatch Performance Benchmark ===
Iterations per test: 10000
Warmup iterations: 1000

Policy Initialization Memory: -1.74 kB

Running warmup...

Test Case: Guest read access - Basic resource
Avg Time: 0.0003ms
Memory per 1000 queries: 106 kB

Test Case: Editor publishing - Content resource
Avg Time: 0.0004ms
Memory per 1000 queries: 106 kB

Test Case: Department admin wildcard - Limited scope
Avg Time: 0.0003ms
Memory per 1000 queries: -240 kB

Test Case: Global admin wildcard - Any resource
Avg Time: 0.0001ms
Memory per 1000 queries: 107 kB

Test Case: Security admin - Cryptographic operations
Avg Time: 0.0001ms
Memory per 1000 queries: 107 kB

Test Case: Support agent - Emergency update
Avg Time: 0.0010ms
Memory per 1000 queries: 106 kB

Test Case: Unauthorized role attempt
Avg Time: 0.0002ms
Memory per 1000 queries: 106 kB

Test Case: Invalid resource access
Avg Time: 0.0002ms
Memory per 1000 queries: 106 kB
```

# v1.9.2 results 

```Bash
Iterations per test: 10000
Warmup iterations: 1000

Policy Initialization Memory: 35.8 kB

Running warmup...

Test Case: Guest read access - Basic resource
Avg Time: 0.0002ms
Memory per 1000 queries: 106 kB

Test Case: Editor publishing - Content resource
Avg Time: 0.0002ms
Memory per 1000 queries: -8.06 kB

Test Case: Department admin wildcard - Limited scope
Avg Time: 0.0001ms
Memory per 1000 queries: -241 kB

Test Case: Global admin wildcard - Any resource
Avg Time: 0.0001ms
Memory per 1000 queries: 117 kB

Test Case: Security admin - Cryptographic operations
Avg Time: 0.0002ms
Memory per 1000 queries: 107 kB

Test Case: Support agent - Emergency update
Avg Time: 0.0005ms
Memory per 1000 queries: 119 kB

Test Case: Unauthorized role attempt
Avg Time: 0.0001ms
Memory per 1000 queries: 106 kB

Test Case: Invalid resource access
Avg Time: 0.0001ms
Memory per 1000 queries: 106 kB

```