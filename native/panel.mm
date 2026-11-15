#import <AppKit/AppKit.h>
#include <node_api.h>

static napi_value Configure(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value args[1];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  void *bytes = nullptr;
  size_t length = 0;
  if (argc != 1 || napi_get_buffer_info(env, args[0], &bytes, &length) != napi_ok || length != sizeof(void *)) {
    napi_throw_type_error(env, nullptr, "Expected an Electron native window handle");
    return nullptr;
  }
  NSView *view = (__bridge NSView *)*(void **)bytes;
  NSWindow *window = view.window;
  if (!window) {
    napi_throw_error(env, nullptr, "Native window is unavailable");
    return nullptr;
  }
  // AeroSpace manages AXStandardWindow panels even when they join every Space.
  window.accessibilitySubrole = NSAccessibilityUnknownSubrole;
  window.accessibilityCloseButton = nil;
  napi_value result;
  napi_create_string_utf8(env, window.accessibilitySubrole.UTF8String, NAPI_AUTO_LENGTH, &result);
  return result;
}

static napi_value Init(napi_env env, napi_value exports) {
  napi_value configure;
  napi_create_function(env, "configure", NAPI_AUTO_LENGTH, Configure, nullptr, &configure);
  napi_set_named_property(env, exports, "configure", configure);
  return exports;
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
