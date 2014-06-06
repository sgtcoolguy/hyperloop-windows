/**
 * Windows
 */

#ifndef __HYPERLOOPWIN__HEADER__
#define __HYPERLOOPWIN__HEADER__

#include <inspectable.h>

#define CHECK_EXCEPTION_LOG_WINDOWS(ctx, exception)\
if (exception != nullptr) {\
	Logger::log(HyperloopWindowsGetPlatformString(ctx, exception));\
}

std::wstring HyperloopWindowsGetWString(JSStringRef sValue);
std::wstring HyperloopWindowsGetWString(JSContextRef ctx, JSValueRef ref);
std::string HyperloopWindowsGetSStr(Platform::String^ string);
const char* HyperloopWindowsGetCStr(Platform::String^ string);
char* HyperloopWindowsGetCStr(JSContextRef ctx, JSValueRef ref);
Platform::String^ HyperloopWindowsGetPlatformString(std::string s_str);
Platform::String^ HyperloopWindowsGetPlatformString(JSStringRef sValue);
Platform::String^ HyperloopWindowsGetPlatformString(JSContextRef ctx, JSStringRef ref);
Platform::String^ HyperloopWindowsGetPlatformString(JSContextRef ctx, JSValueRef ref);
JSStringRef HyperloopWindowsGetJSStringRef(char *c_str, int length);
JSStringRef HyperloopWindowsGetJSStringRef(Platform::String^ string);
JSValueRef HyperloopWindowsGetJSValueRef(JSContextRef ctx, Platform::String^ string);

typedef Hyperloop::NativeObject<Platform::Object^> * NativeWindowsObject;

template<class T>
void Hyperloop::NativeObject<T>::release()
{
	this->object = nullptr;
}

template<class T>
void Hyperloop::NativeObject<T>::retain()
{
}

template<class T>
bool Hyperloop::NativeObject<T>::hasInstance(JSContextRef ctx, JSValueRef other, JSValueRef* exception)
{
	return false;
}

template<class T>
std::string Hyperloop::NativeObject<T>::toString(JSContextRef ctx, JSValueRef* exception)
{
	return HyperloopWindowsGetSStr(this->getObject()->ToString());
}

template<class T>
double Hyperloop::NativeObject<T>::toNumber(JSContextRef ctx, JSValueRef* exception)
{
	return (double)dynamic_cast<Platform::Object^>(this->getObject());
}

template<class T>
bool Hyperloop::NativeObject<T>::toBoolean(JSContextRef ctx, JSValueRef* exception)
{
	return (bool)dynamic_cast<Platform::Object^>(this->getObject());
}

IInspectable* HyperloopWindowsObjectToPointer(Platform::Object^ o);

#endif
 
