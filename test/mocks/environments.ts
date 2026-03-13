// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const mockEnvironments = [
  {
    id: 1,
    name: "Development",
    description: "Development environment",
    project: { id: "proj1", name: "Test Project" },
  },
  {
    id: 2,
    name: "Production",
    description: "Production environment",
    project: { id: "proj1", name: "Test Project" },
  },
];

export const mockEnvironment = {
  id: 1,
  name: "Development",
  description: "Development environment",
  project: { id: "proj1", name: "Test Project" },
  resources: [],
};

export const mockCreatedEnvironment = {
  id: 3,
  name: "Staging",
  description: "Staging environment",
  project: { id: "proj1", name: "Test Project" },
};

export const mockUpdatedEnvironment = {
  id: 1,
  name: "Dev Updated",
  description: "Updated description",
  project: { id: "proj1", name: "Test Project" },
};

export const mockDeploymentRecords = {
  value: [
    {
      id: 1,
      environmentId: 1,
      result: "succeeded",
      startTime: "2025-01-01T00:00:00Z",
      finishTime: "2025-01-01T00:10:00Z",
      owner: { id: "pipeline-1", name: "CI Pipeline" },
    },
    {
      id: 2,
      environmentId: 1,
      result: "failed",
      startTime: "2025-01-02T00:00:00Z",
      finishTime: "2025-01-02T00:05:00Z",
      owner: { id: "pipeline-2", name: "CD Pipeline" },
    },
  ],
  count: 2,
};

export const mockKubernetesResource = {
  id: 10,
  name: "k8s-dev",
  clusterName: "dev-cluster",
  namespace: "default",
  serviceEndpointId: "endpoint-1",
  tags: ["dev", "kubernetes"],
  type: "kubernetes",
  environmentReference: { id: 1, name: "Development" },
};

export const mockVirtualMachineGroup = {
  id: 20,
  name: "vm-pool-dev",
  tags: ["dev", "vm"],
  type: "virtualMachine",
  environmentReference: { id: 1, name: "Development" },
  poolId: 5,
};

export const mockUpdatedVirtualMachineGroup = {
  id: 20,
  name: "vm-pool-updated",
  tags: ["staging", "vm"],
  type: "virtualMachine",
  environmentReference: { id: 1, name: "Development" },
  poolId: 5,
};
