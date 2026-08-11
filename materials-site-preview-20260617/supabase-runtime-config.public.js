(function (root) {
  "use strict";

  const initializer = root && root.MaterialsQuoteSupabaseRuntimeConfig;
  if (!initializer || typeof initializer.initialize !== "function") return;

  initializer.initialize(
  {
    "schema": "materials-quote-supabase-runtime-public-config/v1",
    "enabled": true,
    "projectUrl": "https://augtokdenohtzjkrgdek.supabase.co",
    "publishableKey": "sb_publishable_9hNIesnb8gM0P_-z0U1WbQ_8EgCMn6d",
    "expectedProjectRef": "augtokdenohtzjkrgdek",
    "organizationId": "24be5d69-fed7-4677-9696-063353069b97",
    "organizationSlug": "lai-lai-materials",
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
