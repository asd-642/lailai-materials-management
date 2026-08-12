(function (root) {
  "use strict";

  if (!root) return;
  const deploymentProvenance = Object.freeze(
  {
    "schema": "lailai-materials-management-runtime-public-config-provenance/v1",
    "builderContractVersion": "lailai-materials-management-public-config-builder/v2",
    "deploymentManifestTaskId": "20260812-06-029",
    "renameContractVersion": "lailai-materials-management-remote-rename/v2",
    "repositorySlug": "lailai-materials-management",
    "pagesBaseUrl": "https://asd-642.github.io/lailai-materials-management/",
    "passwordRecoveryRedirectUrl": "https://asd-642.github.io/lailai-materials-management/supabase-password-recovery.html"
  }
  );
  Object.defineProperty(root, "MaterialsQuoteSupabaseRuntimeDeploymentProvenance", {
    configurable: true,
    enumerable: false,
    value: deploymentProvenance,
    writable: false
  });

  const initializer = root.MaterialsQuoteSupabaseRuntimeConfig;
  if (!initializer || typeof initializer.initialize !== "function") return;

  initializer.initialize(
  {
    "schema": "materials-quote-supabase-runtime-public-config/v2",
    "enabled": true,
    "projectUrl": "https://augtokdenohtzjkrgdek.supabase.co",
    "publishableKey": "sb_publishable_9hNIesnb8gM0P_-z0U1WbQ_8EgCMn6d",
    "expectedProjectRef": "augtokdenohtzjkrgdek",
    "organizationId": "24be5d69-fed7-4677-9696-063353069b97",
    "organizationSlug": "lai-lai-materials",
    "passwordRecoveryRedirectUrl": "https://asd-642.github.io/lailai-materials-management/supabase-password-recovery.html",
    "expectedPreviousRevision": 0,
    "approvedArtifacts": {
      "prePushGateSha256": "9AA7F703C3282441AC6892AB9AFD20BADA0E5713958FAB175C1CF5D3BAD721AF",
      "postPushGateSha256": "69CFBC59C664C378DE498089031084BABD3CFC599C83AD8F9D099A827E2D98D5",
      "authorityBaselineSha256": "6A738FEBAADB2F8E9523ABF15C196C0030354833A40D1BB481675F6F93EBAA66",
      "authorityManifestSha256": "578026A1C892B9129C42946B1E05C709DFAB762A5406F41FFD0E7A51A0721A1A"
    }
  }
  );
})(typeof globalThis !== "undefined" ? globalThis : this);
