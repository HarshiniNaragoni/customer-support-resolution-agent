export interface Ticket {
  ticket_id: string;
  customer_name: string;
  customer_email: string;
  ticket_type: string;
  message: string;
  priority: string;
  status: string;
  confidence: number | null;
  resolution: string | null;
  assigned_to: string | null;
  created_at: string;
}

export interface Order {
  order_id: string;
  customer_name: string;
  email: string;
  product_name: string;
  status: string;
  carrier: string | null;
  tracking_number: string | null;
  estimated_delivery: string | null;
  price: number;
  created_at: string;
}

export interface Policy {
  policy_id: string;
  title: string;
  category: string;
  content: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  ticket_id: string;
  intent: string | null;
  retrieved_documents: string | null;
  tool_calls: string | null;
  final_resolution: string | null;
  confidence: number | null;
  escalated: boolean;
  created_at: string;
}

export interface AgentInvokeRequest {
  customer_message: string;
  customer_email?: string;
  customer_name?: string;
  ticket_id?: string;
}

export interface AgentInvokeResponse {
  ticket_id: string;
  resolution: string;
  intent: string;
  confidence: number;
  escalated: boolean;
  tool_used: string;
  citations: Record<string, unknown>[];
  prompt_injection_detected: boolean;
  injection_patterns: string[];
}

export interface HealthResponse {
  status: string;
  version: string;
  database: string;
}

export type IntentType =
  | "order_status"
  | "refund_request"
  | "account_help"
  | "password_reset"
  | "legal_issue"
  | "account_closure"
  | "out_of_scope"
  | "ambiguous"
  | "prompt_injection";

export interface ChatMessage {
  id: string;
  role: "customer" | "assistant" | "system";
  content: string;
  timestamp: string;
  agentResponse?: AgentInvokeResponse;
}
