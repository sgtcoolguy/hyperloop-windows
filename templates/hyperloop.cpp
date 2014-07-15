/**
 * Windows
 */
#include <iostream>
#include <string>
#include <inspectable.h>
#include "Logger.h"

std::wstring HyperloopWindowsGetWString(JSStringRef sValue) {
	size_t sLength = JSStringGetMaximumUTF8CStringSize(sValue);
	char* cValue = new char[sLength];
	JSStringGetUTF8CString(sValue, cValue, sLength);
	std::string s_str = cValue;
	std::wstring w_str(s_str.begin(), s_str.end());
	delete[] cValue;
	return w_str;
}

std::wstring HyperloopWindowsGetWString(JSContextRef ctx, JSValueRef ref) {
	JSStringRef sValue = JSValueToStringCopy(ctx, ref, NULL);
	std::wstring str = HyperloopWindowsGetWString(sValue);
	JSStringRelease(sValue);
	return str;
}

std::string HyperloopWindowsGetSStr(Platform::String^ string) {
	return std::string(string->Begin(), string->End());
}

const char* HyperloopWindowsGetCStr(Platform::String^ string) {
	return std::string(string->Begin(), string->End()).c_str();
}

/*
 * return chars from JSValueRef. This allocates new chars
 * so caller should be responsible for deleting it.
 */
char* HyperloopWindowsGetCStr(JSContextRef ctx, JSValueRef ref) {
	JSStringRef sValue = JSValueToStringCopy(ctx, ref, NULL);
	std::wstring w_str = HyperloopWindowsGetWString(sValue);
	JSStringRelease(sValue);
	std::string s_str(w_str.begin(), w_str.end());
	int length = sizeof(w_str);
	char *c_str = new char[length];
	strcpy_s(c_str, length, s_str.c_str());
	return c_str;
}

Platform::String^ HyperloopWindowsGetPlatformString(std::string s_str) {
	std::wstring b(s_str.begin(), s_str.end());
	const wchar_t *wcString = b.c_str();
	return ref new Platform::String(wcString);
}

Platform::String^ HyperloopWindowsGetPlatformString(JSStringRef sValue) {
	size_t sLength = JSStringGetMaximumUTF8CStringSize(sValue);
	char* cValue = new char[sLength];
	JSStringGetUTF8CString(sValue, cValue, sLength);
	std::string s_str = cValue;
	std::wstring w_str(s_str.begin(), s_str.end());
	delete[] cValue;
	return ref new Platform::String(HyperloopWindowsGetWString(sValue).c_str());
}

Platform::String^ HyperloopWindowsGetPlatformString(JSContextRef ctx, JSStringRef ref) {
	return HyperloopWindowsGetPlatformString(ref);
}

Platform::String^ HyperloopWindowsGetPlatformString(JSContextRef ctx, JSValueRef ref) {
	JSValueRef exception = NULL;
	JSStringRef sValue = JSValueToStringCopy(ctx, ref, &exception);
	Platform::String^ str = HyperloopWindowsGetPlatformString(sValue);
	JSStringRelease(sValue);
	return str;
}

JSStringRef HyperloopWindowsGetJSStringRef(char *c_str, int length) {
	std::string s_str(c_str, length);
	const char* charStr = s_str.c_str();
	return JSStringCreateWithUTF8CString(charStr);
}

JSStringRef HyperloopWindowsGetJSStringRef(Platform::String^ string) {
	std::wstring w_str(string->Begin());
	std::string s_str(w_str.begin(), w_str.end());
	const char* charStr = s_str.c_str();
	return JSStringCreateWithUTF8CString(charStr);
}

JSValueRef HyperloopWindowsGetJSValueRef(JSContextRef ctx, Platform::String^ string) {
	JSStringRef str = HyperloopWindowsGetJSStringRef(string);
	JSValueRef retVal = JSValueMakeString(ctx, str);
	JSStringRelease(str);
	return retVal;
}

IInspectable* HyperloopWindowsObjectToPointer(Platform::Object^ o) {
	return reinterpret_cast<IInspectable*>(o);
}

/**
 * native implementation of the logger
 */
void HyperloopNativeLogger(const char *str)
{
    Logger::log(HyperloopWindowsGetPlatformString(str));
}

/*
 * Tests whether a JavaScript value is an object constructed by given object, as compared by JS 'instanceof' operator
 */
EXPORTAPI JSValueRef Hyperloop_Binary_InstanceOf(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef* exception) {
    if (argumentCount < 2)
    {
        *exception = HyperloopMakeException(ctx, "Wrong arguments passed to IsInstanceOf");
        return JSValueMakeUndefined(ctx);
    }

    return JSValueMakeBoolean(ctx, false); // TODO
}
