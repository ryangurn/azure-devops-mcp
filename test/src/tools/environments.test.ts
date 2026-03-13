// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it, beforeEach } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { configureEnvironmentTools } from "../../../src/tools/environments";
import { apiVersion } from "../../../src/utils.js";
import {
  mockEnvironments,
  mockEnvironment,
  mockCreatedEnvironment,
  mockUpdatedEnvironment,
  mockDeploymentRecords,
  mockKubernetesResource,
  mockVirtualMachineGroup,
  mockUpdatedVirtualMachineGroup,
} from "../../mocks/environments";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

type TokenProviderMock = () => Promise<string>;
type ConnectionProviderMock = () => Promise<WebApi>;

describe("configureEnvironmentTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let userAgentProvider: () => string;
  let mockConnection: { getTaskAgentApi: jest.Mock; serverUrl: string };

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    userAgentProvider = () => "Jest";
    mockConnection = {
      getTaskAgentApi: jest.fn(),
      serverUrl: "https://dev.azure.com/test-org",
    };
    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe("tool registration", () => {
    it("registers environment tools on the server", () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalled();
    });
  });

  describe("environments_list tool", () => {
    it("should call getEnvironments with correct parameters and return expected result", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_list");
      if (!call) throw new Error("environments_list tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        getEnvironments: jest.fn().mockResolvedValue(mockEnvironments),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        name: "Development",
        top: 10,
      };

      const result = await handler(params);

      expect(mockTaskAgentApi.getEnvironments).toHaveBeenCalledWith(
        "test-project",
        "Development",
        undefined, // continuationToken
        10 // top
      );

      expect(result.content[0].text).toBe(JSON.stringify(mockEnvironments, null, 2));
    });

    it("should handle API errors for environments_list", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_list");
      if (!call) throw new Error("environments_list tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        getEnvironments: jest.fn().mockRejectedValue(new Error("API Error")),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = { project: "test-project" };

      await expect(handler(params)).rejects.toThrow("API Error");
    });
  });

  describe("environments_get tool", () => {
    it("should call getEnvironmentById with correct parameters and return expected result", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get");
      if (!call) throw new Error("environments_get tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        getEnvironmentById: jest.fn().mockResolvedValue(mockEnvironment),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        environmentId: 1,
      };

      const result = await handler(params);

      expect(mockTaskAgentApi.getEnvironmentById).toHaveBeenCalledWith(
        "test-project",
        1,
        undefined // expands
      );

      expect(result.content[0].text).toBe(JSON.stringify(mockEnvironment, null, 2));
    });

    it("should handle API errors for environments_get", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get");
      if (!call) throw new Error("environments_get tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        getEnvironmentById: jest.fn().mockRejectedValue(new Error("Environment not found")),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        environmentId: 999,
      };

      await expect(handler(params)).rejects.toThrow("Environment not found");
    });
  });

  describe("environments_create tool", () => {
    it("should call addEnvironment with correct parameters and return expected result", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_create");
      if (!call) throw new Error("environments_create tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        addEnvironment: jest.fn().mockResolvedValue(mockCreatedEnvironment),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        name: "Staging",
        description: "Staging environment",
      };

      const result = await handler(params);

      expect(mockTaskAgentApi.addEnvironment).toHaveBeenCalledWith({ name: "Staging", description: "Staging environment" }, "test-project");

      expect(result.content[0].text).toBe(JSON.stringify(mockCreatedEnvironment, null, 2));
    });

    it("should handle API errors for environments_create", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_create");
      if (!call) throw new Error("environments_create tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        addEnvironment: jest.fn().mockRejectedValue(new Error("Failed to create environment")),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        name: "Staging",
      };

      await expect(handler(params)).rejects.toThrow("Failed to create environment");
    });
  });

  describe("environments_update tool", () => {
    it("should call updateEnvironment with correct parameters and return expected result", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_update");
      if (!call) throw new Error("environments_update tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        updateEnvironment: jest.fn().mockResolvedValue(mockUpdatedEnvironment),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        environmentId: 1,
        name: "Dev Updated",
        description: "Updated description",
      };

      const result = await handler(params);

      expect(mockTaskAgentApi.updateEnvironment).toHaveBeenCalledWith({ name: "Dev Updated", description: "Updated description" }, "test-project", 1);

      expect(result.content[0].text).toBe(JSON.stringify(mockUpdatedEnvironment, null, 2));
    });

    it("should handle API errors for environments_update", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_update");
      if (!call) throw new Error("environments_update tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        updateEnvironment: jest.fn().mockRejectedValue(new Error("Failed to update environment")),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        environmentId: 999,
        name: "Updated",
      };

      await expect(handler(params)).rejects.toThrow("Failed to update environment");
    });
  });

  describe("environments_delete tool", () => {
    it("should call deleteEnvironment with correct parameters", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_delete");
      if (!call) throw new Error("environments_delete tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        deleteEnvironment: jest.fn().mockResolvedValue(undefined),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        environmentId: 1,
      };

      const result = await handler(params);

      expect(mockTaskAgentApi.deleteEnvironment).toHaveBeenCalledWith("test-project", 1);
      expect(result.content[0].text).toBe(JSON.stringify({ success: true, message: "Environment 1 deleted successfully" }, null, 2));
    });

    it("should handle API errors for environments_delete", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_delete");
      if (!call) throw new Error("environments_delete tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        deleteEnvironment: jest.fn().mockRejectedValue(new Error("Failed to delete environment")),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        environmentId: 999,
      };

      await expect(handler(params)).rejects.toThrow("Failed to delete environment");
    });
  });

  describe("environments_get_deployment_records tool", () => {
    it("should fetch deployment records with correct URL and headers", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get_deployment_records");
      if (!call) throw new Error("environments_get_deployment_records tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockDeploymentRecords),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const params = {
        project: "test-project",
        environmentId: 1,
        top: 10,
      };

      const result = await handler(params);

      expect(global.fetch).toHaveBeenCalledWith(`https://dev.azure.com/test-org/test-project/_apis/distributedtask/environments/1/environmentdeploymentrecords?api-version=${apiVersion}&top=10`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mock-token",
          "User-Agent": "Jest",
        },
      });

      expect(result.content[0].text).toBe(JSON.stringify(mockDeploymentRecords, null, 2));
    });

    it("should handle HTTP errors correctly", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get_deployment_records");
      if (!call) throw new Error("environments_get_deployment_records tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");

      const mockResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue("Environment not found"),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const params = {
        project: "test-project",
        environmentId: 999,
      };

      await expect(handler(params)).rejects.toThrow("Failed to get deployment records: 404 Environment not found");

      expect(global.fetch).toHaveBeenCalledWith(`https://dev.azure.com/test-org/test-project/_apis/distributedtask/environments/999/environmentdeploymentrecords?api-version=${apiVersion}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mock-token",
          "User-Agent": "Jest",
        },
      });
    });

    it("should handle network errors correctly", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get_deployment_records");
      if (!call) throw new Error("environments_get_deployment_records tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");

      const networkError = new Error("Network connection failed");
      (global.fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(networkError);

      const params = {
        project: "test-project",
        environmentId: 1,
      };

      await expect(handler(params)).rejects.toThrow("Network connection failed");
    });

    it("should handle token provider errors correctly", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get_deployment_records");
      if (!call) throw new Error("environments_get_deployment_records tool not registered");
      const [, , , handler] = call;

      const tokenError = new Error("Failed to get access token");
      (tokenProvider as jest.Mock).mockRejectedValue(tokenError);

      const params = {
        project: "test-project",
        environmentId: 1,
      };

      await expect(handler(params)).rejects.toThrow("Failed to get access token");

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("environments_get_kubernetes_resource tool", () => {
    it("should call getKubernetesResource with correct parameters", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get_kubernetes_resource");
      if (!call) throw new Error("environments_get_kubernetes_resource tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        getKubernetesResource: jest.fn().mockResolvedValue(mockKubernetesResource),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const result = await handler({ project: "test-project", environmentId: 1, resourceId: 10 });

      expect(mockTaskAgentApi.getKubernetesResource).toHaveBeenCalledWith("test-project", 1, 10);
      expect(result.content[0].text).toBe(JSON.stringify(mockKubernetesResource, null, 2));
    });
  });

  describe("environments_add_kubernetes_resource tool", () => {
    it("should call addKubernetesResource with correct parameters", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_add_kubernetes_resource");
      if (!call) throw new Error("environments_add_kubernetes_resource tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        addKubernetesResource: jest.fn().mockResolvedValue(mockKubernetesResource),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const params = {
        project: "test-project",
        environmentId: 1,
        name: "k8s-dev",
        clusterName: "dev-cluster",
        namespace: "default",
        serviceEndpointId: "endpoint-1",
        tags: ["dev", "kubernetes"],
      };

      const result = await handler(params);

      expect(mockTaskAgentApi.addKubernetesResource).toHaveBeenCalledWith(
        { name: "k8s-dev", clusterName: "dev-cluster", namespace: "default", tags: ["dev", "kubernetes"], serviceEndpointId: "endpoint-1" },
        "test-project",
        1
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockKubernetesResource, null, 2));
    });
  });

  describe("environments_delete_kubernetes_resource tool", () => {
    it("should call deleteKubernetesResource with correct parameters", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_delete_kubernetes_resource");
      if (!call) throw new Error("environments_delete_kubernetes_resource tool not registered");
      const [, , , handler] = call;

      const mockTaskAgentApi = {
        deleteKubernetesResource: jest.fn().mockResolvedValue(undefined),
      };
      mockConnection.getTaskAgentApi.mockResolvedValue(mockTaskAgentApi);

      const result = await handler({ project: "test-project", environmentId: 1, resourceId: 10 });

      expect(mockTaskAgentApi.deleteKubernetesResource).toHaveBeenCalledWith("test-project", 1, 10);
      expect(result.content[0].text).toBe(JSON.stringify({ success: true, message: "Kubernetes resource 10 deleted successfully" }, null, 2));
    });
  });

  describe("environments_get_vm_resource tool", () => {
    it("should fetch VM resource group via REST with correct URL", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_get_vm_resource");
      if (!call) throw new Error("environments_get_vm_resource tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockVirtualMachineGroup),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const result = await handler({ project: "test-project", environmentId: 1, resourceId: 20 });

      expect(global.fetch).toHaveBeenCalledWith(`https://dev.azure.com/test-org/test-project/_apis/distributedtask/environments/1/providers/virtualmachinegroups/20?api-version=${apiVersion}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
          "User-Agent": "Jest",
        },
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockVirtualMachineGroup, null, 2));
    });
  });

  describe("environments_add_vm_resource tool", () => {
    it("should create VM resource group via REST with correct URL and body", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_add_vm_resource");
      if (!call) throw new Error("environments_add_vm_resource tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockVirtualMachineGroup),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const result = await handler({ project: "test-project", environmentId: 1, name: "vm-pool-dev" });

      expect(global.fetch).toHaveBeenCalledWith(`https://dev.azure.com/test-org/test-project/_apis/distributedtask/environments/1/providers/virtualmachinegroups?api-version=${apiVersion}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mock-token",
          "User-Agent": "Jest",
        },
        body: JSON.stringify({ name: "vm-pool-dev" }),
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockVirtualMachineGroup, null, 2));
    });
  });

  describe("environments_update_vm_resource tool", () => {
    it("should update resource tags via Contribution HierarchyQuery API", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_update_vm_resource");
      if (!call) throw new Error("environments_update_vm_resource tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");
      const contributionResponse = {
        dataProviders: {
          "ms.vss-environments-web.environment-resources-tag-update-data-provider": mockUpdatedVirtualMachineGroup,
        },
      };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(contributionResponse),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const params = {
        project: "test-project",
        environmentId: 1,
        resourceId: 20,
        tags: ["staging", "vm"],
      };

      const result = await handler(params);

      expect(global.fetch).toHaveBeenCalledWith("https://dev.azure.com/test-org/_apis/Contribution/HierarchyQuery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json;api-version=5.0-preview.1;excludeUrls=true;enumsAsNumbers=true;msDateFormat=true;noArrayWrap=true",
          "Authorization": "Bearer mock-token",
          "User-Agent": "Jest",
        },
        body: JSON.stringify({
          contributionIds: ["ms.vss-environments-web.environment-resources-tag-update-data-provider"],
          dataProviderContext: {
            properties: {
              resourceId: "20",
              resourceType: "2",
              newTagsSet: ["staging", "vm"],
              sourcePage: {
                url: "https://dev.azure.com/test-org/test-project/_environments/1?view=resources",
                routeId: "ms.vss-environments-web.environments-route-with-id",
                routeValues: {
                  project: "test-project",
                  environmentId: "1",
                  viewname: "environment",
                  controller: "ContributedPage",
                  action: "Execute",
                },
              },
            },
          },
        }),
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockUpdatedVirtualMachineGroup, null, 2));
    });

    it("should handle HTTP errors correctly", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_update_vm_resource");
      if (!call) throw new Error("environments_update_vm_resource tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Internal Server Error"),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      await expect(handler({ project: "test-project", environmentId: 1, resourceId: 20, tags: ["test"] })).rejects.toThrow("Failed to update resource tags: 500 Internal Server Error");
    });
  });

  describe("environments_delete_vm_resource tool", () => {
    it("should delete VM resource group via REST with correct URL", async () => {
      configureEnvironmentTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "environments_delete_vm_resource");
      if (!call) throw new Error("environments_delete_vm_resource tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");
      const mockResponse = { ok: true };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const result = await handler({ project: "test-project", environmentId: 1, resourceId: 20 });

      expect(global.fetch).toHaveBeenCalledWith(`https://dev.azure.com/test-org/test-project/_apis/distributedtask/environments/1/providers/virtualmachinegroups/20?api-version=${apiVersion}`, {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer mock-token",
          "User-Agent": "Jest",
        },
      });
      expect(result.content[0].text).toBe(JSON.stringify({ success: true, message: "Virtual machine resource group 20 deleted successfully" }, null, 2));
    });
  });
});
