export type KnowledgeBaseStatus = "active" | "inactive";

export type KnowledgeBaseItem = {
  category: string | null;
  content: string;
  createdAt: string;
  id: string;
  priority: number;
  status: KnowledgeBaseStatus;
  title: string;
};

export type KnowledgeBasePageData = {
  canManage: boolean;
  items: KnowledgeBaseItem[];
  loadError?: string;
};
