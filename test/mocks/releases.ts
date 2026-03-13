// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export const mockReleaseDefinitions = [
  {
    id: 1,
    name: "Release Pipeline",
    path: "\\",
    projectReference: { id: "proj1", name: "Test Project" },
  },
  {
    id: 2,
    name: "Deploy to Prod",
    path: "\\Production",
    projectReference: { id: "proj1", name: "Test Project" },
  },
];

export const mockReleaseDefinition = {
  id: 1,
  name: "Release Pipeline",
  path: "\\",
  environments: [
    { id: 1, name: "Dev", rank: 1 },
    { id: 2, name: "Prod", rank: 2 },
  ],
  artifacts: [],
  triggers: [],
};

export const mockReleaseDefinitionRevisions = [
  { definitionId: 1, revision: 1, changedDate: "2025-01-01T00:00:00Z", changeType: "add" },
  { definitionId: 1, revision: 2, changedDate: "2025-01-02T00:00:00Z", changeType: "update" },
];

export const mockReleases = [
  {
    id: 10,
    name: "Release-1",
    status: "active",
    releaseDefinition: { id: 1, name: "Release Pipeline" },
    environments: [],
  },
  {
    id: 11,
    name: "Release-2",
    status: "draft",
    releaseDefinition: { id: 1, name: "Release Pipeline" },
    environments: [],
  },
];

export const mockRelease = {
  id: 10,
  name: "Release-1",
  status: "active",
  releaseDefinition: { id: 1, name: "Release Pipeline" },
  environments: [
    { id: 1, name: "Dev", status: "succeeded" },
    { id: 2, name: "Prod", status: "notStarted" },
  ],
  artifacts: [],
};

export const mockCreatedRelease = {
  id: 12,
  name: "Release-3",
  status: "draft",
  releaseDefinition: { id: 1, name: "Release Pipeline" },
};

export const mockReleaseLogs = {
  value: [
    { id: 1, name: "Initialize", logUrl: "https://vsrm.dev.azure.com/org/proj/_apis/release/releases/10/logs/1" },
    { id: 2, name: "Deploy", logUrl: "https://vsrm.dev.azure.com/org/proj/_apis/release/releases/10/logs/2" },
  ],
};

export const mockDeployments = [
  {
    id: 1,
    releaseId: 10,
    releaseDefinition: { id: 1, name: "Release Pipeline" },
    releaseEnvironment: { id: 1, name: "Dev" },
    deploymentStatus: "succeeded",
    operationStatus: "phaseSucceeded",
  },
];

export const mockApprovals = [
  {
    id: 100,
    releaseId: 10,
    releaseEnvironment: { id: 1, name: "Dev" },
    status: "pending",
    approver: { displayName: "John Doe" },
  },
];

export const mockUpdatedApproval = {
  id: 100,
  status: "approved",
  comments: "Looks good",
};

export const mockUpdatedEnvironment = {
  id: 1,
  name: "Dev",
  status: "inProgress",
};
