// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiVersion, getEnumKeys, safeEnumConvert } from "../utils.js";
import { WebApi } from "azure-devops-node-api";
import {
  ReleaseDefinitionExpands,
  ReleaseDefinitionQueryOrder,
  ReleaseStatus,
  ReleaseQueryOrder,
  ReleaseExpands,
  SingleReleaseExpands,
  ApprovalStatus,
  ApprovalType,
  DeploymentStatus,
  EnvironmentStatus,
} from "azure-devops-node-api/interfaces/ReleaseInterfaces.js";
import { z } from "zod";

const RELEASE_TOOLS = {
  releases_list_definitions: "releases_list_definitions",
  releases_get_definition: "releases_get_definition",
  releases_get_definition_revisions: "releases_get_definition_revisions",
  releases_list: "releases_list",
  releases_get: "releases_get",
  releases_create: "releases_create",
  releases_get_logs: "releases_get_logs",
  releases_list_deployments: "releases_list_deployments",
  releases_list_approvals: "releases_list_approvals",
  releases_update_approval: "releases_update_approval",
  releases_update_environment: "releases_update_environment",
};

function configureReleaseTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>, userAgentProvider: () => string) {
  server.tool(
    RELEASE_TOOLS.releases_list_definitions,
    "Retrieves a list of release definitions for a given project.",
    {
      project: z.string().describe("Project ID or name to get release definitions for"),
      searchText: z.string().optional().describe("Text to search for in release definition names"),
      expand: z
        .enum(getEnumKeys(ReleaseDefinitionExpands) as [string, ...string[]])
        .optional()
        .describe("Expand options for the release definition"),
      top: z.number().optional().describe("Maximum number of release definitions to return"),
      continuationToken: z.string().optional().describe("Token for continuing paged results"),
      queryOrder: z
        .enum(getEnumKeys(ReleaseDefinitionQueryOrder) as [string, ...string[]])
        .optional()
        .describe("Order in which release definitions are returned"),
      path: z.string().optional().describe("Path of the release definition to filter"),
      isExactNameMatch: z.boolean().optional().describe("Whether to match the search text exactly"),
      isDeleted: z.boolean().optional().describe("Whether to include deleted definitions"),
    },
    async ({ project, searchText, expand, top, continuationToken, queryOrder, path, isExactNameMatch, isDeleted }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const definitions = await releaseApi.getReleaseDefinitions(
        project,
        searchText,
        safeEnumConvert(ReleaseDefinitionExpands, expand),
        undefined,
        undefined,
        top,
        continuationToken,
        safeEnumConvert(ReleaseDefinitionQueryOrder, queryOrder),
        path,
        isExactNameMatch,
        undefined,
        undefined,
        undefined,
        isDeleted
      );

      return {
        content: [{ type: "text", text: JSON.stringify(definitions, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_get_definition,
    "Retrieves a specific release definition by ID.",
    {
      project: z.string().describe("Project ID or name to get the release definition for"),
      definitionId: z.number().describe("ID of the release definition to retrieve"),
    },
    async ({ project, definitionId }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const definition = await releaseApi.getReleaseDefinition(project, definitionId);

      return {
        content: [{ type: "text", text: JSON.stringify(definition, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_get_definition_revisions,
    "Retrieves the revision history of a specific release definition.",
    {
      project: z.string().describe("Project ID or name to get the release definition revisions for"),
      definitionId: z.number().describe("ID of the release definition to get revisions for"),
    },
    async ({ project, definitionId }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const revisions = await releaseApi.getReleaseDefinitionHistory(project, definitionId);

      return {
        content: [{ type: "text", text: JSON.stringify(revisions, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_list,
    "Retrieves a list of releases for a given project.",
    {
      project: z.string().describe("Project ID or name to get releases for"),
      definitionId: z.number().optional().describe("Release definition ID to filter releases"),
      searchText: z.string().optional().describe("Text to search for in release names"),
      statusFilter: z
        .enum(getEnumKeys(ReleaseStatus) as [string, ...string[]])
        .optional()
        .describe("Status filter for releases"),
      queryOrder: z
        .enum(getEnumKeys(ReleaseQueryOrder) as [string, ...string[]])
        .optional()
        .describe("Order in which releases are returned"),
      top: z.number().optional().describe("Maximum number of releases to return"),
      continuationToken: z.number().optional().describe("Continuation token for paged results"),
      expand: z
        .enum(getEnumKeys(ReleaseExpands) as [string, ...string[]])
        .optional()
        .describe("Expand options for releases"),
      minCreatedTime: z.coerce.date().optional().describe("Minimum created time to filter releases"),
      maxCreatedTime: z.coerce.date().optional().describe("Maximum created time to filter releases"),
      sourceBranchFilter: z.string().optional().describe("Source branch to filter releases"),
      tagFilter: z.array(z.string()).optional().describe("Tags to filter releases"),
    },
    async ({ project, definitionId, searchText, statusFilter, queryOrder, top, continuationToken, expand, minCreatedTime, maxCreatedTime, sourceBranchFilter, tagFilter }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const releases = await releaseApi.getReleases(
        project,
        definitionId,
        undefined,
        searchText,
        undefined,
        safeEnumConvert(ReleaseStatus, statusFilter),
        undefined,
        minCreatedTime,
        maxCreatedTime,
        safeEnumConvert(ReleaseQueryOrder, queryOrder),
        top,
        continuationToken,
        safeEnumConvert(ReleaseExpands, expand),
        undefined,
        undefined,
        undefined,
        sourceBranchFilter,
        undefined,
        tagFilter
      );

      return {
        content: [{ type: "text", text: JSON.stringify(releases, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_get,
    "Retrieves a specific release by ID.",
    {
      project: z.string().describe("Project ID or name to get the release for"),
      releaseId: z.number().describe("ID of the release to retrieve"),
      expand: z
        .enum(getEnumKeys(SingleReleaseExpands) as [string, ...string[]])
        .optional()
        .describe("Expand options for the release"),
    },
    async ({ project, releaseId, expand }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const release = await releaseApi.getRelease(project, releaseId, undefined, undefined, safeEnumConvert(SingleReleaseExpands, expand));

      return {
        content: [{ type: "text", text: JSON.stringify(release, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_create,
    "Creates a new release.",
    {
      project: z.string().describe("Project ID or name to create the release in"),
      definitionId: z.number().describe("ID of the release definition to create a release for"),
      description: z.string().optional().describe("Description of the release"),
      isDraft: z.boolean().optional().describe("Whether the release is a draft"),
      artifacts: z
        .array(
          z.object({
            alias: z.string().describe("Alias of the artifact"),
            instanceReference: z.object({
              id: z.string().describe("ID of the artifact instance"),
              name: z.string().optional().describe("Name of the artifact instance"),
            }),
          })
        )
        .optional()
        .describe("Artifacts to include in the release"),
      variables: z
        .record(
          z.string(),
          z.object({
            value: z.string().optional(),
            isSecret: z.boolean().optional(),
          })
        )
        .optional()
        .describe("Variables for the release"),
    },
    async ({ project, definitionId, description, isDraft, artifacts, variables }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const releaseStartMetadata: any = {
        definitionId: definitionId,
        description: description,
        isDraft: isDraft,
        artifacts: artifacts,
        variables: variables,
      };
      const release = await releaseApi.createRelease(releaseStartMetadata, project);

      return {
        content: [{ type: "text", text: JSON.stringify(release, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_get_logs,
    "Retrieves logs for a specific release.",
    {
      project: z.string().describe("Project ID or name to get release logs for"),
      releaseId: z.number().describe("ID of the release to get logs for"),
    },
    async ({ project, releaseId }) => {
      const connection = await connectionProvider();
      const orgUrl = connection.serverUrl;
      const vsrmUrl = orgUrl.replace("dev.azure.com", "vsrm.dev.azure.com");
      const endpoint = `${vsrmUrl}/${project}/_apis/release/releases/${releaseId}/logs?api-version=${apiVersion}`;
      const token = await tokenProvider();

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": userAgentProvider(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get release logs: ${response.status} ${errorText}`);
      }

      const logs = await response.json();

      return {
        content: [{ type: "text", text: JSON.stringify(logs, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_list_deployments,
    "Retrieves a list of deployments for a given project.",
    {
      project: z.string().describe("Project ID or name to get deployments for"),
      definitionId: z.number().optional().describe("Release definition ID to filter deployments"),
      deploymentStatus: z
        .enum(getEnumKeys(DeploymentStatus) as [string, ...string[]])
        .optional()
        .describe("Deployment status to filter"),
      top: z.number().optional().describe("Maximum number of deployments to return"),
      continuationToken: z.number().optional().describe("Token for continuing paged results"),
      queryOrder: z
        .enum(getEnumKeys(ReleaseQueryOrder) as [string, ...string[]])
        .optional()
        .describe("Order in which deployments are returned"),
      latestAttemptsOnly: z.boolean().optional().describe("Whether to return only the latest attempts"),
      minStartedTime: z.coerce.date().optional().describe("Minimum started time to filter deployments"),
      maxStartedTime: z.coerce.date().optional().describe("Maximum started time to filter deployments"),
      sourceBranch: z.string().optional().describe("Source branch to filter deployments"),
    },
    async ({ project, definitionId, deploymentStatus, top, continuationToken, queryOrder, latestAttemptsOnly, minStartedTime, maxStartedTime, sourceBranch }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const deployments = await releaseApi.getDeployments(
        project,
        definitionId,
        undefined,
        undefined,
        undefined,
        undefined,
        safeEnumConvert(DeploymentStatus, deploymentStatus),
        undefined,
        latestAttemptsOnly,
        safeEnumConvert(ReleaseQueryOrder, queryOrder),
        top,
        continuationToken,
        undefined,
        minStartedTime,
        maxStartedTime,
        sourceBranch
      );

      return {
        content: [{ type: "text", text: JSON.stringify(deployments, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_list_approvals,
    "Retrieves a list of approvals for a given project.",
    {
      project: z.string().describe("Project ID or name to get approvals for"),
      assignedToFilter: z.string().optional().describe("Filter approvals assigned to a specific user"),
      statusFilter: z
        .enum(getEnumKeys(ApprovalStatus) as [string, ...string[]])
        .optional()
        .describe("Approval status to filter"),
      releaseIdsFilter: z.array(z.number()).optional().describe("Array of release IDs to filter approvals"),
      typeFilter: z
        .enum(getEnumKeys(ApprovalType) as [string, ...string[]])
        .optional()
        .describe("Approval type to filter"),
      top: z.number().optional().describe("Maximum number of approvals to return"),
      continuationToken: z.number().optional().describe("Token for continuing paged results"),
      includeMyGroupApprovals: z.boolean().optional().describe("Whether to include approvals for groups the user belongs to"),
    },
    async ({ project, assignedToFilter, statusFilter, releaseIdsFilter, typeFilter, top, continuationToken, includeMyGroupApprovals }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const approvals = await releaseApi.getApprovals(
        project,
        assignedToFilter,
        safeEnumConvert(ApprovalStatus, statusFilter),
        releaseIdsFilter,
        safeEnumConvert(ApprovalType, typeFilter),
        top,
        continuationToken,
        undefined,
        includeMyGroupApprovals
      );

      return {
        content: [{ type: "text", text: JSON.stringify(approvals, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_update_approval,
    "Updates a release approval.",
    {
      project: z.string().describe("Project ID or name"),
      approvalId: z.number().describe("ID of the approval to update"),
      status: z.enum(["approved", "rejected"]).describe("New status for the approval"),
      comments: z.string().optional().describe("Comments for the approval"),
    },
    async ({ project, approvalId, status, comments }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const mappedStatus = status === "approved" ? ApprovalStatus.Approved : ApprovalStatus.Rejected;
      const updatedApproval = await releaseApi.updateReleaseApproval({ status: mappedStatus, comments }, project, approvalId);

      return {
        content: [{ type: "text", text: JSON.stringify(updatedApproval, null, 2) }],
      };
    }
  );

  server.tool(
    RELEASE_TOOLS.releases_update_environment,
    "Updates the status of a release environment.",
    {
      project: z.string().describe("Project ID or name"),
      releaseId: z.number().describe("ID of the release"),
      environmentId: z.number().describe("ID of the environment to update"),
      status: z.enum(getEnumKeys(EnvironmentStatus) as [string, ...string[]]).describe("New status for the environment"),
      comment: z.string().optional().describe("Comment for the environment update"),
    },
    async ({ project, releaseId, environmentId, status, comment }) => {
      const connection = await connectionProvider();
      const releaseApi = await connection.getReleaseApi();
      const updatedEnvironment = await releaseApi.updateReleaseEnvironment({ status: safeEnumConvert(EnvironmentStatus, status), comment }, project, releaseId, environmentId);

      return {
        content: [{ type: "text", text: JSON.stringify(updatedEnvironment, null, 2) }],
      };
    }
  );
}

export { RELEASE_TOOLS, configureReleaseTools };
