#!/usr/bin/env node
/**
 * n8n Workflow Parser
 * Parses all n8n workflow files (JSON files with n8n workflow structure)
 * Extracts workflow information: nodes, connections, settings, webhooks, etc.
 */

import { readFileSync, statSync, readdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check if a JSON object is an n8n workflow
 * n8n workflows have: name, nodes (array), connections (object)
 */
function isN8nWorkflow(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  
  // Check for n8n workflow structure
  const hasNodes = Array.isArray(obj.nodes);
  const hasConnections = obj.connections && typeof obj.connections === 'object';
  const hasName = typeof obj.name === 'string';
  
  // Also check for n8n-specific fields
  const hasN8nFields = obj.active !== undefined || 
                      obj.settings !== undefined || 
                      obj.staticData !== undefined ||
                      obj.tags !== undefined;
  
  return (hasNodes && hasConnections) || (hasName && hasNodes) || hasN8nFields;
}

/**
 * Find all JSON files that might be n8n workflows
 */
function findN8nFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach(file => {
    const filePath = join(dir, file);
    try {
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        // Skip node_modules, dist, coverage, and .git directories
        if (!['node_modules', 'dist', 'coverage', '.git', 'dist-public'].includes(file)) {
          findN8nFiles(filePath, fileList);
        }
      } else if (file.endsWith('.json') || file.endsWith('.n8n')) {
        fileList.push(filePath);
      }
    } catch (err) {
      // Skip files we can't access
    }
  });
  
  return fileList;
}

/**
 * Extract node type information
 */
function analyzeNode(node) {
  const info = {
    id: node.id,
    name: node.name,
    type: node.type,
    typeVersion: node.typeVersion,
    position: node.position,
    parameters: node.parameters ? Object.keys(node.parameters).length : 0,
    webhookId: node.webhookId || null,
    webhookMethod: node.webhookMethod || null,
    webhookPath: node.webhookPath || null,
  };
  
  // Extract specific node type details
  if (node.type === 'n8n-nodes-base.webhook') {
    info.webhookDetails = {
      path: node.parameters?.path || node.webhookPath,
      method: node.parameters?.httpMethod || node.webhookMethod,
      responseMode: node.parameters?.responseMode,
      options: node.parameters?.options || {},
    };
  }
  
  if (node.type === 'n8n-nodes-base.httpRequest') {
    info.httpDetails = {
      method: node.parameters?.method,
      url: node.parameters?.url,
      authentication: node.parameters?.authentication,
    };
  }
  
  if (node.type?.includes('llm') || node.type?.includes('openai') || node.type?.includes('anthropic')) {
    info.llmDetails = {
      model: node.parameters?.model,
      provider: node.type,
    };
  }
  
  return info;
}

/**
 * Analyze n8n workflow structure
 */
