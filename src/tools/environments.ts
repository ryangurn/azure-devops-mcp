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
  environments_get_kubernetes_resource: "environments_get_kubernetes_resource",
  environments_add_kubernetes_resource: "environments_add_kubernetes_resource",
  environments_delete_kubernetes_resource: "environments_delete_kubernetes_resource",
  environments_add_vm_resource: "environments_add_vm_resource",
  environments_update_vm_resource: "environments_update_vm_resource",
  environments_delete_vm_resource: "environments_delete_vm_resource",
};

function configureEnvironmentTools(server: McpServer, tokenProvider: () => Promise<string>, connectionProvider: () => Promise<WebApi>, userAgentProvider: () => string) {
  server.tool(
    ENVIRONMENT_TOOLS.environments_list,
    "Retrieves a list of environments for a given project.",
    {
      project: z.string().describe("Project ID or name to get environments for"),
      name: z.string().optional().describe("Name of the environment to filter"),
      top: z.coerce.number().optional().describe("Maximum number of environments to return"),
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
      environmentId: z.coerce.number().describe("ID of the environment to retrieve"),
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
      environmentId: z.coerce.number().describe("ID of the environment to update"),
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
      environmentId: z.coerce.number().describe("ID of the environment to delete"),
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
      environmentId: z.coerce.number().describe("ID of the environment to get deployment records for"),
      top: z.coerce.number().optional().describe("Maximum number of deployment records to return"),
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

  server.tool(
    ENVIRONMENT_TOOLS.environments_get_kubernetes_resource,
    "Retrieves a Kubernetes resource for a specific environment.",
    {
      project: z.string().describe("Project ID or name"),
      environmentId: z.coerce.number().describe("ID of the environment"),
      resourceId: z.coerce.number().describe("ID of the Kubernetes resource"),
    },
    async ({ project, environmentId, resourceId }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      const resource = await taskAgentApi.getKubernetesResource(project, environmentId, resourceId);

      return {
        content: [{ type: "text", text: JSON.stringify(resource, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_add_kubernetes_resource,
    "Adds a Kubernetes resource to an environment.",
    {
      project: z.string().describe("Project ID or name"),
      environmentId: z.coerce.number().describe("ID of the environment"),
      name: z.string().describe("Name of the Kubernetes resource"),
      clusterName: z.string().optional().describe("Name of the Kubernetes cluster"),
      namespace: z.string().describe("Kubernetes namespace"),
      serviceEndpointId: z.string().describe("ID of the service endpoint for the cluster"),
      tags: z.array(z.string()).optional().describe("Tags for the Kubernetes resource"),
    },
    async ({ project, environmentId, name, clusterName, namespace, tags, serviceEndpointId }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      const resource = await taskAgentApi.addKubernetesResource({ name, clusterName, namespace, tags, serviceEndpointId } as any, project, environmentId);

      return {
        content: [{ type: "text", text: JSON.stringify(resource, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_delete_kubernetes_resource,
    "Deletes a Kubernetes resource from an environment.",
    {
      project: z.string().describe("Project ID or name"),
      environmentId: z.coerce.number().describe("ID of the environment"),
      resourceId: z.coerce.number().describe("ID of the Kubernetes resource to delete"),
    },
    async ({ project, environmentId, resourceId }) => {
      const connection = await connectionProvider();
      const taskAgentApi = await connection.getTaskAgentApi();
      await taskAgentApi.deleteKubernetesResource(project, environmentId, resourceId);

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Kubernetes resource ${resourceId} deleted successfully` }, null, 2) }],
      };
    }
  );

  // VM resource tools use REST calls instead of the SDK because the SDK's
  // VirtualMachineGroup methods have broken route mappings.
  // Note: Individual VM resources can be viewed via environments_get with expands=ResourceReferences.
  // There is no public REST endpoint for getting individual VM resources by ID.
  server.tool(
    ENVIRONMENT_TOOLS.environments_add_vm_resource,
    "Adds a virtual machine resource group to an environment.",
    {
      project: z.string().describe("Project ID or name"),
      environmentId: z.coerce.number().describe("ID of the environment"),
      name: z.string().describe("Name of the virtual machine resource group"),
    },
    async ({ project, environmentId, name }) => {
      const connection = await connectionProvider();
      const orgUrl = connection.serverUrl;
      const endpoint = `${orgUrl}/${project}/_apis/distributedtask/environments/${environmentId}/providers/virtualmachinegroups?api-version=${apiVersion}`;
      const token = await tokenProvider();

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "User-Agent": userAgentProvider(),
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add virtual machine resource group: ${response.status} ${errorText}`);
      }

      const resource = await response.json();

      return {
        content: [{ type: "text", text: JSON.stringify(resource, null, 2) }],
      };
    }
  );

  // Tag updates use the internal Contribution HierarchyQuery API because there is
  // no public REST endpoint for updating environment resource tags. This is the same
  // API the Azure DevOps web UI uses when editing tags in the browser.
  server.tool(
    ENVIRONMENT_TOOLS.environments_update_vm_resource,
    "Updates tags on a virtual machine environment resource using the Contribution API.",
    {
      project: z.string().describe("Project ID or name"),
      environmentId: z.coerce.number().describe("ID of the environment"),
      resourceId: z.coerce.number().describe("ID of the virtual machine resource to update"),
      tags: z.array(z.string()).describe("Complete set of tags for the resource (replaces all existing tags)"),
    },
    async ({ project, environmentId, resourceId, tags }) => {
      const connection = await connectionProvider();
      const orgUrl = connection.serverUrl;
      const endpoint = `${orgUrl}/_apis/Contribution/HierarchyQuery`;
      const token = await tokenProvider();

      const body = {
        contributionIds: ["ms.vss-environments-web.environment-resources-tag-update-data-provider"],
        dataProviderContext: {
          properties: {
            resourceId: String(resourceId),
            resourceType: "2",
            newTagsSet: tags,
            sourcePage: {
              url: `${orgUrl}/${project}/_environments/${environmentId}?view=resources`,
              routeId: "ms.vss-environments-web.environments-route-with-id",
              routeValues: {
                project: project,
                environmentId: String(environmentId),
                viewname: "environment",
                controller: "ContributedPage",
                action: "Execute",
              },
            },
          },
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json;api-version=5.0-preview.1;excludeUrls=true;enumsAsNumbers=true;msDateFormat=true;noArrayWrap=true",
          "Authorization": `Bearer ${token}`,
          "User-Agent": userAgentProvider(),
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update resource tags: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const updatedResource = result?.dataProviders?.["ms.vss-environments-web.environment-resources-tag-update-data-provider"];

      return {
        content: [{ type: "text", text: JSON.stringify(updatedResource ?? result, null, 2) }],
      };
    }
  );

  server.tool(
    ENVIRONMENT_TOOLS.environments_delete_vm_resource,
    "Deletes a virtual machine resource group from an environment.",
    {
      project: z.string().describe("Project ID or name"),
      environmentId: z.coerce.number().describe("ID of the environment"),
      resourceId: z.coerce.number().describe("ID of the virtual machine resource group to delete"),
    },
    async ({ project, environmentId, resourceId }) => {
      const connection = await connectionProvider();
      const orgUrl = connection.serverUrl;
      const endpoint = `${orgUrl}/${project}/_apis/distributedtask/environments/${environmentId}/providers/virtualmachinegroups/${resourceId}?api-version=${apiVersion}`;
      const token = await tokenProvider();

      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": userAgentProvider(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete virtual machine resource group: ${response.status} ${errorText}`);
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ success: true, message: `Virtual machine resource group ${resourceId} deleted successfully` }, null, 2) }],
      };
    }
  );
}

export { ENVIRONMENT_TOOLS, configureEnvironmentTools };
