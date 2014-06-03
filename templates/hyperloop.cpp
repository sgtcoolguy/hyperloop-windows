/**
 * Windows
 */

#include <iostream>
#include <string>
#include <inspectable.h>

/*
 * Windows object specialization
 */

template <>
void Hyperloop::NativeObject<Platform::Object^>::release()
{

}

template <>
void Hyperloop::NativeObject<Platform::Object^>::retain()
{

}

template<>
bool Hyperloop::NativeObject<Platform::Object^>::hasInstance(JSContextRef ctx, JSValueRef other, JSValueRef* exception)
{
	return false;
}

template<>
std::string Hyperloop::NativeObject<Platform::Object^>::toString(JSContextRef ctx, JSValueRef* exception)
{
	return nullptr;
}

template<>
double Hyperloop::NativeObject<Platform::Object^>::toNumber(JSContextRef ctx, JSValueRef* exception)
{
	return NAN;
}

template<>
bool Hyperloop::NativeObject<Platform::Object^>::toBoolean(JSContextRef ctx, JSValueRef* exception)
{
	return false;
}

IInspectable* HyperloopWindowsObjectToPointer(Platform::Object^ o) {
	return reinterpret_cast<IInspectable*>(o);
}

/**
 * native implementation of the logger
 */
void HyperloopNativeLogger(const char *str)
{
    std::cout << str << std::endl;
}