function analyzeWorkflow(workflow) {
  const analysis = {
    name: workflow.name || 'Unnamed Workflow',
    active: workflow.active !== undefined ? workflow.active : null,
    nodes: [],
    nodeCount: 0,
    nodeTypes: {},
    connections: {},
    webhooks: [],
    httpRequests: [],
    llmNodes: [],
    settings: workflow.settings || {},
    tags: workflow.tags || [],
    staticData: workflow.staticData ? Object.keys(workflow.staticData).length : 0,
    createdAt: workflow.createdAt || null,
    updatedAt: workflow.updatedAt || null,
  };
  
  // Analyze nodes
  if (Array.isArray(workflow.nodes)) {
    analysis.nodeCount = workflow.nodes.length;
    
    workflow.nodes.forEach(node => {
      const nodeInfo = analyzeNode(node);
      analysis.nodes.push(nodeInfo);
      
      // Count node types
      const type = node.type || 'unknown';
      analysis.nodeTypes[type] = (analysis.nodeTypes[type] || 0) + 1;
      
      // Collect webhooks
      if (node.type === 'n8n-nodes-base.webhook' || node.webhookId) {
        analysis.webhooks.push({
          id: node.id,
          name: node.name,
          path: nodeInfo.webhookDetails?.path || node.webhookPath,
          method: nodeInfo.webhookDetails?.method || node.webhookMethod,
          responseMode: nodeInfo.webhookDetails?.responseMode,
        });
      }
      
      // Collect HTTP requests
      if (node.type === 'n8n-nodes-base.httpRequest') {
        analysis.httpRequests.push({
          id: node.id,
          name: node.name,
          method: nodeInfo.httpDetails?.method,
          url: nodeInfo.httpDetails?.url,
        });
      }
      
      // Collect LLM nodes
      if (nodeInfo.llmDetails) {
        analysis.llmNodes.push({
          id: node.id,
          name: node.name,
          provider: nodeInfo.llmDetails.provider,
          model: nodeInfo.llmDetails.model,
        });
      }
    });
  }
  
  // Analyze connections
  if (workflow.connections && typeof workflow.connections === 'object') {
    analysis.connections = {
      totalConnections: 0,
      connectionMap: {},
    };
    
    Object.keys(workflow.connections).forEach(sourceNode => {
      const connections = workflow.connections[sourceNode];
      if (connections && typeof connections === 'object') {
        Object.keys(connections).forEach(outputType => {
          const outputs = connections[outputType];
          if (Array.isArray(outputs)) {
            outputs.forEach(output => {
              if (Array.isArray(output)) {
                output.forEach(connection => {
                  if (connection && Array.isArray(connection)) {
                    analysis.connections.totalConnections += connection.length;
                    const targetNode = connection[0]?.node;
                    if (targetNode) {
                      if (!analysis.connections.connectionMap[sourceNode]) {
                        analysis.connections.connectionMap[sourceNode] = [];
                      }
                      analysis.connections.connectionMap[sourceNode].push({
                        to: targetNode,
                        output: connection[0]?.output,
                        input: connection[0]?.input,
                      });
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
  }
  
  return analysis;
}

/**
 * Format analysis for display
 */
function formatAnalysis(analysis, filePath) {
  const relativePath = relative(__dirname, filePath);
  const output = [];
  
  output.push(`\n${'='.repeat(80)}`);
  output.push(`n8n Workflow: ${relativePath}`);
  output.push(`${'='.repeat(80)}`);
  output.push(`Name: ${analysis.name}`);
  output.push(`Active: ${analysis.active !== null ? (analysis.active ? 'Yes' : 'No') : 'Unknown'}`);
  output.push(`Node Count: ${analysis.nodeCount}`);
  output.push(`Tags: ${analysis.tags.length > 0 ? analysis.tags.join(', ') : 'None'}`);
  output.push(`Static Data Keys: ${analysis.staticData}`);
  
  if (analysis.createdAt) {
    output.push(`Created: ${analysis.createdAt}`);
  }
  if (analysis.updatedAt) {
    output.push(`Updated: ${analysis.updatedAt}`);
  }
  
  // Node types summary
  if (Object.keys(analysis.nodeTypes).length > 0) {
    output.push(`\nNode Types:`);
    Object.entries(analysis.nodeTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        output.push(`  - ${type}: ${count}`);
      });
  }
  
  // Webhooks
  if (analysis.webhooks.length > 0) {
    output.push(`\nWebhooks (${analysis.webhooks.length}):`);
    analysis.webhooks.forEach(webhook => {
      output.push(`  - ${webhook.name || webhook.id}`);
      if (webhook.path) output.push(`    Path: ${webhook.path}`);
      if (webhook.method) output.push(`    Method: ${webhook.method}`);
      if (webhook.responseMode) output.push(`    Response Mode: ${webhook.responseMode}`);
    });
  }
  
  // HTTP Requests
  if (analysis.httpRequests.length > 0) {
    output.push(`\nHTTP Requests (${analysis.httpRequests.length}):`);
    analysis.httpRequests.forEach(req => {
      output.push(`  - ${req.name || req.id}`);
      if (req.method) output.push(`    Method: ${req.method}`);
      if (req.url) output.push(`    URL: ${req.url}`);
    });
  }
  
  // LLM Nodes
  if (analysis.llmNodes.length > 0) {
    output.push(`\nLLM Nodes (${analysis.llmNodes.length}):`);
    analysis.llmNodes.forEach(llm => {
      output.push(`  - ${llm.name || llm.id}`);
      output.push(`    Provider: ${llm.provider}`);
      if (llm.model) output.push(`    Model: ${llm.model}`);
    });
  }
  
  // Connections
  if (analysis.connections.totalConnections > 0) {
    output.push(`\nConnections: ${analysis.connections.totalConnections} total`);
    const connectionCount = Object.keys(analysis.connections.connectionMap).length;
    if (connectionCount > 0 && connectionCount <= 10) {
      output.push(`Connection Map:`);
      Object.entries(analysis.connections.connectionMap).forEach(([from, tos]) => {
        output.push(`  ${from} → ${tos.map(t => t.to).join(', ')}`);
      });
    }
  }
  
  // Settings
  if (Object.keys(analysis.settings).length > 0) {
    output.push(`\nSettings:`);
    Object.entries(analysis.settings).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        output.push(`  - ${key}: ${JSON.stringify(value).substring(0, 100)}`);
      } else {
        output.push(`  - ${key}: ${value}`);
      }
    });
  }
  
  return output.join('\n');
}

/**
 * Main parsing function
 */
async function parseAllN8nFiles() {
  console.log('Searching for n8n workflow files...\n');
  
  const allJsonFiles = findN8nFiles(__dirname);
  const results = [];
  const workflows = [];
  
  console.log(`Found ${allJsonFiles.length} potential JSON/n8n files to check\n`);
  
  for (const file of allJsonFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      const parsed = JSON.parse(content);
      
      // Check if it's an n8n workflow
      if (isN8nWorkflow(parsed)) {
        const stats = statSync(file);
        const sizeKB = (stats.size / 1024).toFixed(2);
        
        const analysis = analyzeWorkflow(parsed);
        analysis.file = file;
        analysis.sizeKB = parseFloat(sizeKB);
        
        workflows.push(analysis);
        results.push({
          file,
          valid: true,
          isN8nWorkflow: true,
          sizeKB: parseFloat(sizeKB),
          analysis,
        });
        
        console.log(formatAnalysis(analysis, file));
      } else {
        // Not an n8n workflow, but valid JSON
        results.push({
          file,
          valid: true,
          isN8nWorkflow: false,
        });
      }
    } catch (error) {
      results.push({
        file,
        valid: false,
        isN8nWorkflow: false,
        error: error.message,
      });
      console.log(`✗ ${file}`);
      console.log(`  Error: ${error.message}\n`);
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}`);
  
  const n8nWorkflows = results.filter(r => r.isN8nWorkflow);
  const validJson = results.filter(r => r.valid && !r.isN8nWorkflow);
  const invalid = results.filter(r => !r.valid);
  
  console.log(`Total files checked: ${results.length}`);
  console.log(`n8n Workflows found: ${n8nWorkflows.length}`);
  console.log(`Valid JSON (not n8n): ${validJson.length}`);
  console.log(`Invalid files: ${invalid.length}`);
  
  if (n8nWorkflows.length > 0) {
    const totalSize = n8nWorkflows.reduce((sum, r) => sum + (r.sizeKB || 0), 0);
    const totalNodes = workflows.reduce((sum, w) => sum + w.nodeCount, 0);
    const totalWebhooks = workflows.reduce((sum, w) => sum + w.webhooks.length, 0);
    
    console.log(`\nTotal workflow size: ${totalSize.toFixed(2)} KB`);
    console.log(`Total nodes across all workflows: ${totalNodes}`);
    console.log(`Total webhooks: ${totalWebhooks}`);
    
    console.log(`\nWorkflow Details:`);
    workflows.forEach(w => {
      console.log(`  - ${w.name}: ${w.nodeCount} nodes, ${w.webhooks.length} webhooks`);
    });
  }
  
  if (invalid.length > 0) {
    console.log('\nInvalid files:');
    invalid.forEach(r => {
      console.log(`  - ${r.file}: ${r.error}`);
    });
  }
  
  // Save results to JSON file
  const outputFile = join(__dirname, 'n8n-parse-results.json');
  const outputData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      n8nWorkflows: n8nWorkflows.length,
      validJson: validJson.length,
      invalid: invalid.length,
    },
    workflows: workflows.map(w => ({
      file: relative(__dirname, w.file),
      name: w.name,
      active: w.active,
      nodeCount: w.nodeCount,
      nodeTypes: w.nodeTypes,
      webhooks: w.webhooks,
      httpRequests: w.httpRequests,
      llmNodes: w.llmNodes,
      connections: w.connections.totalConnections,
      tags: w.tags,
      sizeKB: w.sizeKB,
    })),
    allResults: results.map(r => ({
      file: relative(__dirname, r.file),
      valid: r.valid,
      isN8nWorkflow: r.isN8nWorkflow,
      sizeKB: r.sizeKB || null,
      error: r.error || null,
    })),
  };
  
  writeFileSync(outputFile, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\n✓ Results saved to: n8n-parse-results.json`);
}

// Run the parser
parseAllN8nFiles().catch(console.error);
