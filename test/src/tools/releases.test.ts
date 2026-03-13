// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, expect, it, beforeEach } from "@jest/globals";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebApi } from "azure-devops-node-api";
import { ApprovalStatus, EnvironmentStatus } from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import { configureReleaseTools } from "../../../src/tools/releases";
import { apiVersion } from "../../../src/utils.js";
import {
  mockReleaseDefinitions,
  mockReleaseDefinition,
  mockReleaseDefinitionRevisions,
  mockReleases,
  mockRelease,
  mockCreatedRelease,
  mockReleaseLogs,
  mockDeployments,
  mockApprovals,
  mockUpdatedApproval,
  mockUpdatedEnvironment,
} from "../../mocks/releases";

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

type TokenProviderMock = () => Promise<string>;
type ConnectionProviderMock = () => Promise<WebApi>;

describe("configureReleaseTools", () => {
  let server: McpServer;
  let tokenProvider: TokenProviderMock;
  let connectionProvider: ConnectionProviderMock;
  let userAgentProvider: () => string;
  let mockConnection: { getReleaseApi: jest.Mock; serverUrl: string };

  beforeEach(() => {
    server = { tool: jest.fn() } as unknown as McpServer;
    tokenProvider = jest.fn();
    userAgentProvider = () => "Jest";
    mockConnection = {
      getReleaseApi: jest.fn(),
      serverUrl: "https://dev.azure.com/test-org",
    };
    connectionProvider = jest.fn().mockResolvedValue(mockConnection);
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  describe("tool registration", () => {
    it("registers all release tools on the server", () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      expect(server.tool as jest.Mock).toHaveBeenCalledTimes(11);
    });
  });

  describe("releases_list_definitions tool", () => {
    it("should call getReleaseDefinitions with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_list_definitions");
      if (!call) throw new Error("releases_list_definitions tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        getReleaseDefinitions: jest.fn().mockResolvedValue(mockReleaseDefinitions),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        searchText: "Release",
        top: 10,
      };

      const result = await handler(params);

      expect(mockReleaseApi.getReleaseDefinitions).toHaveBeenCalledWith(
        "test-project",
        "Release",
        undefined, // expand
        undefined, // artifactType
        undefined, // artifactSourceId
        10, // top
        undefined, // continuationToken
        undefined, // queryOrder
        undefined, // path
        undefined, // isExactNameMatch
        undefined, // tagFilter
        undefined, // propertiesFilter
        undefined, // definitionIdFilter
        undefined // isDeleted
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockReleaseDefinitions, null, 2));
    });
  });

  describe("releases_get_definition tool", () => {
    it("should call getReleaseDefinition with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_get_definition");
      if (!call) throw new Error("releases_get_definition tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        getReleaseDefinition: jest.fn().mockResolvedValue(mockReleaseDefinition),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        definitionId: 1,
      };

      const result = await handler(params);

      expect(mockReleaseApi.getReleaseDefinition).toHaveBeenCalledWith("test-project", 1);
      expect(result.content[0].text).toBe(JSON.stringify(mockReleaseDefinition, null, 2));
    });
  });

  describe("releases_get_definition_revisions tool", () => {
    it("should call getReleaseDefinitionHistory with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_get_definition_revisions");
      if (!call) throw new Error("releases_get_definition_revisions tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        getReleaseDefinitionHistory: jest.fn().mockResolvedValue(mockReleaseDefinitionRevisions),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        definitionId: 1,
      };

      const result = await handler(params);

      expect(mockReleaseApi.getReleaseDefinitionHistory).toHaveBeenCalledWith("test-project", 1);
      expect(result.content[0].text).toBe(JSON.stringify(mockReleaseDefinitionRevisions, null, 2));
    });
  });

  describe("releases_list tool", () => {
    it("should call getReleases with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_list");
      if (!call) throw new Error("releases_list tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        getReleases: jest.fn().mockResolvedValue(mockReleases),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        definitionId: 1,
        top: 10,
      };

      const result = await handler(params);

      expect(mockReleaseApi.getReleases).toHaveBeenCalledWith(
        "test-project",
        1, // definitionId
        undefined, // definitionEnvironmentId
        undefined, // searchText
        undefined, // createdBy
        undefined, // statusFilter
        undefined, // environmentStatusFilter
        undefined, // minCreatedTime
        undefined, // maxCreatedTime
        undefined, // queryOrder
        10, // top
        undefined, // continuationToken
        undefined, // expand
        undefined, // artifactTypeId
        undefined, // sourceId
        undefined, // artifactVersionId
        undefined, // sourceBranchFilter
        undefined, // isDeleted
        undefined // tagFilter
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockReleases, null, 2));
    });
  });

  describe("releases_get tool", () => {
    it("should call getRelease with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_get");
      if (!call) throw new Error("releases_get tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        getRelease: jest.fn().mockResolvedValue(mockRelease),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        releaseId: 10,
      };

      const result = await handler(params);

      expect(mockReleaseApi.getRelease).toHaveBeenCalledWith(
        "test-project",
        10,
        undefined, // approvalFilters
        undefined, // propertyFilters
        undefined // expand (SingleReleaseExpands)
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockRelease, null, 2));
    });
  });

  describe("releases_create tool", () => {
    it("should call createRelease with correct metadata", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_create");
      if (!call) throw new Error("releases_create tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        createRelease: jest.fn().mockResolvedValue(mockCreatedRelease),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        definitionId: 1,
        description: "Test release",
        isDraft: true,
      };

      const result = await handler(params);

      expect(mockReleaseApi.createRelease).toHaveBeenCalledWith(
        {
          definitionId: 1,
          description: "Test release",
          isDraft: true,
          artifacts: undefined,
          variables: undefined,
        },
        "test-project"
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockCreatedRelease, null, 2));
    });
  });

  describe("releases_get_logs tool", () => {
    it("should fetch release logs using vsrm.dev.azure.com URL", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_get_logs");
      if (!call) throw new Error("releases_get_logs tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockReleaseLogs),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const params = {
        project: "test-project",
        releaseId: 10,
      };

      const result = await handler(params);

      expect(global.fetch).toHaveBeenCalledWith(`https://vsrm.dev.azure.com/test-org/test-project/_apis/release/releases/10/logs?api-version=${apiVersion}`, {
        method: "GET",
        headers: {
          "Authorization": "Bearer mock-token",
          "User-Agent": "Jest",
        },
      });
      expect(result.content[0].text).toBe(JSON.stringify(mockReleaseLogs, null, 2));
    });

    it("should handle HTTP errors correctly", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_get_logs");
      if (!call) throw new Error("releases_get_logs tool not registered");
      const [, , , handler] = call;

      (tokenProvider as jest.Mock).mockResolvedValue("mock-token");

      const mockResponse = {
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue("Release not found"),
      };
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as unknown as Response);

      const params = {
        project: "test-project",
        releaseId: 999,
      };

      await expect(handler(params)).rejects.toThrow("Failed to get release logs: 404 Release not found");
    });
  });

  describe("releases_list_deployments tool", () => {
    it("should call getDeployments with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_list_deployments");
      if (!call) throw new Error("releases_list_deployments tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        getDeployments: jest.fn().mockResolvedValue(mockDeployments),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        definitionId: 1,
        top: 10,
      };

      const result = await handler(params);

      expect(mockReleaseApi.getDeployments).toHaveBeenCalledWith(
        "test-project",
        1, // definitionId
        undefined, // definitionEnvironmentId
        undefined, // createdBy
        undefined, // minModifiedTime
        undefined, // maxModifiedTime
        undefined, // deploymentStatus
        undefined, // operationStatus
        undefined, // latestAttemptsOnly
        undefined, // queryOrder
        10, // top
        undefined, // continuationToken
        undefined, // createdFor
        undefined, // minStartedTime
        undefined, // maxStartedTime
        undefined // sourceBranch
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockDeployments, null, 2));
    });
  });

  describe("releases_list_approvals tool", () => {
    it("should call getApprovals with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_list_approvals");
      if (!call) throw new Error("releases_list_approvals tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        getApprovals: jest.fn().mockResolvedValue(mockApprovals),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        releaseIdsFilter: [10],
      };

      const result = await handler(params);

      expect(mockReleaseApi.getApprovals).toHaveBeenCalledWith(
        "test-project",
        undefined, // assignedToFilter
        undefined, // statusFilter
        [10], // releaseIdsFilter
        undefined, // typeFilter
        undefined, // top
        undefined, // continuationToken
        undefined, // queryOrder
        undefined // includeMyGroupApprovals
      );
      expect(result.content[0].text).toBe(JSON.stringify(mockApprovals, null, 2));
    });
  });

  describe("releases_update_approval tool", () => {
    it("should call updateReleaseApproval with mapped status", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_update_approval");
      if (!call) throw new Error("releases_update_approval tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        updateReleaseApproval: jest.fn().mockResolvedValue(mockUpdatedApproval),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        approvalId: 100,
        status: "approved",
        comments: "Looks good",
      };

      const result = await handler(params);

      expect(mockReleaseApi.updateReleaseApproval).toHaveBeenCalledWith({ status: ApprovalStatus.Approved, comments: "Looks good" }, "test-project", 100);
      expect(result.content[0].text).toBe(JSON.stringify(mockUpdatedApproval, null, 2));
    });

    it("should map rejected status correctly", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_update_approval");
      if (!call) throw new Error("releases_update_approval tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        updateReleaseApproval: jest.fn().mockResolvedValue({ ...mockUpdatedApproval, status: "rejected" }),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        approvalId: 100,
        status: "rejected",
        comments: "Not ready",
      };

      await handler(params);

      expect(mockReleaseApi.updateReleaseApproval).toHaveBeenCalledWith({ status: ApprovalStatus.Rejected, comments: "Not ready" }, "test-project", 100);
    });
  });

  describe("releases_update_environment tool", () => {
    it("should call updateReleaseEnvironment with correct parameters", async () => {
      configureReleaseTools(server, tokenProvider, connectionProvider, userAgentProvider);
      const call = (server.tool as jest.Mock).mock.calls.find(([toolName]) => toolName === "releases_update_environment");
      if (!call) throw new Error("releases_update_environment tool not registered");
      const [, , , handler] = call;

      const mockReleaseApi = {
        updateReleaseEnvironment: jest.fn().mockResolvedValue(mockUpdatedEnvironment),
      };
      mockConnection.getReleaseApi.mockResolvedValue(mockReleaseApi);

      const params = {
        project: "test-project",
        releaseId: 10,
        environmentId: 1,
        status: "InProgress",
        comment: "Starting deployment",
      };

      const result = await handler(params);

      expect(mockReleaseApi.updateReleaseEnvironment).toHaveBeenCalledWith({ status: EnvironmentStatus.InProgress, comment: "Starting deployment" }, "test-project", 10, 1);
      expect(result.content[0].text).toBe(JSON.stringify(mockUpdatedEnvironment, null, 2));
    });
  });
});
