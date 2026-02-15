import { invoke } from '@tauri-apps/api/core';
import { homeDir } from '@tauri-apps/api/path';
import { stringify } from 'yaml';

export async function createSampleProject(): Promise<string> {
  const home = await homeDir();
  const samplePath = `${home.endsWith('/') ? home.slice(0, -1) : home}/ddd-sample-project`;

  // Create project structure
  await invoke('create_directory', { path: `${samplePath}/specs/domains/users/flows` });
  await invoke('create_directory', { path: `${samplePath}/specs/domains/billing/flows` });
  await invoke('create_directory', { path: `${samplePath}/specs/domains/support/flows` });

  // Project config
  await invoke('write_file', {
    path: `${samplePath}/ddd-project.json`,
    contents: JSON.stringify({
      name: 'ddd-sample-project',
      description: 'Sample DDD project for exploration',
      techStack: { language: 'TypeScript', languageVersion: '5.x', framework: 'Express', database: 'PostgreSQL', orm: 'Prisma' },
      domains: [
        { name: 'Users', description: 'User management and authentication' },
        { name: 'Billing', description: 'Billing, subscriptions, and payments' },
        { name: 'Support', description: 'Customer support and ticketing' },
      ],
      createdAt: new Date().toISOString(),
    }, null, 2),
  });

  const now = new Date().toISOString();

  // --- Users domain ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/users/domain.yaml`,
    contents: stringify({
      name: 'Users',
      description: 'User management and authentication',
      flows: [
        { id: 'user-register', name: 'User Register', type: 'traditional' },
        { id: 'user-login', name: 'User Login', type: 'traditional' },
      ],
      publishes_events: ['UserRegistered', 'UserLoggedIn'],
      consumes_events: [],
      layout: { flows: {}, portals: {} },
    }),
  });

  // --- Billing domain ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/billing/domain.yaml`,
    contents: stringify({
      name: 'Billing',
      description: 'Billing, subscriptions, and payments',
      flows: [
        { id: 'create-subscription', name: 'Create Subscription', type: 'traditional' },
        { id: 'payment-processing', name: 'Payment Processing', type: 'traditional' },
      ],
      publishes_events: ['SubscriptionCreated', 'PaymentFailed'],
      consumes_events: ['UserRegistered'],
      layout: { flows: {}, portals: {} },
    }),
  });

  // --- Support domain ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/support/domain.yaml`,
    contents: stringify({
      name: 'Support',
      description: 'Customer support and ticketing',
      flows: [
        { id: 'support-ticket', name: 'Support Ticket', type: 'agent' },
      ],
      publishes_events: ['TicketResolved'],
      consumes_events: ['PaymentFailed'],
      layout: { flows: {}, portals: {} },
    }),
  });

  // --- Flow: user-register ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/users/flows/user-register.yaml`,
    contents: stringify({
      flow: { id: 'user-register', name: 'User Register', type: 'traditional', domain: 'users' },
      trigger: { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 }, connections: [{ targetNodeId: 'input-1' }], spec: { event: 'POST /api/register', source: 'API Gateway', description: 'User submits registration form' }, label: 'Registration Request' },
      nodes: [
        { id: 'input-1', type: 'input', position: { x: 250, y: 180 }, connections: [{ targetNodeId: 'process-1' }], spec: { fields: [{ name: 'email', type: 'string', required: true }, { name: 'password', type: 'string', required: true }, { name: 'name', type: 'string', required: true }], validation: 'Email format, password min 8 chars', description: 'Registration form data' }, label: 'Registration Form' },
        { id: 'process-1', type: 'process', position: { x: 250, y: 310 }, connections: [{ targetNodeId: 'decision-1' }], spec: { action: 'Check if email already exists', service: 'UserService', description: 'Look up user by email' }, label: 'Check Existing' },
        { id: 'decision-1', type: 'decision', position: { x: 250, y: 440 }, connections: [{ targetNodeId: 'terminal-1', sourceHandle: 'true' }, { targetNodeId: 'process-2', sourceHandle: 'false' }], spec: { condition: 'user exists?', trueLabel: 'Exists', falseLabel: 'New', description: 'Check if email is taken' }, label: 'User Exists?' },
        { id: 'terminal-1', type: 'terminal', position: { x: 50, y: 570 }, connections: [], spec: { outcome: 'error', description: 'Return 409 Conflict' }, label: 'Already Exists' },
        { id: 'process-2', type: 'process', position: { x: 400, y: 570 }, connections: [{ targetNodeId: 'terminal-2' }], spec: { action: 'Hash password and create user record', service: 'UserService', description: 'Create user in database' }, label: 'Create User' },
        { id: 'terminal-2', type: 'terminal', position: { x: 400, y: 700 }, connections: [], spec: { outcome: 'success', description: 'Return 201 Created with user data' }, label: 'Success' },
      ],
      metadata: { created: now, modified: now },
    }),
  });

  // --- Flow: user-login ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/users/flows/user-login.yaml`,
    contents: stringify({
      flow: { id: 'user-login', name: 'User Login', type: 'traditional', domain: 'users' },
      trigger: { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 }, connections: [{ targetNodeId: 'input-1' }], spec: { event: 'POST /api/login', source: 'API Gateway', description: 'User submits login credentials' }, label: 'Login Request' },
      nodes: [
        { id: 'input-1', type: 'input', position: { x: 250, y: 180 }, connections: [{ targetNodeId: 'process-1' }], spec: { fields: [{ name: 'email', type: 'string', required: true }, { name: 'password', type: 'string', required: true }], validation: 'Email format', description: 'Login credentials' }, label: 'Login Form' },
        { id: 'process-1', type: 'process', position: { x: 250, y: 310 }, connections: [{ targetNodeId: 'decision-1' }], spec: { action: 'Verify credentials against stored hash', service: 'AuthService', description: 'Authenticate user' }, label: 'Verify Credentials' },
        { id: 'decision-1', type: 'decision', position: { x: 250, y: 440 }, connections: [{ targetNodeId: 'process-2', sourceHandle: 'true' }, { targetNodeId: 'terminal-1', sourceHandle: 'false' }], spec: { condition: 'credentials valid?', trueLabel: 'Valid', falseLabel: 'Invalid', description: 'Check auth result' }, label: 'Valid?' },
        { id: 'process-2', type: 'process', position: { x: 100, y: 570 }, connections: [{ targetNodeId: 'terminal-2' }], spec: { action: 'Generate JWT token', service: 'AuthService', description: 'Issue authentication token' }, label: 'Generate Token' },
        { id: 'terminal-1', type: 'terminal', position: { x: 400, y: 570 }, connections: [], spec: { outcome: 'error', description: 'Return 401 Unauthorized' }, label: 'Auth Failed' },
        { id: 'terminal-2', type: 'terminal', position: { x: 100, y: 700 }, connections: [], spec: { outcome: 'success', description: 'Return 200 with JWT' }, label: 'Login Success' },
      ],
      metadata: { created: now, modified: now },
    }),
  });

  // --- Flow: create-subscription ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/billing/flows/create-subscription.yaml`,
    contents: stringify({
      flow: { id: 'create-subscription', name: 'Create Subscription', type: 'traditional', domain: 'billing' },
      trigger: { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 }, connections: [{ targetNodeId: 'input-1' }], spec: { event: 'POST /api/subscriptions', source: 'API Gateway', description: 'User selects a subscription plan' }, label: 'Subscribe Request' },
      nodes: [
        { id: 'input-1', type: 'input', position: { x: 250, y: 180 }, connections: [{ targetNodeId: 'process-1' }], spec: { fields: [{ name: 'plan_id', type: 'string', required: true }, { name: 'payment_method', type: 'string', required: true }], validation: 'Valid plan ID and payment method', description: 'Subscription details' }, label: 'Plan Selection' },
        { id: 'process-1', type: 'process', position: { x: 250, y: 310 }, connections: [{ targetNodeId: 'decision-1' }], spec: { action: 'Charge payment method', service: 'PaymentService', description: 'Process initial payment' }, label: 'Process Payment' },
        { id: 'decision-1', type: 'decision', position: { x: 250, y: 440 }, connections: [{ targetNodeId: 'process-2', sourceHandle: 'true' }, { targetNodeId: 'terminal-1', sourceHandle: 'false' }], spec: { condition: 'payment succeeded?', trueLabel: 'Success', falseLabel: 'Failed', description: 'Check payment result' }, label: 'Payment OK?' },
        { id: 'process-2', type: 'process', position: { x: 100, y: 570 }, connections: [{ targetNodeId: 'terminal-2' }], spec: { action: 'Create subscription record', service: 'SubscriptionService', description: 'Activate subscription' }, label: 'Create Subscription' },
        { id: 'terminal-1', type: 'terminal', position: { x: 400, y: 570 }, connections: [], spec: { outcome: 'error', description: 'Return 402 Payment Required' }, label: 'Payment Failed' },
        { id: 'terminal-2', type: 'terminal', position: { x: 100, y: 700 }, connections: [], spec: { outcome: 'success', description: 'Return 201 with subscription data' }, label: 'Subscribed' },
      ],
      metadata: { created: now, modified: now },
    }),
  });

  // --- Flow: payment-processing (with data_store + service_call) ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/billing/flows/payment-processing.yaml`,
    contents: stringify({
      flow: { id: 'payment-processing', name: 'Payment Processing', type: 'traditional', domain: 'billing' },
      trigger: { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 }, connections: [{ targetNodeId: 'data-store-1' }], spec: { event: 'PaymentDue', source: 'Scheduler', description: 'Recurring payment is due' }, label: 'Payment Due' },
      nodes: [
        { id: 'data-store-1', type: 'data_store', position: { x: 250, y: 180 }, connections: [{ targetNodeId: 'service-call-1' }], spec: { operation: 'read', model: 'PaymentMethod', data: {}, query: { user_id: '{{trigger.user_id}}' }, description: 'Load saved payment method' }, label: 'Load Payment Method' },
        { id: 'service-call-1', type: 'service_call', position: { x: 250, y: 330 }, connections: [{ targetNodeId: 'decision-1' }], spec: { method: 'POST', url: 'https://api.stripe.com/v1/charges', headers: { Authorization: 'Bearer {{env.STRIPE_KEY}}' }, body: { amount: '{{trigger.amount}}', currency: 'usd' }, timeout_ms: 10000, retry: { max_attempts: 3, backoff_ms: 2000 }, error_mapping: { '402': 'insufficient_funds', '500': 'gateway_error' }, description: 'Charge via Stripe API' }, label: 'Charge Stripe' },
        { id: 'decision-1', type: 'decision', position: { x: 250, y: 480 }, connections: [{ targetNodeId: 'data-store-2', sourceHandle: 'true' }, { targetNodeId: 'terminal-fail', sourceHandle: 'false' }], spec: { condition: 'charge.status === succeeded', trueLabel: 'Paid', falseLabel: 'Failed', description: 'Check charge result' }, label: 'Charge OK?' },
        { id: 'data-store-2', type: 'data_store', position: { x: 100, y: 620 }, connections: [{ targetNodeId: 'terminal-ok' }], spec: { operation: 'update', model: 'Subscription', data: { last_payment: '{{now}}', status: 'active' }, query: { id: '{{trigger.subscription_id}}' }, description: 'Update subscription record' }, label: 'Update Subscription' },
        { id: 'terminal-ok', type: 'terminal', position: { x: 100, y: 750 }, connections: [], spec: { outcome: 'success', description: 'Payment processed successfully' }, label: 'Payment OK' },
        { id: 'terminal-fail', type: 'terminal', position: { x: 400, y: 620 }, connections: [], spec: { outcome: 'error', description: 'Emit PaymentFailed event' }, label: 'Payment Failed' },
      ],
      metadata: { created: now, modified: now },
    }),
  });

  // --- Flow: support-ticket (agent flow) ---
  await invoke('write_file', {
    path: `${samplePath}/specs/domains/support/flows/support-ticket.yaml`,
    contents: stringify({
      flow: { id: 'support-ticket', name: 'Support Ticket', type: 'agent', domain: 'support' },
      trigger: { id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 }, connections: [{ targetNodeId: 'guardrail-1' }], spec: { event: 'Ticket Created', source: 'Support Portal', description: 'Customer creates a support ticket' }, label: 'New Ticket' },
      nodes: [
        { id: 'guardrail-1', type: 'guardrail', position: { x: 250, y: 170 }, connections: [{ targetNodeId: 'agent-loop-1' }], spec: { position: 'input', checks: [{ type: 'content_policy', action: 'block' }], on_block: 'Reject inappropriate content' }, label: 'Input Filter' },
        { id: 'agent-loop-1', type: 'agent_loop', position: { x: 250, y: 320 }, connections: [{ targetNodeId: 'human-gate-1' }], spec: { model: 'claude-sonnet', system_prompt: 'You are a helpful customer support agent. Investigate the issue and propose a resolution.', max_iterations: 8, temperature: 0.5, stop_conditions: ['resolution_proposed'], tools: [{ id: 'lookup', name: 'lookup_ticket', description: 'Look up ticket history', parameters: '{"ticket_id": "string"}' }, { id: 'search', name: 'search_kb', description: 'Search knowledge base', parameters: '{"query": "string"}' }, { id: 'resolve', name: 'propose_resolution', description: 'Propose a resolution', parameters: '{"resolution": "string"}', is_terminal: true }], memory: [{ name: 'conversation', type: 'conversation_history', max_tokens: 8000, strategy: 'sliding_window' }], on_max_iterations: 'escalate' }, label: 'Support Agent' },
        { id: 'human-gate-1', type: 'human_gate', position: { x: 250, y: 480 }, connections: [{ targetNodeId: 'terminal-1' }], spec: { notification_channels: ['slack'], approval_options: [{ id: 'approve', label: 'Approve' }, { id: 'reject', label: 'Reject' }], timeout: { duration: 3600, action: 'escalate' }, context_for_human: ['ticket_summary', 'proposed_resolution'] }, label: 'Review Gate' },
        { id: 'terminal-1', type: 'terminal', position: { x: 250, y: 610 }, connections: [], spec: { outcome: 'resolved', description: 'Ticket resolved or escalated' }, label: 'Resolved' },
      ],
      metadata: { created: now, modified: now },
    }),
  });

  // System-level event wiring
  await invoke('write_file', {
    path: `${samplePath}/specs/system.yaml`,
    contents: stringify({
      events: [
        { name: 'UserRegistered', source: 'users', consumers: ['billing'] },
        { name: 'PaymentFailed', source: 'billing', consumers: ['support'] },
      ],
    }),
  });

  return samplePath;
}
