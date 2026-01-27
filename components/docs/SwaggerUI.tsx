/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 61: SWAGGER UI COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Interactive API documentation using custom Swagger-like UI
 */

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OpenAPIPath {
  [method: string]: {
    tags?: string[];
    summary?: string;
    description?: string;
    operationId?: string;
    parameters?: Array<{
      name: string;
      in: string;
      schema?: { type: string; default?: unknown; enum?: string[] };
      description?: string;
      required?: boolean;
    }>;
    requestBody?: {
      required?: boolean;
      content?: {
        'application/json'?: {
          schema?: { $ref?: string; type?: string };
        };
      };
    };
    responses?: {
      [code: string]: {
        description?: string;
        content?: {
          'application/json'?: {
            schema?: { $ref?: string };
          };
        };
        $ref?: string;
      };
    };
    security?: Array<Record<string, string[]>>;
  };
}

interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string; description: string }>;
  tags: Array<{ name: string; description: string }>;
  paths: Record<string, OpenAPIPath>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
    responses: Record<string, unknown>;
  };
}

interface EndpointInfo {
  path: string;
  method: string;
  details: OpenAPIPath[string];
}

export default function SwaggerUI() {
  const [schema, setSchema] = useState<OpenAPISchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch('/api/docs/openapi');
        if (!response.ok) throw new Error('Failed to fetch OpenAPI schema');
        const data = await response.json();
        setSchema(data);
        if (data.tags && data.tags.length > 0) {
          setActiveTag(data.tags[0].name);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white text-xl">Loading API Documentation...</div>
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error || 'Failed to load schema'}</div>
      </div>
    );
  }

  // Group endpoints by tag
  const endpointsByTag: Record<string, EndpointInfo[]> = {};
  Object.entries(schema.paths).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, details]) => {
      const tags = details.tags || ['Other'];
      tags.forEach((tag) => {
        if (!endpointsByTag[tag]) endpointsByTag[tag] = [];
        endpointsByTag[tag].push({ path, method, details });
      });
    });
  });

  // Filter endpoints based on search
  const filterEndpoints = (endpoints: EndpointInfo[]) => {
    if (!searchQuery) return endpoints;
    const query = searchQuery.toLowerCase();
    return endpoints.filter(
      (ep) =>
        ep.path.toLowerCase().includes(query) ||
        ep.details.summary?.toLowerCase().includes(query) ||
        ep.details.description?.toLowerCase().includes(query)
    );
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'get':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'post':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'put':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'patch':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'delete':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusColor = (code: string) => {
    if (code.startsWith('2')) return 'text-green-400';
    if (code.startsWith('4')) return 'text-yellow-400';
    if (code.startsWith('5')) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#111]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{schema.info.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded">
                  v{schema.info.version}
                </span>
                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-sm rounded">
                  OpenAPI 3.1
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/api/docs/openapi"
                target="_blank"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
              >
                Download JSON
              </a>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 bg-[#0A0A0A] border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* Sidebar - Tags */}
        <div className="w-64 flex-shrink-0">
          <div className="sticky top-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">CATEGORIES</h3>
            <nav className="space-y-1">
              {schema.tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => setActiveTag(tag.name)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTag === tag.name
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <div className="font-medium">{tag.name}</div>
                  <div className="text-xs opacity-70">
                    {endpointsByTag[tag.name]?.length || 0} endpoints
                  </div>
                </button>
              ))}
            </nav>

            {/* Server Info */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">SERVERS</h3>
              <div className="space-y-2">
                {schema.servers.map((server, i) => (
                  <div key={i} className="text-xs">
                    <div className="text-gray-300 font-mono truncate">{server.url}</div>
                    <div className="text-gray-500">{server.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Endpoints */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTag && endpointsByTag[activeTag] && (
              <motion.div
                key={activeTag}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">{activeTag}</h2>
                  <p className="text-gray-400 mt-1">
                    {schema.tags.find((t) => t.name === activeTag)?.description}
                  </p>
                </div>

                {filterEndpoints(endpointsByTag[activeTag]).map((endpoint) => {
                  const key = `${endpoint.method}-${endpoint.path}`;
                  const isExpanded = expandedEndpoint === key;

                  return (
                    <div
                      key={key}
                      className="border border-gray-800 rounded-xl overflow-hidden bg-[#111]"
                    >
                      {/* Endpoint Header */}
                      <button
                        onClick={() => setExpandedEndpoint(isExpanded ? null : key)}
                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-gray-800/50 transition-colors"
                      >
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold uppercase border ${getMethodColor(
                            endpoint.method
                          )}`}
                        >
                          {endpoint.method}
                        </span>
                        <span className="font-mono text-sm text-gray-300">{endpoint.path}</span>
                        <span className="flex-1 text-left text-sm text-gray-400 truncate">
                          {endpoint.details.summary}
                        </span>
                        {endpoint.details.security && (
                          <span className="text-xs text-yellow-500">🔐</span>
                        )}
                        <span className="text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                      </button>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-800"
                          >
                            <div className="p-4 space-y-4">
                              {/* Description */}
                              {endpoint.details.description && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-400 mb-1">
                                    Description
                                  </h4>
                                  <p className="text-sm text-gray-300">
                                    {endpoint.details.description}
                                  </p>
                                </div>
                              )}

                              {/* Parameters */}
                              {endpoint.details.parameters &&
                                endpoint.details.parameters.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-400 mb-2">
                                      Parameters
                                    </h4>
                                    <div className="space-y-2">
                                      {endpoint.details.parameters.map((param, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center gap-3 text-sm bg-gray-800/50 rounded px-3 py-2"
                                        >
                                          <span className="font-mono text-blue-400">
                                            {param.name}
                                          </span>
                                          <span className="text-xs text-gray-500">{param.in}</span>
                                          <span className="text-xs text-gray-500">
                                            {param.schema?.type}
                                          </span>
                                          {param.required && (
                                            <span className="text-xs text-red-400">required</span>
                                          )}
                                          {param.description && (
                                            <span className="text-gray-400 flex-1 text-right truncate">
                                              {param.description}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Request Body */}
                              {endpoint.details.requestBody && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                                    Request Body
                                    {endpoint.details.requestBody.required && (
                                      <span className="text-red-400 ml-2 text-xs">required</span>
                                    )}
                                  </h4>
                                  <div className="bg-gray-800/50 rounded p-3 text-sm font-mono">
                                    {endpoint.details.requestBody.content?.['application/json']
                                      ?.schema?.$ref || 'application/json'}
                                  </div>
                                </div>
                              )}

                              {/* Responses */}
                              {endpoint.details.responses && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                                    Responses
                                  </h4>
                                  <div className="space-y-2">
                                    {Object.entries(endpoint.details.responses).map(
                                      ([code, response]) => (
                                        <div
                                          key={code}
                                          className="flex items-center gap-3 text-sm bg-gray-800/50 rounded px-3 py-2"
                                        >
                                          <span className={`font-bold ${getStatusColor(code)}`}>
                                            {code}
                                          </span>
                                          <span className="text-gray-400">
                                            {response.description || response.$ref?.split('/').pop()}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Security */}
                              {endpoint.details.security && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                                    Security
                                  </h4>
                                  <div className="flex gap-2">
                                    {endpoint.details.security.map((sec, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded"
                                      >
                                        {Object.keys(sec).join(', ')}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
