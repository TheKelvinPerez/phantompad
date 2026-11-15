{
  "targets": [{
    "target_name": "panel",
    "sources": ["native/panel.mm"],
    "conditions": [["OS=='mac'", {
      "xcode_settings": {
        "CLANG_ENABLE_OBJC_ARC": "YES",
        "MACOSX_DEPLOYMENT_TARGET": "12.0",
        "OTHER_LDFLAGS": ["-framework", "AppKit"]
      }
    }]]
  }]
}
