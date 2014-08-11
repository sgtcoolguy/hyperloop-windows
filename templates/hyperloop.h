/**
 * Windows
 */

#ifndef __HYPERLOOPWIN__HEADER__
#define __HYPERLOOPWIN__HEADER__

#include <inspectable.h>

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
void HyperloopWindowsPlatformLogger(Platform::String^ o);

// Platform::String^ specialization

template<>
inline void Hyperloop::NativeObject<Platform::String^>::release()
{
	this->object = nullptr;
}

template<>
inline void Hyperloop::NativeObject<Platform::String^>::retain()
{
}

template<>
inline bool Hyperloop::NativeObject<Platform::String^>::hasInstance(JSContextRef ctx, JSValueRef other, JSValueRef* exception)
{
	return false;
}

template<>
inline std::string Hyperloop::NativeObject<Platform::String^>::toString(JSContextRef ctx, JSValueRef* exception)
{
	if (this->getObject() == nullptr) 
	{
		return "";
	}
	return HyperloopWindowsGetSStr(this->getObject());
}

template<>
inline double Hyperloop::NativeObject<Platform::String^>::toNumber(JSContextRef ctx, JSValueRef* exception)
{
	if (this->getObject() == nullptr) 
	{
		*exception = HyperloopMakeException(ctx, "Can't convert to number");
		return NAN;
	}
	try
	{
		return std::stod(this->getObject()->Data());
	}
	catch (std::invalid_argument)
	{
		*exception = HyperloopMakeException(ctx, "Can't convert to number");
		return NAN;
	}
}

template<>
inline bool Hyperloop::NativeObject<Platform::String^>::toBoolean(JSContextRef ctx, JSValueRef* exception)
{
	if (this->getObject() == nullptr) 
	{
		*exception = HyperloopMakeException(ctx, "Can't convert to boolean");
		return false;
	}
	return !this->getObject()->IsEmpty();
}

// Platform class specialization

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
	if (this->getObject() == nullptr) 
	{
		return "";
	}
	else 
	{
		return HyperloopWindowsGetSStr(this->getObject()->ToString());
	}
}

template<class T>
double Hyperloop::NativeObject<T>::toNumber(JSContextRef ctx, JSValueRef* exception)
{
	if (this->getObject() == nullptr) 
	{
		*exception = HyperloopMakeException(ctx, "Can't convert to number");
		return NAN;
	}
	else {
		return (double)dynamic_cast<Platform::Object^>(this->getObject());
	}
}

template<class T>
bool Hyperloop::NativeObject<T>::toBoolean(JSContextRef ctx, JSValueRef* exception)
{
	if (this->getObject() == nullptr) 
	{
		*exception = HyperloopMakeException(ctx, "Can't convert to boolean");
		return false;
	}
	else 
	{
		return (bool)dynamic_cast<Platform::Object^>(this->getObject());
	}
}

IInspectable* HyperloopWindowsObjectToPointer(Platform::Object^ o);

#endif
 
