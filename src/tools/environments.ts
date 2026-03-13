// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiVersion, getEnumKeys, safeEnumConvert } from "../utils.js";
import { WebApi } from "azure-devops-node-api";
import { EnvironmentExpands } from "azure-devops-node-api/interfaces/TaskAgentInterfaces.js";
import { z } from "zod";

const ENVIRONMENT_TOOLS = {
  environments_list: "environments_list",
  environments_get: "environments_get",
  environments_create: "environments_create",
  environments_update: "environments_update",
  environments_delete: "environments_delete",
  environments_get_deployment_records: "environments_get_deployment_records",
};

function configureEnvironmentTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>, userAgentProvider: () => string) {
  server.tool(
    ENVIRONMENT_TOOLS.environments_list,
    "Retrieves a list of environments for a given project.",
    {
      project: z.string().describe("Project ID or name to get environments for"),
      name: z.string().optional().describe("Name of the environment to filter"),
      top: z.number().optional().describe("Maximum number of environments to return"),
      continuationToken: z.string().optional().describe("Token for continuing paged results"),
    },
    async ({ project, name, top, continuationToken }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      const environments = await taskAgentApi.getEnvironments(project, name, continuationToken, top);

      return {
        content: [{ type: "text", text: JSON.stringify(environments, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_get,
    "Retrieves details of a specific environment by ID.",
    {
      project: z.string().describe("Project ID or name to get the environment for"),
      environmentId: z.number().describe("ID of the environment to retrieve"),
      expands: z
        .enum(getEnumKeys(EnvironmentExpands) as [string, ...string[]])
        .optional()
        .describe("Include additional details in the response"),
    },
    async ({ project, environmentId, expands }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      const environment = await taskAgentApi.getEnvironmentById(project, environmentId, safeEnumConvert(EnvironmentExpands, expands));

      return {
        content: [{ type: "text", text: JSON.stringify(environment, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_create,
    "Creates a new environment in a project.",
    {
      project: z.string().describe("Project ID or name to create the environment in"),
      name: z.string().describe("Name of the new environment"),
      description: z.string().optional().describe("Description of the new environment"),
    },
    async ({ project, name, description }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      const environment = await taskAgentApi.addEnvironment({ name, description }, project);

      return {
        content: [{ type: "text", text: JSON.stringify(environment, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_update,
    "Updates an existing environment in a project.",
    {
      project: z.string().describe("Project ID or name to update the environment in"),
      environmentId: z.number().describe("ID of the environment to update"),
      name: z.string().optional().describe("New name for the environment"),
      description: z.string().optional().describe("New description for the environment"),
    },
    async ({ project, environmentId, name, description }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      const environment = await taskAgentApi.updateEnvironment({ name, description }, project, environmentId);

      return {
        content: [{ type: "text", text: JSON.stringify(environment, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_delete,
    "Deletes an environment from a project.",
    {
      project: z.string().describe("Project ID or name to delete the environment from"),
      environmentId: z.number().describe("ID of the environment to delete"),
    },
    async ({ project, environmentId }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      await taskAgentApi.deleteEnvironment(project, environmentId);

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Environment ${environmentId} deleted successfully` }, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_get_deployment_records,
    "Retrieves deployment records for a specific environment.",
    {
      project: z.string().describe("Project ID or name to get deployment records for"),
      environmentId: z.number().describe("ID of the environment to get deployment records for"),
      top: z.number().optional().describe("Maximum number of deployment records to return"),
      continuationToken: z.string().optional().describe("Token for continuing paged results"),
    },
    async ({ project, environmentId, top, continuationToken }) => {
      const connection = await connectionProvider();
      const orgUrl = connection.serverUrl;
      let endpoint = `${orgUrl}/${project}/_apis/distributedtask/environments/${environmentId}/environmentdeploymentrecords?api-version=${apiVersion}`;

      if (top !== undefined) {
        endpoint += `&top=${top}`;
      }
      if (continuationToken !== undefined) {
        endpoint += `&continuationToken=${continuationToken}`;
      }

      const token = await tokenProvider();

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "User-Agent": userAgentProvider(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get deployment records: ${response.status} ${errorText}`);
      }

      const deploymentRecords = await response.json();

      return {
        content: [{ type: "text", text: JSON.stringify(deploymentRecords, null, 2) }],
      };
    }
  );
}

export { ENVIRONMENT_TOOLS, configureEnvironmentTools };
