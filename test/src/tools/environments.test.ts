// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it, beforeEach } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { configureEnvironmentTools } from "../../../src/tools/environments";
import { apiVersion } from "../../../src/utils.js";
import { mockEnvironments, mockEnvironment, mockCreatedEnvironment, mockUpdatedEnvironment, mockDeploymentRecords } from "../../mocks/environments";

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
});
